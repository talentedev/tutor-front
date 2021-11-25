import {NotificationsService} from '../../../services/notifications';
import {AccountService} from '../../../services/account';
import {AlertService} from '../../../services/alerts';
import {setFormValue} from '../../../lib/core/utils';
import {Auth, Backend} from '../../../lib/core/auth';
import {FormGroup, FormBuilder, FormControl, Validators} from '@angular/forms';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import {DialogsFacade} from '../../../dialogs';
import {TutoringDegree, TutoringSubject, User, UserLocation, Coordinate} from '../../../models';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpResponse, HttpErrorResponse} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import * as moment from 'moment';
import {Timezone, TimezoneService} from '../../../services/timezone';
import {MAT_MOMENT_DATE_FORMATS, MomentDateAdapter} from '@angular/material-moment-adapter';
import {Media} from '../../../lib/core/media';
import { ROUTE_LOGIN } from 'routes';
import { DateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material/core';
import _get from 'lodash-es/get';
import _defaultsDeep from 'lodash-es/defaultsDeep';
import { USZipCodeValidator } from "../../../lib/helpers/validators";
import { LocationService } from "../../../services/location.service";
import { debounceTime } from "rxjs/operators";
import { Subscription } from "rxjs/Rx";

@Component({
    selector: 'learnt-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
    providers: [
        {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
        {provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS},
    ]
})
export class ProfileComponent implements OnInit, OnDestroy {

    form: FormGroup;

    formResetValue: any;

    me: User;

    saving: boolean;

    locating: boolean;

    timezones: Timezone[];

    /**
     * Used to check form dirty for autocomplete change
     */
    address: string;
    location: UserLocation;

    public footerTop: string;

    public uploading: boolean;

    public minDate: Date;
    public maxDate: Date;

    public savingInstantSession = false;

    public mobile: boolean;
    locationForm: FormGroup;
    private subs = new Subscription();

    /**
     * Return the avatar URL.
     * @param avatar
     * @return {string}
     */
    public static avatarUrl(avatar: any): string {
        switch (true) {
            case avatar === null:
            default:
                return 'https://s3.amazonaws.com/tutorthepeople/temp/default-avatar.png';
            case avatar && avatar.url !== '':
                return 'https://s3.amazonaws.com/learnt/' + avatar.url;
        }
    }

    constructor(private dialog: DialogsFacade,
                public account: AccountService,
                private backend: Backend,
                private notifications: NotificationsService,
                private alerts: AlertService,
                private auth: Auth,
                private fb: FormBuilder,
                private router: Router,
                private cd: ChangeDetectorRef,
                private timezoneService: TimezoneService,
                private media: Media,
                private route: ActivatedRoute,
                public locationService: LocationService) {
        this.me = route.snapshot.data.me;

        this.mobile = !media.query('gt-sm');
        media.watch('gt-sm').subscribe(event => {
            this.mobile = !event.active;
        });

        const min = moment().add(-100, 'years').toDate();
        this.minDate = new Date(min.getFullYear(), min.getMonth(), min.getDate());

        const max = moment().add(-18, 'years').toDate();
        this.maxDate = new Date(max.getFullYear(), max.getMonth(), max.getDate());

        this.locationForm = new FormGroup({
            address: new FormControl(_get(this.me, 'location.address', ''), Validators.required),
            city: new FormControl(_get(this.me, 'location.city', ''), Validators.required),
            state: new FormControl(_get(this.me, 'location.state', ''), Validators.required),
            postal_code: new FormControl(_get(this.me, 'location.postal_code'), [Validators.required, USZipCodeValidator])
        });
        this.form = new FormGroup({
            profile: new FormGroup({
                first_name: new FormControl(_get(this.me, 'profile.first_name', ''), Validators.required),
                last_name: new FormControl(_get(this.me, 'profile.last_name', ''), Validators.required),
                birthday: new FormControl(_get(this.me, 'profile.birthday'), Validators.required),
                telephone: new FormControl(_get(this.me, 'profile.telephone'), Validators.required),
                avatar: new FormControl(null),
                resume: new FormControl(null),
            }),

            location: this.locationForm,

            email: new FormControl(this.me.email, Validators.compose([Validators.required, Validators.email])),
            timezone: new FormControl('', Validators.required),

            meet_online: new FormControl(false),
            meet_live: new FormControl(false),
        });

        if (this.me.isTutor()) {
            // add tutoring form group w/ validators
            this.form.addControl('tutoring', new FormGroup({
                title: new FormControl('', Validators.compose([
                    Validators.required,
                    Validators.minLength(10),
                    Validators.maxLength(100)
                ])),
                rate: new FormControl(0, Validators.compose([Validators.required, Validators.min(30)])),
                lesson_buffer: new FormControl(0, Validators.compose([Validators.required, Validators.min(15)])),
            }));

            (<FormGroup>this.form.get('profile')).addControl('about',
                new FormControl('', Validators.compose([Validators.required, Validators.maxLength(10000)])));
        }
        this.fillForm();

        this.timezoneService.USTimezones.subscribe((zones: Timezone[]) => {
            this.timezones = zones;
            const timezones = this.timezones.filter(tz => tz.zone === this.me.timezone);
            if (timezones.length) {
                this.form.get('timezone').setValue(timezones[0].zone);
            }
        });
    }

    ngOnInit(): void {
        this.subs.add(this.locationForm.get('city').valueChanges.pipe(
            debounceTime(400),
        ).subscribe(async (val: string) => {
            await this.locationService.getCities(val);
        }));
    }

    ngOnDestroy() {
        this.subs.unsubscribe();
    }

    public toggleInstantSession(state: boolean): void {

        if (this.savingInstantSession) {
            return;
        }

        this.savingInstantSession = true;
        this.backend.setInstantSessionState(state).subscribe(() => {
            this.me.tutoring.instant_session = state;
            this.savingInstantSession = false;

            this.notifications.notify('Personal Info', 'Instant Session updated!', 'user');
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
        this.account.setAvatar(this.me, event.target.files[0]).then(
            () => {
                this.uploading = false;
                this.cd.markForCheck();
                this.cd.detectChanges();
                this.notifications.notify('Personal Info', 'Profile picture updated!', 'user');
            },
            () => {
                this.uploading = false;
                this.notifications.notify('Personal Info', 'Failed to update avatar', 'close');
            }
        );
    }

    public get hasEducation(): boolean {
        if (this.me.tutoring === undefined || this.me.tutoring.degrees === undefined) {
            return false;
        }
        return this.me.tutoring.degrees.length > 0;
    }

    public get hasSubjects(): boolean {
        if (this.me.tutoring === undefined || this.me.tutoring.subjects === undefined) {
            return false;
        }
        return this.me.tutoring.subjects.length > 0;
    }

    onSearchSettingChange(state) {
        const payload = {is_private: state.checked, payout_terms_accepted: this.me.preferences.payout_terms_accepted, receive_updates: this.me.preferences.receive_updates, receive_sms_updates: this.me.preferences.receive_sms_updates};
        this.backend.updatePreferences(payload).subscribe(
            () => {
                if(state.checked) {
                    this.notifications.notify(
                        'Notifications',
                        'Your profile is only viewable for signed-in users',
                        null,
                        2000
                    );
                } else {
                    this.notifications.notify(
                        'Notifications',
                        'Your profile is public on search',
                        null,
                        2000
                    );
                }
                
                this.me.preferences.is_private = state.checked;
            },
            (err) => {
                this.alerts.alert('Failed to save preference: ' + err.json().error);
            }
        );
    }

    private fillForm() {
        setFormValue(this.form, this.me);

        if (this.me.isTutor() && this.me.tutoring) {
            if (this.me.tutoring.rate !== undefined && this.me.tutoring.rate > 0) {
                this.form.get('tutoring').get('rate').setValue(this.me.tutoring.rate);
            }

            if (this.me.tutoring.lesson_buffer !== undefined && this.me.tutoring.lesson_buffer > 0) {
                this.form.get('tutoring').get('lesson_buffer').setValue(this.me.tutoring.lesson_buffer);
            }

            if (this.me.tutoring.meet) {
                switch (this.me.tutoring.meet) {
                    case 6:
                        this.form.get('meet_online').setValue(true);
                        this.form.get('meet_live').setValue(true);
                        break;
                    case 4:
                        this.form.get('meet_live').setValue(true);
                        break;
                    case 2:
                        this.form.get('meet_online').setValue(true);
                        break;
                }
            }
        }

        this.formResetValue = this.form.getRawValue();
    }

    save() {
        if (!this.form.valid) {
            this.form.markAllAsTouched();
            return;
        }
        const raw = this.form.getRawValue();

        // For now, make sure the country remains set
        raw.location.country = 'US';

        const payload: { [key: string]: any } = {
            profile: raw.profile,
            email: raw.email,
            location: raw.location,
            timezone: raw.timezone,
        };

        if (this.me.isTutor()) {
            payload.tutoring = raw.tutoring;

            if (raw.meet_online && raw.meet_live) {
                payload.tutoring.meet = 6;
            } else if (raw.meet_online) {
                payload.tutoring.meet = 2;
            } else if (raw.meet_live) {
                payload.tutoring.meet = 4;
            } else {
                payload.tutoring.meet = 0;
            }

            payload.tutoring.rate = parseFloat(payload.tutoring.rate);
        }


        this.saving = true;

        this.backend.updateCurrentUser(payload).subscribe(me => {
            this.me = me;
            this.saving = false;
            this.form.markAsPristine();
            this.form.markAsUntouched();
            this.formResetValue = this.form.getRawValue();
            this.notifications.notify('Personal Info', 'Personal info saved!', 'user');
            this.auth.update(me);
        }, (error: HttpErrorResponse) => {
            const err = error.error; // TEST
            this.saving = false;

            if (!environment.production) {
                console.log('[!] Error:', err);
            }

            if (err.message === undefined || err.message === null) {
                return;
            }

            if (err.data.fields === undefined || err.data.fields === null) {
                this.notifications.notify('Personal Info', 'Couldn\'t save personal info, check fields or try again later.', 'user');
                return;
            }

            for (const key in err.data.fields) {
                if (this.form.get(key) !== undefined) {
                    this.form.get(key).setErrors({apiError: err.data.fields[key]});
                }
            }
        });
    }

    revert() {
        this.form.reset(this.formResetValue);
    }

    addDegree() {
        this.dialog.showAddDegree().componentInstance.done.subscribe(() => {
            this.auth.me.subscribe(me => this.me = me);
        });
    }

    addSubject() {
        this.dialog.showAddSubjects().componentInstance.done.subscribe(() => {
            this.auth.me.subscribe(me => this.me = me);
        });
    }

    addCertificate(subject) {
        this.dialog.showAddCertificates(subject).componentInstance.done.subscribe(() => {
            this.auth.me.subscribe(me => this.me = me);
        });
    }

    public removeDegree(d: TutoringDegree): void {
        this.backend.removeCurrentUserDegree(d._id).subscribe(() => {
            this.me.tutoring.degrees = this.me.tutoring.degrees.filter(degree => degree._id !== d._id);
            this.notifications.notify('Personal Info', 'The education degree was successfully removed.', 'user');
        }, (err: HttpErrorResponse) => {
            this.notifications.notify('Personal Info', 'There was an error trying to remove the education degree.', 'close');
        });
    }

    public removeSubject(s: TutoringSubject): void {
        this.backend.removeCurrentUserSubject(s._id).subscribe(() => {
            this.me.tutoring.subjects = this.me.tutoring.subjects.filter(subject => subject._id !== s._id);
            this.notifications.notify('Personal Info', 'The tutoring subject was successfully removed.', 'user');
        }, (err: HttpErrorResponse) => {
            this.notifications.notify('Personal Info', 'There was an error trying to remove the tutoring subject.', 'close');
        });
    }

    /**
     * Submit the account deletion.
     */
    public deleteAccount(): void {
        const alertOpts = {lifetime: 0, buttons: [{label: 'Delete Account', result: true}, {label: 'Cancel', result: false}]};
        const alertMessage = 'Are you sure you want to disable your account? This can\'t be undone.';
        const alert = this.alerts.alert('Are you sure want to delete your account', alertMessage, alertOpts);

        alert.result.subscribe(res => {
            if (res === true) {
                const payload = {disable_account: true};
                this.backend.updateCurrentUser(payload).subscribe(r => {
                    this.auth.logout();
                    this.router.navigateByUrl(ROUTE_LOGIN);
                });
            }
            alert.dispose();
        });
    }
}
