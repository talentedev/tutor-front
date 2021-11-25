import {AlertService} from '../../../services/alerts';
import {NotificationsService} from '../../../services/notifications';
import {Auth, Backend} from '../../../lib/core/auth';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Component, OnInit, ChangeDetectorRef} from '@angular/core';
import { Media } from 'app/lib/core/media';
import {PasswordMatchValidator, PasswordValidator} from '../../../lib/helpers/validators';
import {User} from '../../../models';
import { filter } from "rxjs/operators";
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {DialogsFacade} from '../../../dialogs';

@Component({
    selector: 'learnt-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
    disabledNotif: boolean;
    saving: boolean;
    form: FormGroup;

    public me: User;

    mobile: boolean;

    constructor(formBuilder: FormBuilder,
                private auth: Auth,
                private backend: Backend,
                private media: Media,
                private alerts: AlertService,
                private notifications: NotificationsService,
                private cd: ChangeDetectorRef,
                private dialog: DialogsFacade) {
        this.auth.me.pipe(filter(Boolean)).subscribe((u: User) => this.me = u);

        this.form = formBuilder.group({
            'old': ['', Validators.required],
            'new': ['', Validators.compose([Validators.required, Validators.minLength(8), PasswordValidator])],
            'confirm': ['', Validators.required],
        }, {
            validator: PasswordMatchValidator('new', 'confirm')
        });

        this.mobile = !media.query('gt-sm');
        media.watch('gt-sm').subscribe((event: any) => {
            this.mobile = !event.active;
            if (!(<any>this.cd)['destroyed']) {
                this.cd.detectChanges();
            }
        });
    }

    ngOnInit() {
    }

    save() {
        this.saving = true;
        const payload = this.form.getRawValue();

        this.backend.updateCurrentUserPassword(payload).subscribe((res) => {
            this.saving = false;
            this.form.markAsPristine();
            this.form.markAsUntouched();
            this.form.reset();
            this.notifications.notify('Security', 'Password updated', 'user');
        }, (err) => {
            this.saving = false;
            this.notifications.notify('Security', 'Couldn\'t update password!', 'close');

            const res = err.error;
            if (res.error === undefined || res.fields === undefined) {
                return;
            }

            if (res.fields.old !== undefined) {
                this.form.get('old').setErrors({apiError: res.fields.old});
            }

            if (res.fields.new !== undefined) {
                this.form.get('new').setErrors({apiError: res.fields.new});
            }

            if (res.fields.confirm !== undefined) {
                this.form.get('confirm').setErrors({apiError: res.fields.confirm});
            }
        });
    }

    revert() {
        this.form.reset();
    }

    onNotificationChange(state) {
        const payload = {receive_updates: state.checked, payout_terms_accepted: this.me.preferences.payout_terms_accepted, receive_sms_updates: this.me.preferences.receive_sms_updates};
        this.backend.updatePreferences(payload).subscribe(
            () => {
                this.notifications.notify(
                    'Notifications',
                    'Notification settings updated',
                    null,
                    2000
                );
                this.me.preferences.receive_updates = state.checked;
                this.disabledNotif = (!this.me.preferences.receive_updates && !this.me.preferences.receive_sms_updates);
            },
            (err) => {
                this.alerts.alert('Failed to save preference: ' + err.json().error);
            }
        );
    }

    onSMSNotificationChange(state) {
        const payload = {receive_sms_updates: state.checked, payout_terms_accepted: this.me.preferences.payout_terms_accepted, receive_updates: this.me.preferences.receive_updates};
        this.backend.updatePreferences(payload).subscribe(
            () => {
                this.notifications.notify(
                    'Notifications',
                    'Notification settings updated',
                    null,
                    2000
                );
                this.me.preferences.receive_sms_updates = state.checked;
                this.disabledNotif = (!this.me.preferences.receive_updates && !this.me.preferences.receive_sms_updates);
            },
            (err) => {
                state.source.checked = !state.checked;
                this.dialog.showAddPhone().componentInstance.done.subscribe(
                    () => {
                        this.auth.me.subscribe(me => this.me = me);
                    }
                );
            }
        );
    }
}
