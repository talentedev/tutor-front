import { EventEmitter, Inject, Injectable, InjectionToken, Optional } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Cookie } from '../common/cookie';
import { Token } from './common';

export interface TokenStorage {

    get(): Promise<string>;

    put(token: Token): Promise<void>;

    destroy(): Promise<void>;

    change(): Observable<boolean>;
}

export const STORAGE_TOKEN_NAME = new InjectionToken('STORAGE_TOKEN_NAME');

@Injectable()
export class TokenLocalStorage implements TokenStorage {

    onChange: EventEmitter<boolean> = new EventEmitter<boolean>(true)

    token: string;

    get(): Promise<string> {
        if (this.token) {
            return Promise.resolve(this.token);
        }

        return Promise.resolve(localStorage.getItem('token'));
    }

    put(token: Token): Promise<void> {

        return new Promise(resolve => {
            localStorage.setItem('token', token.access_token);
            this.token = token.access_token
            this.onChange.emit(true)
            resolve()
        })
    }

    destroy(): Promise<void> {
        return new Promise(() => {
            this.token = null;
            localStorage.removeItem('token');
            this.onChange.emit(false)
        });
    }

    change(): Observable<boolean> {
        return this.onChange.asObservable();
    }
}

@Injectable()
export class CookieTokenStorage implements TokenStorage {

    private readonly name: string;

    private changeEventEmitter: EventEmitter<boolean>;

    private token: string;

    constructor(@Optional() @Inject(STORAGE_TOKEN_NAME) name: string) {
        this.name = name || 'token';
        this.changeEventEmitter = new EventEmitter<boolean>(true);

        const search = window.location.search.substring(1);

        if (search) {
            const params = new URLSearchParams(search);

            if (params.has('access_token')) {
                this.token = params.get('access_token')
                Cookie.put(this.name, params.get('access_token'), this.domain, 1);
            }
        }
    }

    get(): Promise<string> {
        return new Promise(resolve => {

            if (this.token) {
                return this.token;
            }

            resolve(Cookie.get(this.name));
        })
    }

    put(token: Token): Promise<void> {
        return new Promise(resolve => {
            this.token = token.access_token
            const expire = new Date();
            expire.setSeconds(expire.getSeconds() + token.expires_in);
            Cookie.put(this.name, token.access_token, this.domain, expire);
            this.changeEventEmitter.next(true);
            resolve()
        })
    }

    destroy(): Promise<void > {
        return new Promise(resolve => {
            this.token = '';
            Cookie.put(this.name, '', this.domain, -1);
            Cookie.delete(this.name, this.domain);
            this.changeEventEmitter.next(false);
            resolve()
        })
    }

    change(): Observable < boolean > {
        return this.changeEventEmitter.asObservable();
    }

    get domain(): string {
        return window.location.hostname
    }
}
