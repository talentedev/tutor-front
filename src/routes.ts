import { InjectionToken } from '@angular/core';

export const ROUTE_HOME = '/'
// Account
export const ROUTE_LOGIN = '/start/login'
export const ROUTE_REDIRECT = '/start/redirect'
export const ROUTE_RECOVER_PASSWORD = '/start/recover-password'
export const ROUTE_CHANGE_PASSWORD = '/start/change-password'
export const ROUTE_REGISTER_STUDENT = '/start/register';
export const ROUTE_REGISTER_AFFILIATE = '/start/register/affiliate';
export const ROUTE_REGISTER_WELCOME = "/start/register/welcome"
export const ROUTE_PROMO_CODE = 'promo/:code'
export const ROUTE_DASHBOARD = "/main/dashboard"
export const ROUTE_TUTORS = '/main/tutors'
export const ROUTE_CALENDAR = '/main/account/calendar'

export const ROUTE_REFERRALS = '/referrals'
export interface IRoutes {
    [key: string]: string
}
export const APP_ROUTES = new InjectionToken('APP_ROUTES');
const APP_ROUTES_ = {
    ROUTE_HOME,
    ROUTE_LOGIN,
    ROUTE_REDIRECT,
    ROUTE_RECOVER_PASSWORD,
    ROUTE_CHANGE_PASSWORD,
    ROUTE_REGISTER_STUDENT,
    ROUTE_REGISTER_WELCOME,
    ROUTE_PROMO_CODE,
    ROUTE_DASHBOARD,
    ROUTE_TUTORS,
    ROUTE_CALENDAR,
    ROUTE_REFERRALS,
};

export const AppRoutesProvider = {
    provide: APP_ROUTES,
    useValue: APP_ROUTES_
}