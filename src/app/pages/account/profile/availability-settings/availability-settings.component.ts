import { Component, OnDestroy, OnInit } from '@angular/core';
import { Auth, Backend } from '../../../../lib/core/auth';
import { User } from '../../../../models';
import { FormArray, FormBuilder, FormControl, FormGroup, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { concatMap, map, take, toArray } from 'rxjs/operators';
import { NotificationsService } from '../../../../services/notifications';
import { HttpErrorResponse } from '@angular/common/http';
import {
    EndDateValidator,
    EndTimeValidator,
    HasTrue,
    StartDateValidator,
    StartTimeValidator
} from '../../../../lib/helpers/validators';
import { BehaviorSubject, from, Subscription } from 'rxjs';
import _has from 'lodash-es/has';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import {
    addDays,
    addMinutes,
    differenceInHours,
    endOfDay,
    endOfMonth,
    format,
    getISODay,
    isBefore,
    isValid,
    parse,
    setHours,
    setISODay,
    setMinutes,
    startOfDay,
    startOfMonth,
} from 'date-fns';
import { ActivatedRoute } from '@angular/router';
import * as moment from 'moment';
import { ErrorStateMatcher } from '@angular/material/core';
import { Availability2, Blackout } from '../../../../lib/calendar/services/models';

@Component({
    selector: 'learnt-availability-settings',
    templateUrl: './availability-settings.component.html',
    styleUrls: ['./availability-settings.component.scss'],
})
export class AvailabilitySettingsComponent implements OnInit, OnDestroy {
    private me: User;
    availabilities: Availability2[] = [];
    private timeOptions: Date[];
    scheduleGroups: Availability2[][] = [];
    fromOptions: Date[];
    toOptions: Date[];
    dayOptions = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];  // keep order
    weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    availForm: FormGroup;
    loading = false;
    deleting = new Map<string, boolean>();
    private subs: Subscription = new Subscription();
    public toCreate = '';
    blackoutForm: FormGroup;
    private nowZoned: Date;
    blackoutFromOptions: Date[] = [];
    blackoutToOptions: Date[] = [];
    blackout: {
        minDate: Date,
    };
    isBlackoutFormValid$ = new BehaviorSubject(false);
    startDateErrorMatcher = new FormErrorCodeErrorStateMatcher('startDate');
    endDateErrorMatcher = new FormErrorCodeErrorStateMatcher('endDate');
    startTimeErrorMatcher = new FormErrorCodeErrorStateMatcher('startTime')
    endTimeErrorMatcher = new FormErrorCodeErrorStateMatcher('endTime');
    blackoutList: Blackout[] = [];
    loadingAvailabilities = false;
    loadingBlackouts = false;

    constructor(
        private auth: Auth,
        private backend: Backend,
        private fb: FormBuilder,
        private notifications: NotificationsService,
        private route: ActivatedRoute,
    ) {
        this.me = route.snapshot.data.me;
        this.blackout = {
            minDate: addMinutes(new Date(), 60),
        }

        const dayControls = [];
        for (const opt of this.dayOptions) {
            dayControls.push(new FormControl(false));
        }
        this.availForm = new FormGroup({
            days: new FormArray(dayControls, HasTrue),
            from: this.fb.control(null, Validators.required),
            to: this.fb.control(null, Validators.required),
        });
        this.blackoutForm = new FormGroup({
            startDate: this.fb.control('', Validators.required),
            startTime: this.fb.control('', Validators.required),
            endDate: this.fb.control('', Validators.required),
            endTime: this.fb.control('', Validators.required),
        }, { validators: [
                StartDateValidator('startDate', 'endDate'),
                EndDateValidator('endDate', 'startDate'),
                StartTimeValidator('startTime', 'startDate'),
                EndTimeValidator('endTime', 'endDate', 'startTime', 'startDate'),
            ]
        });
        this.nowZoned = utcToZonedTime(new Date(), this.me.timezone);
        this.timeOptions = [];
        const base = startOfDay(this.nowZoned);
        for (let i = 0; i <= 23; i++) {
            const hour = setHours(base, i);
            this.timeOptions.push(hour);
            this.timeOptions.push(setMinutes(hour, 30));
        }
        this.timeOptions.push(setMinutes(setHours(base, 23), 59));
        this.updateFromOptions();
        this.updateToOptions();
        this.updateBlackoutFromOptions();
        this.updateBlackoutToOptions();
    }

    ngOnInit() {
        this.getData();
        this.blackoutForm.get('startTime').valueChanges.subscribe(() => {
            this.updateBlackoutToOptions();
        });
        this.subs.add(this.blackoutForm.statusChanges.subscribe(
            (status) => this.isBlackoutFormValid$.next(status),
        ));
    }

    ngOnDestroy() {
        this.subs.unsubscribe();
    }

    get daysControl() {
        return this.availForm.controls.days as FormArray;
    }

    getData() {
        this.getAvailabilityList();
        this.getBlackoutList();
    }

    getBlackoutList() {
        this.loadingBlackouts = true;
        const start = startOfMonth(utcToZonedTime(new Date(), this.me.timezone));
        const end = endOfMonth(utcToZonedTime(new Date(), this.me.timezone));
        this.backend.getBlackoutList(this.me._id, start.toISOString(), end.toISOString()).pipe(
            take(1),
            map((blackoutList: any) => blackoutList.map(blackout => (
                    new Blackout(blackout.id, new Date(blackout.from), new Date(blackout.to), blackout.occurence)
                ))
            )
        ).subscribe(
            (blackoutList) => {
                this.blackoutList = blackoutList;
                this.loadingBlackouts = false;
            },
            () => {
                console.log('failed to get blackout list');
                this.loadingBlackouts = false;
            }
        );
    }

    getAvailabilityList() {
        this.loadingAvailabilities = true;
        const start = startOfDay(utcToZonedTime(new Date(), this.me.timezone));
        const end = addDays(endOfDay(start), 7);
        this.backend.getUserAvailability2(this.me, start.toISOString(), end.toISOString(), true)
            .pipe(
                take(1),
                map((availabilities: Availability2[]) => {
                    const ids = {};
                    return availabilities.filter(slot => {
                        if (_has(ids, slot.id)) {
                            return false;
                        }
                        ids[slot.id] = '';
                        return true;
                    }).sort((slotA, slotB) => {
                        if (slotA.from < slotB.from) {
                            return -1;
                        } else if (slotA.from > slotB.from) {
                            return 1;
                        }
                        return 0;
                    });
                }),
            )
            .subscribe(
                (availabilities) => {
                    this.availabilities = availabilities;
                    this.updateAvailabilityGroups(this.availabilities);
                    this.loadingAvailabilities = false;
                },
                () => this.loadingAvailabilities = false
            );
    }

    updateAvailabilityGroups(availabilityList: Availability2[]): void {
        const groups: Availability2[][] =  [[], [], [], [], [], [], []];
        for (const slot of availabilityList) {
            const groupIndex = getISODay(slot.from) % 7;
            groups[groupIndex].push({
                ...slot,
            });
        }

        for (const groupIndex in groups) {
            groups[groupIndex] = groups[groupIndex].sort((slotA, slotB) => {
                const dateA: Date = slotA.from;
                const dateB: Date = slotB.from;
                if (dateA < dateB) {
                    return -1;
                } else if (dateA > dateB) {
                    return 1;
                }
                return 0;
            });
        }

        this.scheduleGroups = groups;
    }

    resetForm() {
        this.availForm.reset();
        this.updateFromOptions();
        this.updateToOptions();
    }

    updateToOptions() {
        const options = this.timeOptions.slice(2);
        const value = this.availForm.get('from').value;
        if (value) {
            this.toOptions = options.filter(option => differenceInHours(option, value) >= 1);
        } else {
            this.toOptions = options;
        }
    }

    updateFromOptions() {
        const options = this.timeOptions.slice(0, this.timeOptions.length - 2);
        const value = this.availForm.get('to').value;
        if (value) {
            this.fromOptions = options.filter(option => differenceInHours(value, option) >= 1);
        } else {
            this.fromOptions = options;
        }
    }

    saveAvailability() {
        if (!this.availForm.valid) { return; }
        this.loading = true;
        const days = this.availForm.get('days').value as boolean[];
        const fromDate = this.availForm.get('from').value as Date;
        const to = this.availForm.get('to').value as Date;
        const createPayloads = [];
        days.map((addDay, index) => {
            if (addDay) {
                const now = utcToZonedTime(new Date(), this.me.timezone);
                let _from = setISODay(fromDate, index);
                let _to = setISODay(to, index);
                if (isBefore(_from, now)) {
                    _from = addDays(_from, 7);
                    _to = addDays(_to, 7);
                }
                _from = zonedTimeToUtc(_from, this.me.timezone);
                _to = zonedTimeToUtc(_to, this.me.timezone);
                createPayloads.push({from: _from.toISOString(), to: _to.toISOString(), recurrent: true});
            }
        });
        const sub = from(createPayloads).pipe(
            concatMap(payload => {
                return this.backend.createCurrentUserAvailability(payload);
            }),
            toArray(),
        ).pipe(take(1)).subscribe(
            () => {
                this.resetForm();
                this.notifications.notify('Availability set', 'Availability was successfully created');
                this.loading = false;
                this.resetCreateAvailability();
                this.getData();
            },
            (response: HttpErrorResponse) => {
                const error = response.error;
                this.notifications.notify('Couldn\'t add Availability', error.message);
                this.loading = false;
            }
        );
        this.subs.add(sub);
    }

    deleteAvailability(id: string) {
        this.deleting.set(id, true);
        this.subs.add(this.backend.deleteCurrentUserAvailability(id).pipe(take(1)).subscribe(
            () => {
                this.notifications.notify('Availability deleted', 'Availability was successfully deleted');
                this.availabilities = this.availabilities.filter(slot => slot.id !== id);
                this.updateAvailabilityGroups(this.availabilities);
                this.deleting.delete(id);
            },
            () => {
                this.notifications.notify('Failed to delete', 'Cannot delete availability');
            }
        ));
    }

    isDeleting(id: string) {
        return this.deleting.has(id);
    }

    resetCreateAvailability() {
        this.availForm.reset();
        this.toCreate = '';
    }

    resetCreateBlackout() {
        this.blackoutForm.reset();
        this.toCreate = '';
    }

    private updateBlackoutToOptions() {
        this.blackoutToOptions = [];
        for (let i = 0; i <= 23; i++) {
            this.blackoutToOptions.push(setHours(new Date(), i));
            this.blackoutToOptions.push(setMinutes(setHours(new Date(), i), 30));
        }
    }

    private updateBlackoutFromOptions() {
        const endTime = this.blackoutForm.get('endTime').value;
        this.blackoutFromOptions = this.timeOptions.filter((time: Date) => {
            return endTime ? differenceInHours(parse(endTime, 'h:mm a', new Date()), time) > 1 : true;
        });
   }

    createBlackout() {
        const { startDate, startTime, endTime, endDate } = this.blackoutForm.getRawValue();
        const from: Date = parse(startTime, 'h:m a', startDate.toDate());
        const to: Date = parse(endTime, 'h:m a', endDate.toDate());
        this.loading = true;
        this.subs.add(
            this.backend.createBlackoutWindow(from.toISOString(), to.toISOString()).subscribe(
                () => {
                    this.notifications.notify('Blackout set', 'Blackout was successfully created', 'calendar');
                },
                (err) => {
                    this.notifications.notify('Failed to add blackout', err.message);
                },
                () => {
                    this.getBlackoutList();
                    this.resetCreateBlackout();
                    this.loading = false;
                }
            )
        );
    }

    get startTimeErrorState() {
        return this.blackoutForm.hasError('startTime') && this.blackoutForm.touched;
    }

    parseTimeInput(event: Event) {
        const input = event.target as HTMLInputElement;
        let value = input.value;
        value = value.replace(/\s/g, '');
        const strFormats = ['H', 'h:ma', 'H:m', 'ha'];
        const controlName = input.getAttribute('formControlName');
        const control = this.blackoutForm.get(controlName) as FormControl;
        if (value) {
            let hasValid = false;
            for (const strFormat of strFormats) {
                const parsed = parse(value, strFormat, new Date());
                if (isValid(parsed)) {
                    hasValid = true;
                    control.setValue(format(parsed, 'h:mm a').toLowerCase());
                    break;
                }
            }
            if (!hasValid) {
                control.setValue('');
            }
        } else {
            control.setValue('');
        }
    }

    initAddAvailability() {
        this.toCreate = 'availability';
    }

    initAddBlackout() {
        this.toCreate = 'blackout';
        this.blackoutForm.get('startTime').setValue(format(addMinutes(new Date(), 61), 'p').toLowerCase());
        this.blackoutForm.get('startDate').setValue(moment().startOf('day'));
        this.blackoutForm.get('endDate').setValue(moment().endOf('day'));
        this.blackoutForm.get('endTime').setValue(format(endOfDay(new Date()), 'p').toLowerCase());
    }

    trackByIndex(index) {
        return index;
    }

    trackById(index, item: { id: string }) {
        return item.id;
    }

    deleteBlackout(id: string) {
        this.deleting.set(id, true);
        this.backend.deleteBlackoutWindow(id).pipe(take(1))
            .subscribe(
                () => {
                    this.notifications.notify('Blackout deleted', 'Blackout was successfully deleted');
                    this.blackoutList = this.blackoutList.filter(blackout => blackout.id !== id);
                },
                () => {
                    this.notifications.notify('Failed to delete', "Blackout wasn't deleted");
                },
                () => {
                    this.deleting.delete(id);
                }
            )
    }
}

/*
 * makes a form control invalid if form group has error
 */
export class FormErrorCodeErrorStateMatcher implements ErrorStateMatcher {
    private readonly errorCode: string;
    constructor(errorCode: string) {
        this.errorCode = errorCode;
    }
    isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
        return form.hasError(this.errorCode);
    }
}
