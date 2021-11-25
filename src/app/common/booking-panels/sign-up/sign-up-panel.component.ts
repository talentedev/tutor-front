import { Component, ViewChild, ViewContainerRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { isNull, isUndefined } from 'util';
import { Backend } from '../../../lib/core/auth';
import { PasswordMatchValidator, PasswordValidator } from '../../../lib/helpers/validators';
import { NotificationsService } from '../../../services/notifications';
import { SidePanel } from '../panel';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
    templateUrl: './sign-up-panel.component.html',
    styleUrls: ['./sign-up-panel.component.scss', '../booking-panel.scss']
})
export class SignUpPanelComponent extends SidePanel {

    @ViewChild('panel', {read: ViewContainerRef})
    panel: ViewContainerRef;

    public signUpForm: FormGroup;

    public loading: boolean;

    constructor(private formBuilder: FormBuilder,
                private backend: Backend,
                private notifications: NotificationsService) {
        super();
        this.signUpForm = this.formBuilder.group({
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            email: ['', Validators.email],
            password: ['', Validators.compose([Validators.required, Validators.minLength(8), PasswordValidator])],
            confirmPassword: ['', Validators.required],
            referrerCode: [''],
        }, {
            validator: PasswordMatchValidator('password', 'confirmPassword')
        });
    }

    /**
     * Getter for password errors, to add bottom margin.
     * @return {boolean}
     */
    public get passwordHasErrors(): boolean {
        return (this.signUpForm.get('password').dirty || this.signUpForm.get('password').touched) &&
            !isNull(this.signUpForm.get('password').errors);
    }

    /**
     * Sign up the user.
     * @param event
     */
    public signUp(event: any): void {
        event.preventDefault();
        event.stopPropagation();

        this.loading = true;

        const payload = this.signUpForm.getRawValue();

        payload['first_name'] = payload['firstName'];
        delete payload['firstName'];
        payload['last_name'] = payload['lastName'];
        delete payload['lastName'];
        payload['referrer'] = payload['referrerCode'];
        delete payload['referrerCode'];
        payload['confirm_password'] = payload['confirmPassword'];
        delete payload['confirmPassword'];

        this.backend.registerStudent(payload).subscribe(
            () => this.login(true),
            (error: HttpErrorResponse) => {
                
                this.loading = false;
                const res = error.error;

                if (isUndefined(res.error)) {
                    this.notifications.notify('Couldn\'t register', 'Invalid response, please try again later.', 'user');
                    return;
                }

                if (isUndefined(res.error.fields)) {
                    return;
                }

                if (!isUndefined(res.error.fields.email)) {
                    this.signUpForm.get('email').setErrors({apiError: res.error.fields.email});
                }

                if (!isUndefined(res.error.fields.password)) {
                    this.signUpForm.get('password').setErrors({apiError: res.error.fields.password});
                }

                if (!isUndefined(res.error.fields.confirm_password)) {
                    this.signUpForm.get('confirmPassword').setErrors({apiError: res.error.fields.confirm_password});
                }
            }
        );
    }

    /**
     * Switch to the login panel, and notify the user if coming from a successful registration.
     */
    public login(fromSignup: boolean = false): void {
        this.navigate('login')
        if (fromSignup === true) {
            this.notifications.notify('Welcome', 'Registration complete! You may now log in.', 'user', 3 * 1000);
        }
    }
}
