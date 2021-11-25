import { Component } from "@angular/core";
import { ApprovalStatus, User } from "../../../models";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { BirthDateValidator, USZipCodeValidator } from "../../../lib/helpers/validators";
import subYears from 'date-fns/subYears';
import { AdminTutorsService } from "../../services/admin-tutors.service";
import { Timezone, TimezoneService } from "../../../services/timezone";
import { take } from "rxjs/operators";
import { AdminUserService } from "../../services/admin-user.service";
import { ActivatedRoute } from "@angular/router";
import { Subscription } from "rxjs/Rx";
import { LocationService } from "../../../services/location.service";
import _get from "lodash-es/get";
import _isEqual from "lodash-es/isEqual";
import { getApprovalStatusDisplay, getChanges } from "../../../lib/core/utils";
import { HttpErrorResponse } from "@angular/common/http";
import { NotificationsService } from "../../../services/notifications";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { AddNoteComponent } from "../../../dialogs/add-note/add-note.component";
import { CreditsGrantComponent } from 'app/admin/admin-credits/credits-grant/credits-grant.component';

@Component({
    selector: 'learnt-admin-tutor-profile',
    templateUrl: './tutor-profile.component.html',
    styleUrls: ['./tutor-profile.component.scss'],
})
export class TutorProfileComponent {
    tutor: User;
    editMode = false;
    profileForm: FormGroup;
    locationForm: FormGroup;
    form: FormGroup;
    maxBirthdate: Date;
    timezones: Timezone[] = [];
    private subs = new Subscription();
    private initialFormValue: {[k:string]: any} = {};
    approvalStatus = ApprovalStatus;

    constructor(
        private route: ActivatedRoute,
        private tutorsService: AdminTutorsService,
        private timezoneService: TimezoneService,
        private userService: AdminUserService,
        public locationService: LocationService,
        private notifications: NotificationsService,
        private dialog: MatDialog,
    ) {
        timezoneService.USTimezones.pipe(take(1)).subscribe(zones => this.timezones = zones);
        this.tutor = tutorsService.selectedUser;
        this.editMode = tutorsService.editMode;
        this.profileForm = new FormGroup({
            first_name: new FormControl('', Validators.required),
            last_name: new FormControl('', Validators.required),
            telephone: new FormControl('', Validators.required),
            birthday: new FormControl(null, [Validators.required, BirthDateValidator]),
        });
        this.locationForm = new FormGroup({
            address: new FormControl(''),
            city: new FormControl(''),
            state: new FormControl(''),
            postal_code: new FormControl('')
        });
        this.form = new FormGroup({
            profile: this.profileForm,
            location: this.locationForm,
            timezone: new FormControl(''),
            disabled: new FormControl(false),
            promote_video_allowed: new FormControl(false),
            is_test_account: new FormControl(false),
            is_private: new FormControl(false),
        });
        this.maxBirthdate = subYears(new Date(), 18);
    }

    ngOnInit() {
        this.getTutor();
    }

    getTutor() {
        this.route.params.first().subscribe(params => {
            this.subs.add(this.userService.getUser(params.tutor).subscribe(user => {
                this.tutor = user;
                this.fillForm();
            }));
        });
    }

    enableEdit() {
        this.editMode = true;
        this.fillForm();
    }

    cancelEdit() {
        this.editMode = false;
        this.form.reset();
    }

    save(): void {
        if (!this.form.valid) {
            return this.form.markAsDirty();
        }
        const newValue = this.form.getRawValue();
        if (_isEqual(this.initialFormValue, newValue)) {
            this.notifications.notify("Error", "No changes were made");
        } else {
            const changes = getChanges(this.initialFormValue, newValue);

            this.userService.updateUser(this.tutor._id, changes)
                .subscribe((raw) => {
                    this.initialFormValue = newValue;
                    this.notifications.notify("Updated", "Profile updated successfully");
                    this.tutor = new User(raw);
                    this.cancelEdit();
                }, (err: HttpErrorResponse) => {
                    if (typeof err.error === "string") {
                        this.notifications.notify("Error", err.error);
                    } else {
                        this.notifications.notify("Error", "Something went wrong");
                    }
                });
        }
    }

    private fillForm() {
        const birthday = _get(this.tutor, 'profile.birthday', '') as moment.Moment;
        this.profileForm.setValue({
            ...this.profileForm.getRawValue(),
            first_name: _get(this.tutor, 'profile.first_name', ''),
            last_name: _get(this.tutor, 'profile.last_name', ''),
            telephone: _get(this.tutor, 'profile.telephone', ''),
            birthday: birthday ? birthday.startOf('day').toDate() : null,
        });
        this.locationForm.setValue({
            ...this.locationForm.getRawValue(),
            address: _get(this.tutor, 'location.address', ''),
            city: _get(this.tutor, 'location.city', ''),
            state: _get(this.tutor, 'location.state', ''),
            postal_code: _get(this.tutor, 'location.postal_code', ''),
        });
        this.form.get('timezone').setValue(_get(this.tutor, '_timezone', ''));
        this.form.get('disabled').setValue(_get(this.tutor, 'disabled', false));
        this.form.get('promote_video_allowed').setValue(_get(this.tutor, 'tutoring.promote_video_allowed'));
        this.form.get('is_test_account').setValue(_get(this.tutor, 'is_test_account', false));
        this.form.get('is_private').setValue(_get(this.tutor, 'preferences.is_private', false));
        setTimeout(() => this.initialFormValue = this.form.getRawValue(),0);
    }

    approvalStatusDisplay(approval: number): string {
        return getApprovalStatusDisplay(approval);
    }

    addNote() {
        const addNoteDialog = this.dialog.open(AddNoteComponent, {
            width: '500px',
            maxWidth: '90vw',
            data: {
                id: this.tutor._id,
            }
        });
        addNoteDialog.componentInstance.close.subscribe(() => {
           addNoteDialog.close();
           this.getTutor();
        });
        addNoteDialog.componentInstance.failed.subscribe(() => {
          this.notifications.notify('Failed Adding note', 'Adding the note has failed.');
          addNoteDialog.close();
        });
    }

    messageTutor() {
        window.open(`https://app.intercom.com/a/apps/${this.tutor.intercom.workspace}/users/${this.tutor.intercom.contact}/all-conversations`);
    }

    grantCreditsDialog(user: User): MatDialogRef<CreditsGrantComponent> {
        const mdr = this.dialog.open(CreditsGrantComponent, {width: '825px'})
        mdr.componentInstance.init(user);

        return mdr;
    }
}
