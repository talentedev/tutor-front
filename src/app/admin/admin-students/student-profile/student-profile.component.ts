import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from "@angular/router";
import { AdminStudentsService } from "../../services/admin-students.service";
import { take } from "rxjs/operators";
import { User } from "../../../models";
import { NotificationsService } from "../../../services/notifications";
import { AbstractControl, FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import _get from 'lodash-es/get';
import subYears from 'date-fns/subYears';
import { LocationService } from "../../../services/location.service";
import { Timezone, TimezoneService } from "../../../services/timezone";
import _isEqual from 'lodash-es/isEqual';
import { AdminUserService } from "../../services/admin-user.service";
import { getChanges } from "../../../lib/core/utils";
import { HttpErrorResponse } from "@angular/common/http";
import { BirthDateValidator, USZipCodeValidator } from "../../../lib/helpers/validators";
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CreditsGrantComponent } from 'app/admin/admin-credits/credits-grant/credits-grant.component';

@Component({
    selector: 'learnt-student-profile',
    templateUrl: './student-profile.component.html',
    styleUrls: ['./student-profile.component.scss']
})
export class StudentProfileComponent implements OnInit {
    student: User;
    editMode = false;
    form: FormGroup;
    profileForm: FormGroup;
    locationForm: FormGroup;
    maxBirthdate: Date;
    timezones: Timezone[];
    private initialFormValue: {k: string, any};

    get notes(): FormArray {
        return this.form.get('notes') as FormArray;
    }

    constructor(
        private route: ActivatedRoute,
        private studentService: AdminStudentsService,
        private notifications: NotificationsService,
        private locationService: LocationService,
        private timezoneService: TimezoneService,
        private userService: AdminUserService,
        private dialog: MatDialog
    ) {
        this.editMode = studentService.editMode;
        this.profileForm = new FormGroup({
            first_name: new FormControl('', Validators.required),
            last_name: new FormControl('', Validators.required),
            telephone: new FormControl(''),
            birthday: new FormControl(null),
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
            notes: new FormArray([]),
            is_test_account: new FormControl(false),
        });
        this.maxBirthdate = subYears(new Date(), 18);
    }

    ngOnInit(): void {
        this.timezoneService.USTimezones.subscribe((timezones: Timezone[]) => {
            this.timezones = timezones;
        });
        this.route.params.pipe(take(1)).subscribe((params: Params) => {
            this.studentService.getStudentData(params.id).subscribe(
                (student) => {
                    this.student = student;
                    this.fillForm(student);

                    this.initialFormValue = this.form.getRawValue();
                },
                (err) => {
                    this.notifications.display(err)
                }
            );
        });
    }

    private fillForm(student: User) {
        const birthday = _get(student, 'profile.birthday', '') as moment.Moment;
        this.profileForm.setValue({
            ...this.profileForm.getRawValue(),
            first_name: _get(student, 'profile.first_name', ''),
            last_name: _get(student, 'profile.last_name', ''),
            telephone: _get(student, 'profile.telephone', ''),
            birthday: birthday ? birthday.startOf('day').toDate() : null,
        });
        this.locationForm.setValue({
            ...this.locationForm.getRawValue(),
            address: _get(student, 'location.address', ''),
            city: _get(student, 'location.city', ''),
            state: _get(student, 'location.state', ''),
            postal_code: _get(student, 'location.postal_code', ''),
        });
        this.form.get('timezone').setValue(_get(student, '_timezone', ''));
        this.form.get('disabled').setValue(_get(student, 'disabled', false));
        this.form.get('is_test_account').setValue(_get(student, 'is_test_account', false));
        if (student.notes) {
            const notes = new FormArray([]);
            for(let note of student.notes) {
                notes.push(new FormControl(note, Validators.required));
            }
            this.form.setControl('notes', notes);
        }
    }

    save() {
        if (!this.form.valid) {
            return this.form.markAsDirty();
        }
        const newValue = this.form.getRawValue();
        if (_isEqual(this.initialFormValue, newValue)) {
            this.notifications.notify("Error", "No changes were made");
        } else {
            const changes = getChanges(this.initialFormValue, newValue);
            this.userService.updateUser(this.student._id, changes)
                .subscribe((raw) => {
                    this.initialFormValue = newValue;
                    this.notifications.notify("Updated", "Profile updated successfully");
                    this.student = new User(raw);
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

    enableEdit() {
        this.editMode = true;
        this.fillForm(this.student);
    }

    cancelEdit() {
        this.editMode = false;
        this.form.reset();
    }

    addNote() {
        this.notes.push(new FormControl('', Validators.required));
    }

    removeNote(index: number) {
        this.notes.removeAt(index);
    }

    messageStudent() {
        window.open(`https://app.intercom.com/a/apps/${this.student.intercom.workspace}/users/${this.student.intercom.contact}/all-conversations`);
    }

    grantCreditsDialog(user: User): MatDialogRef<CreditsGrantComponent> {
        const mdr = this.dialog.open(CreditsGrantComponent, {width: '825px'})
        mdr.componentInstance.init(user);

        return mdr;
    }
}
