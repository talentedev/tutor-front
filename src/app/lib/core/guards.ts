import {Injectable} from '@angular/core';
import {
    ActivatedRouteSnapshot,
    CanActivate,
    CanDeactivate,
    Router,
    RouterStateSnapshot,
    UrlTree
} from '@angular/router';
import {Observable} from 'rxjs';
import { VirtualClassRoomComponent } from '../../class-room/virtual-class-room/virtual-class-room.component';
import { Auth } from "./auth";
import { ROUTE_DASHBOARD, ROUTE_LOGIN } from "../../../routes";
import { map } from "rxjs/operators";
import { User } from "../../models";
import { toQueryString } from "./utils";

export type CanDeactivateResponse = Observable<boolean> | Promise<boolean> | boolean;

export interface CanDeactivateComponent {
    canDeactivate: () => CanDeactivateResponse;
}

@Injectable()
export class CanDeactivateGuard implements CanDeactivate<CanDeactivateComponent> {
    canDeactivate(component: CanDeactivateComponent,
                  currentRoute: ActivatedRouteSnapshot,
                  currentState: RouterStateSnapshot,
                  nextState?: RouterStateSnapshot): CanDeactivateResponse {
        return component.canDeactivate ? component.canDeactivate() : true;
    }

}

@Injectable()
export class HomePageGuard implements CanActivate {
    constructor(private router: Router, private auth: Auth) {
    }
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        return this.auth.isLoggedInAsync().pipe(
            map((logged: boolean) => (
                logged ? this.router.parseUrl(ROUTE_DASHBOARD) : true
            ))
        )
    }
}

@Injectable()
export class AdminGuard implements CanActivate {
    constructor(private router: Router, private auth: Auth) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        return this.auth.me.pipe(
            map((me: User | null) => (
                me && me.isAdmin() ? true : this.router.parseUrl(ROUTE_LOGIN + `?${toQueryString({next: state.url})}`)
            ))
        )
    }
}

@Injectable()
export class ApplyGuard implements CanActivate {
    constructor(private router: Router, private auth: Auth) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        return this.auth.me.pipe(
            map((me: User | null) => (
                me && (me.isTutor() || me.isAffiliate()) ? this.router.parseUrl(ROUTE_DASHBOARD) : true
            ))
        )
    }
}
