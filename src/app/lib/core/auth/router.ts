import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Resolve, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { User } from 'app/models';
import { ROUTE_DASHBOARD, ROUTE_LOGIN } from 'routes';
import { Observable } from 'rxjs/Observable';
import { Auth } from './auth';
import { filter, map, take, timeout } from 'rxjs/operators';
import { toQueryString } from '../utils';

@Injectable()
export class UserResolver implements Resolve<User> {

    constructor(private auth: Auth) {
    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<User> | Promise<User> | User {
        return this.auth.me.pipe(
            filter(Boolean),
            take(1)
        ) as Observable<User>;
    }
}


@Injectable()
export class LoggedUserGuard implements CanActivate {

    constructor(private auth: Auth, private router: Router) {
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean> | boolean | UrlTree {
        return this.auth.isLoggedInAsync().pipe(
            map((logged): boolean | UrlTree => {
                return logged ? true : this.router.parseUrl(`${ROUTE_LOGIN}?${toQueryString({ redirect: state.url })}`);
            }),
        );
    }
}

@Injectable()
export class ExpectedAffiliateGuard implements CanActivate {
    constructor(private auth: Auth, private _router: Router) {
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
        return this.auth.me.pipe(
            filter(Boolean),
            map((user: User) => {
                if (user.isAffiliate()) {
                    return true;
                } else {
                    return this._router.parseUrl(ROUTE_DASHBOARD);
                }
            }),
        );
    }
}

@Injectable()
export class ExpectedRegularUserGuard implements CanActivate {

    constructor(private auth: Auth, private router: Router) {
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
        return this.auth.me.pipe(
            filter(Boolean),
            timeout(1000),
            map((user: User) => {
                if (!user.isAffiliate()) {
                    return true;
                }
                return this.router.parseUrl(ROUTE_DASHBOARD);
            }),
        );
    }
}
