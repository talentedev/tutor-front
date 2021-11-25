import { ROUTE_CALENDAR } from '@routes';
import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    NgZone,
    OnDestroy,
    OnInit,
    ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationsService } from '@services/notifications';
import { Auth, Backend } from '../../../../lib/core/auth';
import { HttpErrorResponse } from '@angular/common/http';
import * as moment from 'moment-timezone';
import { Subject, TutoringSubject, User } from '../../../../models';
import { PopoverTooltipDirective } from '../../../../common/directives/popover-tooltip';
import { InstantSession, Lesson, LessonNote } from '../../../../models/lesson';
import { AlertService } from '@services/alerts';
import { MapsAPILoader } from '@agm/core';
import { SpecificAvailabilityComponent } from '../../../../common/specific-availability/specific-availability.component';
import { Media } from 'app/lib/core/media';
import { Subscription } from 'rxjs';
import { DialogsFacade } from '../../../../dialogs';

@Component({
    selector: 'learnt-calendar-more-details',
    templateUrl: './more-details.component.html',
    styleUrls: ['./more-details.component.scss', './more-details.component.lowres.scss']
})
export class CalendarMoreDetailsComponent implements OnInit, OnDestroy {
    @ViewChild('tooltipSubjects', {read: PopoverTooltipDirective})
    tooltipSubjects: PopoverTooltipDirective;

    @ViewChild('tooltipOnline', {read: PopoverTooltipDirective})
    tooltipOnline: PopoverTooltipDirective;

    public date = moment().add(1, 'day');
    public offset = moment();
    public readonly today: moment.Moment;
    /**
     * Meeting place & location.
     * Location is either a string representing the address,
     * or a link to the online classroom.
     */
    public meet: number;
    public location: string;
    private oldLocation: string;

    /**
     * Lesson's subject.
     */
    public subject: Subject;
    public subjectList: TutoringSubject[];

    /**
     * How much the tutor earned.
     */
    public earned: number;

    /**
     * Boolean flags.
     */
    public loading: boolean;
    public loadingAction: boolean;
    public meetLocationEditing: boolean;

    /**
     * Component is available for multiple endpoints, and we differentiate
     * them by the 'mode' in the route data. Available modes:
     * details, edit, cancel
     */
    public mode: string;

    public mobile: boolean;
    public mediaSubscription: Subscription;

    @ViewChild('reason')
    reasonTextArea: ElementRef;
    public reasonPristine = true;

    @ViewChild('note')
    noteTextArea: ElementRef;
    public notePristine = true;

    public myNotes: LessonNote[];
    public otherNotes: LessonNote[];

    private changedElements: { subject: boolean, location: boolean, datetime: boolean } = {
        subject: false,
        location: false,
        datetime: false,
    };

    public warning24hoursCancellation: boolean;

    public hider: EventEmitter<boolean> = new EventEmitter<boolean>();

    public fromTime: number[];
    public toTime: number[];
    public intervalTime: number[];

    private lessonTimeProposal: { when: string, ends: string };

    /**
     * Lesson retrieved from the API.
     */
    private lesson: Lesson;
    private session: InstantSession;

    private readonly isInstant: boolean = false;

    private me: User;
    private subs: Subscription;

    constructor(private alerts: AlertService,
                private auth: Auth,
                private mapsApiLoader: MapsAPILoader,
                private dialog: DialogsFacade,
                private notifications: NotificationsService,
                private route: ActivatedRoute,
                private router: Router,
                private zone: NgZone,
                private backend: Backend,
                private media: Media,
                private cd: ChangeDetectorRef) {
        this.subs = new Subscription();
        this.mode = this.route.routeConfig.data.mode;
        const instant = this.route.snapshot.queryParamMap.get('instant');
        this.isInstant = instant === 'true';

        this.mobile = !media.query('gt-sm');
        this.mediaSubscription = media.watch('gt-sm').subscribe(event => {
            this.mobile = !event.active;
            if (!this.cd['destroyed']) {
                this.cd.detectChanges();
            }
        });
    }

    /**
     * Return the current lesson's id.
     * @return {string}
     */
    public get lessonID(): string {
        if (this.isInstant) {
            return this.session.id;
        }
        return this.lesson._id;
    }

    public get hasChanges(): boolean {
        if (this.changedElements === undefined) {
            return false;
        }

        let changed = false;
        for (const k in this.changedElements) {
            if (this.changedElements[k]) {
                changed = true;
                break;
            }
        }

        return changed;
    }

    public get canBeModified(): boolean {

        if (this.isInstant) {
            return false;
        }

        if (this.lesson.starts_at.diff(moment().tz(this.me.timezone.replace(' ', '_'))) <= 0) {
            return false;
        }

        switch (this.lesson.state) {
            case Lesson.State.Progress:
            case Lesson.State.Completed:
            case Lesson.State.Cancelled:
                return false;
            default:
                return true;
        }
    }

    ngOnInit(): void {
        document.getElementsByTagName('learnt-account-page')[0].classList.add('more-details');

        this.auth.me.subscribe((u: User) => {
            this.me = u;

            this.route.params.subscribe(params => {
                if (params['id'] === undefined || params['id'] === '') {
                    this.calendarAndNotify();
                    return;
                }

                this.getLesson(params['id']);
            });
        });
    }
    
    ngOnDestroy(): void {
        this.subs.unsubscribe();
        document.getElementsByTagName('learnt-account-page')[0].classList.remove('more-details');
        this.mediaSubscription.unsubscribe();
    }

    /**
     * Initialise Google maps autocomplete for location input.
     */
    public initGoogleLocation(): void {
        const popoverElem = this.tooltipOnline.overlayRef.overlayElement;
        const input = popoverElem.getElementsByTagName('input')[0];

        this.mapsApiLoader.load().then(() => {
            const autocomplete = new google.maps.places.Autocomplete(input, {
                types: ['address']
            });

            autocomplete.addListener('place_changed', () => {
                this.zone.run(() => {
                    const place: google.maps.places.PlaceResult = autocomplete.getPlace();

                    if (place.geometry === undefined || place.geometry === null) {
                        return;
                    }

                    this.location = place.formatted_address;
                    this.changedElements.location = true;
                });
            });
        });
    }

    /**
     * Change the subject.
     * @param {Subject} subject
     */
    public changeSubject(subject: Subject): void {
        this.subject = subject;
        this.tooltipSubjects.detectChanges();
        this.hider.next(true);
        this.changedElements.subject = true;
    }

    /**
     * Change the meet type.
     * @param {number} type
     */
    public changeMeetType(type: 'online' | 'offline'): void {
        switch (type) {
            case 'online':
                this.meet = Lesson.Location.Online;
                break;
            case 'offline':
                this.meet = Lesson.Location.Offline;
                break;
            default:
                return;
        }
        this.lesson.meet = this.meet;
        this.tooltipOnline.detectChanges();
        this.changedElements.location = true;
    }

    /**
     * Change in person meeting place.
     */
    public changeMeetLocation(): void {
        if (this.location === undefined) {
            this.location = '';
        }
        this.meetLocationEditing = true;
        this.tooltipOnline.detectChanges();
        this.initGoogleLocation();
    }

    /**
     * Close the location editing.
     */
    public closeLocationEditing(): void {
        this.meetLocationEditing = false;
        this.tooltipOnline.detectChanges();
        this.hider.next(true);
    }

    /**
     * Cancel location editing, reset location to old value and close panel.
     */
    public cancelLocationEditing(): void {
        this.location = this.oldLocation;
        this.closeLocationEditing();
    }

    public timeChanged(event: any): void {
        this.changedElements.datetime = true;

        const parsedTime = SpecificAvailabilityComponent.fromString(event);
        if (parsedTime === null) {
            this.notifications.notify('Invalid time', 'An error occurred reading time and date, please try again.', 'close');
            return;
        }

        const parsedDate = parsedTime.date;
        const date = this.lesson.starts_at.clone().year(parsedDate.year()).month(parsedDate.month()).day(parsedDate.day());
        const timeRange = parsedTime.time;

        const min = timeRange.min.clone();
        const max = timeRange.max.clone();

        const fromTime = date.clone().hour(min.hour).minute(min.minute);
        const toTime = date.clone().hour(max.hour).minute(max.minute);

        this.lessonTimeProposal = {
            when: fromTime.toISOString(),
            ends: toTime.toISOString(),
        };
    }

    /**
     * Redirect the user to the calendar and send a notification stating the reason.
     * @param {string} title
     * @param {string} message
     */
    private calendarAndNotify(title = 'Wrong lesson', message = `Couldn't find any lesson matching that link`): void {
        this.router.navigateByUrl(ROUTE_CALENDAR).then(() => {
            this.notifications.notify(title, message, 'calendar');
        });
    }

    /**
     * Get lesson by its ID.
     * @param {string} lessonID
     */
    private getLesson(lessonID: string): void {
        this.loading = true;

        if (this.isInstant) {
            this.backend.getInstantSession(lessonID).subscribe(lesson => {
                this.parseSession(lesson);
            }, (error: HttpErrorResponse) => {
                let message = '';
                if (error.status === 404) {
                    message = 'We couldn\'t find the specified instant session.';
                } else {
                    message = 'We encountered an error retrieving that instant session, please try again later.';
                }
                this.calendarAndNotify('Couldn\'t retrieve session', message);
            });
        } else {
            this.subs.add(this.backend.getLesson(lessonID, this.me).subscribe(lesson => {
                this.parseLesson(lesson);
            }, (error: HttpErrorResponse) => {
                console.log(error);
                let message = '';
                if (error.status === 404) {
                    message = 'We couldn\'t find the specified lesson.';
                } else {
                    message = 'We encountered an error retrieving that lesson, please try again later.';
                }
                this.calendarAndNotify('Couldn\'t retrieve lesson', message);
            }, () => { 
                this.loading = false;
            }));
        }
    }

    /**
     * Return the (currently first and only) student of the lesson.
     * @return {User}
     */
    public get student(): User {
        if (this.isInstant) {
            return this.session.student;
        }
        return this.lesson.students[0];
    }

    /**
     * Return the lesson's tutor.
     * @return {User}
     */
    public get tutor(): User {
        if (this.isInstant) {
            return this.session.tutor;
        }
        return this.lesson.tutor;
    }

    /**
     * Return the other participant of the lesson. If we're the student, return the tutor, or the other way round.
     * @return {User}
     */
    public get other(): User {
        return this.role === 'student' ? this.tutor : this.student;
    }

    /**
     * Return the current user's role.
     * @return {"student" | "tutor"}
     */
    public get role(): 'student' | 'tutor' {
        switch (this.me._id) {
            case this.student._id:
                return 'student';
            case this.tutor._id:
                return 'tutor';
        }
    }

    public get startsAt(): moment.Moment {
        if (this.isInstant) {
            return this.session.starts_at;
        }
        return this.lesson.starts_at;
    }

    public get endedAt(): moment.Moment {
        if (this.isInstant) {
            return this.session.ended_at;
        }
        return this.lesson.ends_at;
    }

    /**
     * If the lesson is in progress and room is created, return the room link.
     * @return {string | null}
     */
    public get classLink(): string | null {
        if (this.lesson.room === null) {
            return null;
        }

        return `/main/class/${this.lesson.room}`;
    }

    private parseSession(lesson: InstantSession): void {
        this.session = lesson;
        this.getNotes();

        // 1 dollar per minute
        this.earned = this.endedAt.diff(this.startsAt, 'minutes', true);

        this.loading = false;
    }

    /**
     * Parse a lesson response.
     * @param lessonResponse
     */
    private parseLesson(lesson: Lesson): void {

        this.lesson = lesson;

        this.getNotes();

        if (this.mode === 'cancel' || this.mode === 'edit') {
            if (!this.canBeModified) {
                this.router.navigateByUrl(`/main/account/calendar/details/${this.lessonID}`).then(() => {
                    const message = `Lesson is set as ${Lesson.StateString(this.lesson.state)} and can't be modified or cancelled.`;
                    this.notifications.notify('Lesson can\'t be edited', message, 'calendar');
                });
                return;
            }

            const diff = moment().tz(this.me.timezone.replace(' ', '_')).diff(this.lesson.starts_at, 'hours');
            const diffAbs = Math.abs(diff);

            if (diffAbs >= 0 && diffAbs <= 24) {
                this.warning24hoursCancellation = true;
            }
        }

        if (this.lesson.students.length === 0) {
            this.calendarAndNotify('Error retrieving students', 'We encountered an error retrieving the lesson\'s students.');
            return;
        }

        this.subjectList = this.lesson.tutor.tutoring.subjects;
        this.subject = this.lesson.subject;

        this.earned = this.endedAt.diff(this.startsAt, 'hours', true) * lesson.rate;

        switch (this.lesson.meet) {
            case Lesson.Location.Online:
                // location will be the room's link
                // todo
                break;
            case Lesson.Location.Offline:
                this.location = this.lesson.location;
                this.oldLocation = this.location;
                break;
        }

        this.setTimeRanges(); 
    }

    /**
     * Set the time ranges & centered interval for the specific time component.
     */
    private setTimeRanges(): void {
        this.fromTime = [this.lesson.starts_at.hour(), this.lesson.starts_at.minute()];
        this.toTime = [this.lesson.ends_at.hour(), this.lesson.ends_at.minute()];

        let fromHour = Math.ceil(this.fromTime[0] - (12 - this.fromTime[0]) / 2);
        if (fromHour === 12) {
            fromHour = 10;
        }
        if (fromHour + 12 > 24) {
            fromHour = 12;
        }
        if (fromHour < 0) {
            fromHour = 0;
        }

        this.intervalTime = this.mobile ? [fromHour + 3, fromHour + 9] : [fromHour, fromHour + 12];
    }

    /**
     * Set or unset current lesson's recurrent flag.
     */
    public setRecurrent(r: boolean): void {
        if (this.lesson.recurrent === r) {
            return;
        }

        const alertOpts = {lifetime: 0, buttons: [{label: 'Yes', result: true}, {label: 'No', result: false}]};
        const alertMessage = `Are you sure you want to ${r ? 'set lesson as recurrent' : 'disable lesson recurrency'}?`;
        const alert = this.alerts.alert(`${r ? 'Enable' : 'Disable'} recurrency`, alertMessage, alertOpts);

        alert.result.subscribe(res => {
            if (res === true) {
                this.backend.setLessonRecurrent(this.lessonID, r).subscribe(() => {
                    const message = `Successfully ${r ? 'set lesson as recurrent' : 'cancelled recurrent lessons'}.`;
                    this.notifications.notify('Lesson updated', message, 'calendar');
                    this.getLesson(this.lessonID);
                }, (error: HttpErrorResponse) => {
                    const title = 'Couldn\'t update lesson';
                    const message = `Couldn't ${r ? 'set lesson as recurrent' : 'cancel recurrent lesson'}, please try again later.`;
                    this.notifications.notify(title, message, 'close');
                });
            }
            alert.dispose();
        });
    }

    /**
     * Message the other participant in the lesson. If we're the student, message the tutor,
     * otherwise if we're the tutor, message the student.
     */
    public messageOther(): void {
        if (this.student === null) {
            this.notifications.notify('Couldn\'t start conversation', 'No student found for this lesson.', 'close');
            return;
        }

        this.dialog.showSendMessage(this.me, this.other);
    }

    private getNotes(): void {
        this.myNotes = [];
        this.otherNotes = [];

        this.backend.getLessonNotes(this.lessonID).subscribe(notes => {
            for (const note of notes) {
                if (note.user === this.me._id) {
                    this.myNotes.push(note);
                } else {
                    this.otherNotes.push(note);
                }
            }
        });
    }

    public addNote(): void {
        const nativeElement = <HTMLTextAreaElement>this.noteTextArea.nativeElement;

        if (nativeElement.value === '') {
            this.notifications.notify('Couldn\'t add note', 'Can\'t add an empty note.', 'close');
            return;
        }

        this.loadingAction = true;

        this.backend.createLessonNote(this.lessonID, nativeElement.value).subscribe(() => {
            this.loadingAction = false;
            this.getNotes();

            (<HTMLTextAreaElement>this.noteTextArea.nativeElement).value = '';
            this.notePristine = true;

            this.notifications.notify('Note added', 'The note was successfully added!', 'user');
        }, (error: HttpErrorResponse) => {
            this.loadingAction = false;
            this.notifications.notify('Couldn\'t add note', 'Couldn\'t add note, please try again later.', 'close');
        });
    }

    public userById(id: string): User {
        if (this.other._id === id) {
            return this.other;
        }
        return this.me;
    }

    /**
     * Cancel the class with the reason provided.
     */
    public cancelClass(): void {
        const nativeElement = <HTMLTextAreaElement>this.reasonTextArea.nativeElement;

        if (nativeElement.value === '') {
            this.notifications.notify('Couldn\'t cancel lesson', 'You must enter a reason for cancelling the lesson.', 'close');
            return;
        }

        // Alert popup after clicking cancel button
        const alertOpts = {lifetime: 0, buttons: [{label: 'Cancel just this', result: 1}, {label: 'Cancel this and future occurrences', result: 2}], closeButton: true};
        const alertMessage = 'This lesson is part of a recurring series. Do you want to:';
        const alert = this.alerts.alert('Cancel lesson', alertMessage, alertOpts);
        alert.result.subscribe(res => {  
            alert.dispose();

            // res===0 if close button is clicked
            if(res !== 0) {
                // Alert popup after clicking any button from the first alert popup
                const alertOpts2 = {lifetime: 0, buttons: [{label: 'Yes', result: true}, {label: 'No', result: false}]};
                const alert2 = this.alerts.alert('Are you sure?', null, alertOpts2);
                alert2.result.subscribe(res2 => {
                    if (res2) {              
                        this.loadingAction = true;
                        if(res === 1) {
                            this.backend.cancelLesson(this.lessonID, nativeElement.value).subscribe(() => {
                                this.loadingAction = false;
                                this.router.navigateByUrl(`/main/account/calendar/details/${this.lessonID}`).then(() => {
                                    this.alerts.alert('Lesson Cancelled', `We will notify ${this.other.profile.first_name} you cancelled your class.`);
                                });
                            }, (error: HttpErrorResponse) => {
                                this.loadingAction = false;
                                this.notifications.notify('Couldn\'t cancel lesson', 'Couldn\'t cancel the lesson, please try again later.', 'close');
                            });
                        }
                        else if(res === 2) {   
                            this.backend.cancelRecurrentLesson(this.lessonID, nativeElement.value).subscribe(() => {
                                this.loadingAction = false;
                                this.router.navigateByUrl(`/main/account/calendar/details/${this.lessonID}`).then(() => {
                                    this.alerts.alert('Recurring Lesson Cancelled', `We will notify ${this.other.profile.first_name} you cancelled your class.`);
                                });
                            }, (error: HttpErrorResponse) => {
                                this.loadingAction = false;
                                this.notifications.notify('Couldn\'t cancel lesson', 'Couldn\'t cancel the lesson, please try again later.', 'close');
                            });
                        }     
                    }

                    alert2.dispose();
                });
            }
        });

        
    }


    /**
     * Ask for request change confirmation & send it.
     */
    public updateClass(): void {
        if (!this.hasChanges) {
            return;
        }

        const hasChangeRequests = this.lesson.change_proposals !== undefined && this.lesson.change_proposals.length > 0;
        const isNotAccepted = this.lesson.accepted.length !== this.lesson.students.length + 1;
        if (hasChangeRequests && isNotAccepted) {
            this.alerts.alert('Can\'t request change', 'A change request was already proposed and awaits confirmation.');
            return;
        }

        const alertOpts = {lifetime: 0, buttons: [{label: 'Yes', result: true}, {label: 'No', result: false}]};
        let alertMessage = 'Are you sure you want to make these changes to your lesson?';
        alertMessage += 'The other participants of the lesson will be notified of these changes.<br>';
        for (const k in this.changedElements) {
            if (!this.changedElements[k]) {
                continue;
            }
            let item = '';
            switch (k) {
                case 'datetime':
                    item = 'date and time';
                    break;
                default:
                    item = k;
            }
            alertMessage += `<br>- ${item}`;
        }
        const alert = this.alerts.alert('Propose changes', alertMessage, alertOpts);

        alert.result.subscribe(res => {
            if (res === true) {
                this.updateClassConfirm();
            }
            alert.dispose();
        });
    }

    private updateClassConfirm(): void {
        this.loadingAction = true;

        const payload: {
            subject?: string,
            meet?: number,
            location?: string,
            when?: string,
            ends?: string,
        } = {};

        if (this.changedElements.subject) {
            payload.subject = this.subject._id;
        }

        if (this.changedElements.location) {
            payload.meet = this.meet;
            payload.location = this.location;
        }

        if (this.changedElements.datetime) {
            payload.when = this.lessonTimeProposal.when;
            payload.ends = this.lessonTimeProposal.ends;
        }

        this.backend.proposeLessonChange(this.lessonID, payload).subscribe(() => {
            this.loadingAction = false;
            this.router.navigateByUrl(`/main/account/calendar${this.lessonID}`).then(() => {
                this.alerts.alert('Lesson Updated', `We will notify the other participants about these changes.`);
            });
        }, (error: HttpErrorResponse) => {
            this.loadingAction = false;

            const err = error.error;
            const notify = (t: string, m: string) => this.notifications.notify(t, m, 'close', 10 * 1000);

            let notifyMessage = `Encountered an issue while requesting a lesson change.`;

            if (err.error === undefined) {
                notify('Error requesting a lesson change', notifyMessage);
                return;
            }

            if (err.raw === undefined || err.raw.type === undefined) {
                notify('Error requesting a lesson change', `We couldn't request the lesson change: ${err.message}.`);
                return;
            }

            switch (<number>err.raw.type) {
                case 0:
                    // invalid user
                    notifyMessage = `Specified user is invalid, please make sure you filled the form correctly and try again later.`;
                    break;
                case 3:
                    // invalid time
                    notifyMessage = `Encountered an issue related to the selected time: ${err.raw.message}.`;
                    break;
                case 5:
                    // invalid proposal
                    notifyMessage = `We couldn't request the lesson change: ${err.raw.message}`;
                    break;
                default:
                    notifyMessage = `Received an unknown error while requesting a lesson change with ${this.other.profile.first_name}.`;
            }

            notify('Couldn\'t request the lesson change', notifyMessage);
        });
    }

    hasLessonTimeRange(): boolean {
        return !!(this.lesson.starts_at && this.lesson.ends_at);
    }
}
