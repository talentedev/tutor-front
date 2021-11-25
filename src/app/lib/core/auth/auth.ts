import { Inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, map, share } from 'rxjs/operators';
import { User } from '../../../models';
import { TokenStorage } from './';
import { Backend } from './backend';
import { Token } from './common';
import isNull from 'lodash-es/isNull';
import isUndefined from 'lodash-es/isUndefined';
import { Router } from '@angular/router';

export const TOKEN_STORAGE = new InjectionToken('TOKEN_STORAGE');

@Injectable({providedIn: 'root'})
export class Auth {
    private _me = new BehaviorSubject<User | null>(null);
    
    get me(): BehaviorSubject<User | null> {
        return this._me;
    }

    constructor(private _backend: Backend,
                private router: Router,
                @Inject(TOKEN_STORAGE) private _tokenStorage: TokenStorage) {
    }

    /**
     * Authenticate user
     * @param username string
     * @param password string
     */
    public login(username: string, password: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this._backend.auth(username, password).subscribe(
                (token: Token) => {
                    if (token) {
                        this._tokenStorage.put(token).then(() => {
                            this.refresh().then(resolve);
                        });
                    }
                },
                (error: any) => reject(error)
            );
        });
    }

    /**
     * Authenticate user via Google
     * @param username string
     * @param password string
     */
    public googleLogin(code: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this._backend.googleAuth(code).subscribe(
                (token: Token) => {
                    if (token) {
                        this._tokenStorage.put(token).then(() => {
                            resolve();
                            this.refresh();
                        });
                    }
                },
                (error: any) => reject(error)
            );
        });
    }

    /**
     * Authenticate user via Google
     * @param username string
     * @param password string
     */
    public socialLogin(token: Token): Promise<void> {
        return new Promise((resolve, reject) => {
            if (token) {
                this._tokenStorage.put(token).then(() => {
                    resolve();
                    this.refresh();
                });
            }
        });
    }

    /**
     * Verify if user authenticated
     */
    public isLoggedIn(): boolean {
        return this._me.getValue() != null;
    }

    /**
     * Verify if user authenticated
     */
    public isLoggedInAsync(): Observable<boolean> {
        return this._me.pipe(
            map(user => {
                return !(isNull(user) || isUndefined(user))
            }),
            catchError(err => of(false)),
        );
    }

    /**
     * Logout
     */
    public logout() {
        // Set Google Tag Manager data to be passed to Intercom
        window['dataLayer'] = window['dataLayer'] || [];
        window['dataLayer'].push({
            'event': 'sendUserData',
            'user_id': '',
            'email': '',
            'name': '',
            'phone': '',
            'avatar': ''
        });

        this._tokenStorage.destroy();
        this._me.next(null);
        this.router.navigateByUrl('/');
    }

    /**
     * Update current user
     */
    public update(me: User): void {
        if (!me) {
            return;
        }
        this._me.next(me);
    }

    getMe(): Observable<User> {
        return this._backend.get<User>('@api/me').pipe(share(), map((data: any) => new User(data)));
    }

    refresh(): Promise<void> {
        return new Promise((resolve => {
            this.getMe().subscribe(
                me => {
                    this._me.next(me);
                    resolve();
                },
                () => resolve()
            );
        }))
    }
}
