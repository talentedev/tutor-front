import { animate, state, style, transition, trigger } from '@angular/animations';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountService } from '@services/account';
import { AlertRef, AlertService } from '@services/alerts';
import { Platform } from '@services/platform';
import { SocialService } from '@services/social-service';
import { ROUTE_DASHBOARD, ROUTE_HOME, ROUTE_LOGIN, ROUTE_REDIRECT, ROUTE_REGISTER_WELCOME } from 'routes';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Backend } from '../../lib/core/auth';
import {
    HasDigit,
    HasLowercase,
    HasUppercase,
    PasswordMatchValidator,
    PasswordValidator,
} from '../../lib/helpers/validators';

@Component({
    selector: 'learnt-login-page',
    templateUrl: './login-page.component.html',
    styleUrls: ['./login-page.component.scss'],
    animations: [
        trigger('enterTrigger', [
            state('fadeIn', style({opacity: '1', transform: 'translateY(0)'})),
            transition('void => *', [
                style({opacity: '0', transform: 'translateY(-10px)'}),
                animate('1s cubic-bezier(0, 0, 0, 1)')
            ])
        ]),
    ]
})

export class LoginPageComponent implements OnInit, OnDestroy {
    /**
     * Component is available for multiple endpoints, and we differentiate
     * them by the 'mode' in the route data. Available modes:
     * login, recover-password, change-password, register, oauth
     */
    public mode: string;

    /* Referrer code taken from the invite URL */
    public referrerCode: string;

    /* Login form group */
    public loginForm: FormGroup;

    /* Recover password form group */
    public recoverPasswordForm: FormGroup;

    /* Password change form group */
    public passwordChangeForm: FormGroup;

    /* Register form group */
    public registerForm: FormGroup;

    /* Triggers the disabled state of the login button */
    public working = false;

    /* Whether the route is for affiliate users or not */
    public isAffiliate = false;

    private googleClientInitialized = false;

    @HostBinding('class.page-component')
    isPageComponent = true;

    @HostBinding('class.offset-animation')
    skipRouteAnimationPositioning = true;

    @HostBinding('attr.layout')
    layoutColumn = 'column';

    @HostBinding('attr.layout-gt-md')
    layoutRow = 'row';

    /* Redirect URL */
    private redirect: string;

    routeLogin = ROUTE_LOGIN;

    private socialCredentials = {
        "facebook": environment.FacebookAppID,
        "linkedin": environment.LinkedInAppID,
        "google": environment.GoogleAppID
    };

    private scopeOptions = {
        scope: ['email'],
    };

    private isSocial: boolean;

    private socialId: string;

    private network: string;

    private accessToken: string;
    
    state: string;
    private subs = new Subscription();

    get passwordField(): FormControl {
        return this.registerForm.get('password') as FormControl;
    }

    constructor(private backend: Backend,
                private route: ActivatedRoute,
                private alerts: AlertService,
                private account: AccountService,
                private platform: Platform,
                private router: Router,
                private formBuilder: FormBuilder,
                private socialService: SocialService,
                private changeDetectorRef: ChangeDetectorRef) {

        this.mode = this.route.routeConfig.data.mode;
        const isAffiliate = this.route.routeConfig.data.affiliate;
        if (isAffiliate !== undefined && typeof isAffiliate === 'boolean') {
            this.isAffiliate = isAffiliate;
        }

        this.loginForm = this.formBuilder.group({
            email: this.formBuilder.control('', Validators.compose([Validators.required, Validators.email])),
            password: this.formBuilder.control('', Validators.required),
        });

        this.recoverPasswordForm = this.formBuilder.group({
            email: ['', Validators.compose([Validators.required, Validators.email])],
        });

        this.passwordChangeForm = this.formBuilder.group({
            password: ['', Validators.compose([Validators.required, Validators.minLength(8), PasswordValidator])],
            confirmPassword: ['', Validators.required],
        }, {
            validator: PasswordMatchValidator('password', 'confirmPassword')
        });

        this.registerForm = this.formBuilder.group({
            firstName: ['', [Validators.required]],
            lastName: ['', Validators.required],
            email: ['', Validators.compose([Validators.required, Validators.email])],
            password: ['', Validators.compose([
                Validators.required,
                Validators.minLength(8),
                HasUppercase,
                HasLowercase,
                HasDigit,
            ])],
            confirmPassword: ['', Validators.required],
            referrerCode: [''],
        }, {
            updateOn: 'blur',
            validator: PasswordMatchValidator('password', 'confirmPassword')
        });

        this.route.queryParams.subscribe(query => {
            this.redirect = query.redirect;

            if (this.mode === 'change-password' && query.token === undefined) {
                this.router.navigateByUrl(ROUTE_LOGIN);
            }
        });

        this.socialService.init(this.socialCredentials, this.scopeOptions);
        this.isSocial = false;
    }

    ngOnInit(): void {
        
        this.route.queryParams.subscribe(params => {
            const email = params.email;
            const social = params.social;
            if (email !== '') {
                this.registerForm.get('email').setValue(email);
            }
            if (social === 'google') {
                setTimeout(() => this.signUpSocial('google'), 1000);
            }
            if (social === 'facebook') {
                setTimeout(() => this.signUpSocial('facebook'), 1000);
            }
        });

        if (this.route.routeConfig.data.referrer === true) {
            this.referrerCode = this.route.params['value'].code;
            this.registerForm.get('referrerCode').setValue(this.referrerCode);
        }
    }

    ngOnDestroy(): void {
        this.subs.unsubscribe();
    }

    /**
     * Triggered on submitting the login form.
     * @param formEvent
     */
    submitLoginForm(formEvent: any): void {
        formEvent.stopPropagation();
        formEvent.preventDefault();

        this.working = true;
        const payload = this.loginForm.getRawValue();
        payload.email = payload.email.toLowerCase();
        this.account.login(this.loginForm.getRawValue()).then(
            () => {
                this.router.navigateByUrl(this.redirect ? this.redirect : ROUTE_DASHBOARD);
                this.working = false;
            },
            () => {
                this.working = false;
            }
        ).catch(err => console.log(`error logging in: ${err}`));
    }

    signInSocial(network: string): void {
        console.log('login', network);
        const proxy = `${environment.API_HOST}/auth/${network}`
        this.working = true;
        this.subs.add(this.socialService.login(network, {scope: 'email', response_type: 'code', oauth_proxy: proxy, redirect_uri: ROUTE_REDIRECT}).subscribe(
            (data: any) => {
            const resp = data.authResponse;
            this.account.socialLogin(resp).then(
                () => {
                    this.router.navigateByUrl(this.redirect ? this.redirect : ROUTE_DASHBOARD);
                    this.working = false;
                },
                () => {
                    this.working = false;
                }
            ).catch(err => console.log(`error logging in: ${err}`));
        },
        err => {
            console.log(err.error);
            this.working = false;
        }));
    }

    signUpSocial(network: string): void {
        console.log('signup', network);
        const proxy = environment.API_HOST+'/proxy/'+network;
        this.working = true;
        this.subs.add(this.socialService.login(network, {scope: 'email, basic', response_type: 'code', oauth_proxy: proxy, redirect_uri: ROUTE_REDIRECT}).subscribe(
            (res: any) => {
                this.accessToken = res.authResponse.access_token;
                this.subs.add(this.backend.proxyUserInfo(network, res.authResponse.access_token).subscribe(
                (data) => {
                    this.isSocial = true;
                    this.socialId = data.sub;
                    this.network = network;
                    this.registerForm.patchValue({
                        firstName : data.given_name,
                        lastName : data.family_name,
                        email : data.email,
                        password: '',
                        confirmPassword: '',
                    })

                    this.registerForm.controls['password'].disable();
                    this.registerForm.controls['confirmPassword'].disable();
                    this.changeDetectorRef.detectChanges();
                    this.working = false;
                },
                err => {
                    this.working = false;
                    console.log(err.error);
                }));
            },
            err => {
                this.working = false;
                console.log(err.error);
            }));
    }


    public signUpField(key: string): AbstractControl {
        if (key === undefined || key === null) {
            return null;
        }
        return this.registerForm.get(key);
    }

    public hasError(key: string): boolean {
        if (key === undefined === null) {
            return null;
        }
        const input = this.registerForm.get(key);
        return input.errors && (input.dirty || input.touched);
    }

    /**
     * Triggered on submitting the register form.
     * @param formEvent
     */
    public submitRegisterForm(formEvent: any): void {
        formEvent.stopPropagation();
        formEvent.preventDefault();

        this.working = true;

        let alert: AlertRef;
        const alertOpts = {lifetime: 0, buttons: [{label: 'OK', result: true}]};
        const payload = this.registerForm.getRawValue();
        if (this.isSocial) {
            payload['social_id'] = this.socialId;
            payload['network'] = this.network;
            payload['access_token'] = this.accessToken;
        }
        payload['first_name'] = payload['firstName'];
        delete payload['firstName'];
        payload['last_name'] = payload['lastName'];
        delete payload['lastName'];
        if (!this.isAffiliate) {
            payload['referrer'] = payload['referrerCode'];
        }
        delete payload['referrerCode'];
        payload['confirm_password'] = payload['confirmPassword'];
        delete payload['confirmPassword'];

        payload.email = payload.email.toLowerCase();

        const register = (p: any) => this.isAffiliate ? this.backend.registerAffiliate(p) : this.backend.registerStudent(p)

        this.subs.add(register(payload).subscribe(
            () => {
                this.registerForm.reset();

                if (this.platform.setting('pre-beta')) {
                    return this.router.navigateByUrl(ROUTE_REGISTER_WELCOME);
                }

                this.router.navigateByUrl(ROUTE_LOGIN).then(() => {
                    alert = this.alerts.alert('Welcome', 'Registration complete! You may now log in.', alertOpts);
                    alert.result.subscribe(result => {
                        if (result === true) {
                            alert.dispose();
                        }
                    });
                });
            },
            (response: HttpErrorResponse) => {
                this.working = false;
                const res = response.error;

                if (res.error === undefined || res.error.fields === undefined) {
                    console.log('[+] Error:', res.error);
                    alert = this.alerts.alert('Couldn\'t register', 'Invalid response, please try again later.', alertOpts);
                    alert.result.subscribe(result => {
                        if (result === true) {
                            alert.dispose();
                        }
                    });
                    return;
                }

                
                if (res.error.fields.email !== undefined) {
                    this.registerForm.get('email').setErrors({apiError: res.error.fields.email});
                }

                if (this.isSocial===false) {
                    if (res.error.fields.password !== undefined) {
                        this.registerForm.get('password').setErrors({apiError: res.error.fields.password});
                    }

                    if (res.error.fields.confirm_password !== undefined) {
                        this.registerForm.get('confirmPassword').setErrors({apiError: res.error.fields.confirm_password});
                    }
                }
                
            },
            () => this.working = false
        ));
    }


    /**
     * Triggered on submitting the forgot password form.
     */
    public submitForgotPasswordForm(): void {
        this.subs.add(this.backend.recoverPassword(this.recoverPasswordForm.get('email').value.toLowerCase()).subscribe(
            () => {
                this.alerts.alert('If your email exists in our system, you will receive an email with the recover URL.');
                this.router.navigateByUrl(ROUTE_HOME);
            },
            () => this.alerts.alert('Recover password email failed'),
        ));
    }

    /**
     * Triggered on submitting the change password form.
     */
    public submitChangePasswordForm(): void {

        this.route.queryParams.subscribe(query => {

            if (query === undefined || query.token === undefined) {
                this.router.navigateByUrl(ROUTE_LOGIN);
                return;
            }

            const sub = this.backend.changePassword(
                this.passwordChangeForm.get('password').value,
                this.passwordChangeForm.get('confirmPassword').value,
                query.token
            ).subscribe(
                () => {
                    this.alerts.alert('Password successfully changed!');
                    this.router.navigateByUrl(ROUTE_LOGIN);
                },
                (err: HttpErrorResponse) => {
                    const res = err.error
                    if (res.error === undefined || res.fields === undefined) {
                        return;
                    }

                    if (res.fields.old !== undefined) {
                        this.passwordChangeForm.get('password').setErrors({apiError: res.fields.old});
                    }

                    if (res.fields.confirm !== undefined) {
                        this.passwordChangeForm.get('confirmPassword').setErrors({apiError: res.fields.confirm});
                    }
                },
            );
            this.subs.add(sub);
        });
    }
}
