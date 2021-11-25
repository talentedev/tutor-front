import { Component, ViewChild, ViewContainerRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Backend } from '../../../lib/core/auth';
import { NotificationsService } from '../../../services/notifications';
import { SidePanel } from '../panel';

@Component({
    templateUrl: './recover-password-panel.component.html',
    styleUrls: ['./recover-password-panel.component.scss', '../booking-panel.scss']
})
export class RecoverPasswordPanelComponent extends SidePanel {

    @ViewChild('panel', {read: ViewContainerRef})
    panel: ViewContainerRef;

    public recoverForm: FormGroup;

    public loading: boolean;

    constructor(private formBuilder: FormBuilder,
                private backend: Backend,
                private notifications: NotificationsService) {
        super();
        this.recoverForm = this.formBuilder.group({
            email: ['', Validators.email]
        });
    }

    /**
     * Recover password.
     * @param event
     */
    public recoverPassword(event: any): void {
        event.stopPropagation();
        event.preventDefault();

        this.loading = true;

        this.backend.recoverPassword(this.recoverForm.get('email').value).subscribe(
            () => {

                this.on('close', () => {
                    const message = 'If your email exists in our system, you will receive an email with the recover URL.';
                    this.notifications.notify('Recover password', message, 'security');
                });

                this.close();
            },
            () => {
                this.loading = false;
                const message = 'Couldn\'t receive a response right now. Please try again later.';
                this.notifications.notify('Recover password', message, 'security');
            }
        );
    }

    /**
     * Switch to the login panel.
     */
    public cancel(): void {
        this.navigate('login')
    }
}
