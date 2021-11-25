import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService } from '@services/account';
import { AlertService } from '@services/alerts';
import { NotificationsService } from '@services/notifications';
import { Timezone, TimezoneService } from '@services/timezone';
import _defaultsDeep from 'lodash-es/defaultsDeep';
import * as moment from 'moment';
import { ROUTE_LOGIN } from 'routes';
import { Auth, Backend } from '../../../../lib/core/auth';
import { PasswordMatchValidator, PasswordValidator } from '../../../../lib/helpers/validators';
import { User, UserLocation } from '../../../../models';

@Component({
    selector: 'learnt-affiliate-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['../account.scss', './profile.component.scss'],
})
export class AffiliateProfileComponent implements OnInit, OnDestroy {
    /* Current user */
    public me: User;

    /* Profile Form */
    public profileForm: FormGroup;

    /* Password change Form */
    public passwordChangeForm: FormGroup;

    /**
     * States scattered in the template.
     * uploading - when uploading the profile picture
     * locating - when getting user location
     * saving - when saving the profile data
     */
    public uploading: boolean;
    public locating: boolean;
    public saving: boolean;

    public minDate: Date;
    public maxDate: Date;

    /* Initial or saved forms */
    private pristineProfileForm: any;

    /* Timezones list */
    public timezones: Timezone[];

    constructor(private auth: Auth,
                private account: AccountService,
                private cd: ChangeDetectorRef,
                private alerts: AlertService,
                private notifications: NotificationsService,
                private formBuilder: FormBuilder,
                private backend: Backend,
                private router: Router,
                private timezoneService: TimezoneService) {

        this.auth.me.subscribe((user: User) => {
            this.me = user;
            if (this.me.location === undefined) {
                this.me.location = new UserLocation();
            }
        });

        const min = moment().add(-100, 'years').toDate();
        this.minDate = new Date(min.getFullYear(), min.getMonth(), min.getDate());

        const max = moment().add(-18, 'years').toDate();
        this.maxDate = new Date(max.getFullYear(), max.getMonth(), max.getDate());

        this.profileForm = formBuilder.group({
            first_name: ['', Validators.required],
            last_name: ['', Validators.required],
            email: ['', Validators.compose([Validators.required, Validators.email])],
            address: ['', Validators.required],
            postal_code: ['', Validators.required],
            city: ['', Validators.required],
            state: ['', Validators.required],
            timezone: ['', Validators.required],
            birthday: ['', Validators.required],
            telephone: ['', Validators.required],
        });

        this.passwordChangeForm = formBuilder.group({
            old: ['', Validators.required],
            new: ['', Validators.compose([Validators.required, Validators.minLength(8), PasswordValidator])],
            confirm: ['', Validators.required],
        }, {
            validator: PasswordMatchValidator('new', 'confirm'),
        });
    }

    ngOnInit(): void {
        this.timezoneService.USTimezones.subscribe((zones: Timezone[]) => this.timezones = zones);
        this.fillForm();
    }

    ngOnDestroy(): void {
        this.cd.detach();
    }

    /**
     * Fill current form with the data from the current user.
     */
    private fillForm(): void {
        this.profileForm.get('first_name').setValue(this.me.profile.first_name);
        this.profileForm.get('last_name').setValue(this.me.profile.last_name);
        this.profileForm.get('email').setValue(this.me.email);
        this.profileForm.get('address').setValue(this.me.location.address);
        this.profileForm.get('postal_code').setValue(this.me.location.postal_code);
        this.profileForm.get('city').setValue(this.me.location.city);
        this.profileForm.get('state').setValue(this.me.location.state);
        this.profileForm.get('timezone').setValue(this.me.timezone);
        this.profileForm.get('birthday').setValue(this.me.profile.birthday?.toDate());
        this.profileForm.get('telephone').setValue(this.me.profile.telephone);

        this.pristineProfileForm = this.profileForm.getRawValue();
    }

    /**
     * Revert the form to the previously saved values. Triggered on pressing 'Cancel'.
     */
    public revert(): void {
        this.profileForm.reset(this.pristineProfileForm);
        this.passwordChangeForm.reset();
    }

    /**
     * Save the dirty forms. Triggered on pressing 'Save Changes'
     */
    public saveChanges(): void {
        this.saving = true;

        if (this.profileForm.dirty && this.profileForm.valid) {
            this.saveProfileForm();
        }

        if (this.passwordChangeForm.dirty && this.passwordChangeForm.valid) {
            this.savePasswordChangeForm();
        }
    }

    /**
     * Update the password on the account.
     */
    private savePasswordChangeForm(): void {
        const payload: any = {
            old: this.passwordChangeForm.get('old').value,
            new: this.passwordChangeForm.get('new').value,
            confirm: this.passwordChangeForm.get('confirm').value,
        };

        this.backend.updateCurrentUserPassword(payload).subscribe((res: HttpResponse<any>) => {
            this.saving = false;
            this.notifications.notify('Personal Info', 'Password successfully changed!', 'user');

            this.passwordChangeForm.reset();
        }, (err: HttpErrorResponse) => {
            this.saving = false;
            this.notifications.notify('Personal Info', 'Couldn\'t update password!', 'close');

            const res = err.error;
            if (res.error === undefined || res.fields === undefined) {
                return;
            }

            if (res.fields.old !== undefined) {
                this.passwordChangeForm.get('old').setErrors({ apiError: res.fields.old });
            }

            if (res.fields.new !== undefined) {
                this.passwordChangeForm.get('new').setErrors({ apiError: res.fields.new });
            }

            if (res.fields.confirm !== undefined) {
                this.passwordChangeForm.get('confirm').setErrors({ apiError: res.fields.confirm });
            }
        });
    }

    /**
     * Update the profile form.
     */
    private saveProfileForm(): void {
        const raw = this.profileForm.getRawValue();
        const payload = {
            profile: {
                first_name: raw.first_name,
                last_name: raw.last_name,
                birthday: raw.birthday,
                telephone: raw.telephone,
            },
            location: <UserLocation>{
                address: raw.address,
                postal_code: raw.postal_code,
                city: raw.city,
                state: raw.state,
            },
            email: raw.email,
            timezone: raw.timezone,
        };

        this.backend.updateMe(payload).subscribe(res => {
            this.saving = false;
            this.profileForm.markAsPristine();
            this.profileForm.markAsUntouched();
            this.pristineProfileForm = this.profileForm.getRawValue();
            this.notifications.notify('Personal Info', 'Personal info saved!', 'user');
            this.me.hydrate(res);
        }, err => {
            this.notifications.notify('Personal Info', 'Couldn\'t save account info.', 'user');
            this.saving = false;
        });
    }

    /**
     * Auto update location. Triggered on pressing the autolocate button next to the 'Address' input.
     */
    public autoUpdateLocation(): void {
        if (this.locating) {
            return;
        }

        this.locating = true;
        if (!navigator.geolocation) {
            this.alerts.alert('Location is not available!');
            this.locating = false;
            return;
        }

        navigator.geolocation.getCurrentPosition(({ coords }) => {
            this.backend.updateGeocodeLocation(coords.latitude, coords.longitude, this.me.location).subscribe(response => {
                this.locating = false;
                const defaultLocation = {
                    position: {
                        type: '',
                        coordinates: {
                            lat: null,
                            lng: null,
                        },
                    },
                    country: '',
                    state: '',
                    city: '',
                    address: '',
                    postal_code: '',
                };
                const res = _defaultsDeep(defaultLocation, response.body);

                this.profileForm.get('address').setValue(res.street);
                this.profileForm.get('city').setValue(res.city);
                this.profileForm.get('state').setValue(res.state);
                this.profileForm.get('postal_code').setValue(res.postal_code);
                this.profileForm.markAsDirty();

                const notificationMessage = 'Location updated in form. Please save the changes to persist.';
                this.notifications.notify('Location', notificationMessage, null, 7 * 1000, true);
            }, err => {
                this.locating = false;
                this.alerts.alert('Failed to update location');
            });
        }, error => {
            this.locating = false;
            this.alerts.alert('Location was declined. Please allow locations for this website.');
        });
    }

    /**
     * Event triggered by pressing the 'Change Photo' label.
     * @param event
     */
    public onUserAvatarSelect(event: any) {
        if (event.target.files === undefined || event.target.files.length < 0) {
            return;
        }

        this.uploading = true;
        this.account.setAvatar(this.me, event.target.files[0]).then(() => {
            this.uploading = false;
            if (!this.cd['destroyed']) {
                this.cd.detectChanges();
            }
            this.notifications.notify('Personal Info', 'Profile picture updated!', 'user');
        }, () => {
            this.uploading = false;
            this.notifications.notify('Personal Info', 'Failed to update avatar', 'close');
        });
    }

    /**
     * Submit the account deletion.
     */
    public deleteAccount(): void {
        const alertOpts = { lifetime: 0, buttons: [{ label: 'Yes', result: true }, { label: 'No', result: false }] };
        const alertMessage = 'Are you sure you want to disable your account? This can\'t be undone.';
        const alert = this.alerts.alert('Delete account', alertMessage, alertOpts);

        alert.result.subscribe(res => {
            if (res === true) {
                this.backend.deleteCurrentAccount().subscribe(r => {
                    this.auth.logout();
                    this.router.navigateByUrl(ROUTE_LOGIN);
                });
            }
            alert.dispose();
        });
    }
}
