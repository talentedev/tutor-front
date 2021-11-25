import { Component, ViewChild, ViewContainerRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SidePanel } from '../panel';
import { AccountService } from '../../../services/account';

@Component({
    templateUrl: './login-panel.component.html',
    styleUrls: ['./login-panel.component.scss', '../booking-panel.scss']
})
export class LoginPanelComponent extends SidePanel {

    @ViewChild('panel', {read: ViewContainerRef})
    panel: ViewContainerRef;

    public loginForm: FormGroup;

    public loading: boolean;

    constructor(private account: AccountService,
                private formBuilder: FormBuilder) {
        super();
        this.loginForm = this.formBuilder.group({
            email: ['', Validators.email],
            password: ['', Validators.required],
        });
    }

    /**
     * Switch to the recover password panel.
     */
    public forgotPassword(): void {
        this.navigate('recover_password');
    }

    /**
     * Switch to the sign up panel.
     */
    public signUp(): void {
        this.navigate('signup');
    }

    /**
     * Login the user.
     */
    public login(event: any): void {
        event.preventDefault();
        event.stopPropagation();
        this.loading = true;
        this.account.login(this.loginForm.getRawValue()).then((ev: any) => {
            this.emit('complete');          
        }, () => {
            this.loading = false;
            this.loginForm.get('email').setErrors({failed: true});
        });
    }
}

