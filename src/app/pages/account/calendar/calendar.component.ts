import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
    AfterContentInit,
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ComponentRef,
    ElementRef,
    EmbeddedViewRef,
    EventEmitter,
    HostListener,
    NgZone,
    OnDestroy,
    OnInit,
    Renderer2,
    TemplateRef,
    ViewChild
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Media } from 'app/lib/core/media';
import * as moment from 'moment-timezone';
import { Subscription } from 'rxjs/Subscription';
import { PopoverBoxComponent, PopoverBoxSettings } from '../../../common/popover-box/popover-box.component';
import { Backend } from '../../../lib/core/auth';
import { Availability, AvailabilitySlot, User } from '../../../models';
import { InstantSession, Lesson, LessonAggregate, LessonNotificationType } from '../../../models/lesson';
import { NotificationsService } from '../../../services/notifications';
import { TimezoneService } from '../../../services/timezone';
import { SocketService } from 'app/lib/core/socket';
import _get from 'lodash-es/get';

@Component({
    selector: 'learnt-calendar-page',
    templateUrl: './calendar.component.html',
    styleUrls: ['./calendar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarPageComponent implements OnInit, OnDestroy, AfterContentInit, AfterViewInit {

    /**
     *  Current user
     */
    me: User;

    /**
     * Boolean flags.
     */
    public saving = false;

    /**
     * Host
     */
    public host = environment.HOST;

    /**
     * The date - initialized to current date, changes on modifying the date in the calendar.
     */
    private activeDate: moment.Moment;
    public today: moment.Moment;
    private prevDate: moment.Moment;
    private weekStart: moment.Moment;
    private weekEnd: moment.Moment;

    /**
     * Calendar dates and hours. 7 and 24 items arrays.
     */
    calendarDates: moment.Moment[];
    calendarHours: moment.Moment[];
    readonly dayHours: number[] = new Array(24).fill(null).map((_, i) => i);
    private embeddedTpl: EmbeddedViewRef<any> | undefined;
    private overlayRef: OverlayRef | undefined;

    // cache current month lessons
    lessonsMonth: number | null = null;

    // fetch week/month lessons
    lessons!: LessonAggregate;
    dayLessons!: LessonAggregate;
    weekLessons!: LessonAggregate;
    monthLessons!: LessonAggregate;

    availability!: Availability;
    fetchingData = false;

    /**
     * Availability form group & control struct.
     */
    availForm: FormGroup;
    availFormEl: {
        shown: boolean;
        direction: 'left' | 'right' | 'bottom-right' | 'bottom-left';
        top: number; left: number;
        date: moment.Moment;
    } = {
        shown: false,
        direction: 'left',
        top: 0, left: 0,
        date: moment().utc()
    };

    /**
     * Availability hours arrays.
     */
    private availabilityHours: string[] = [];
    availabilityHoursFiltered: { from: string[], to: string[] } = { from: [], to: [] };

    availabilityEntries: Availability[] = [];

    readonly hider: EventEmitter<boolean>;

    /**
     * Design variables used in determining the dynamic height & margin.
     * @type {number}
     */
    private rowHeight = 39;
    private blockHeight = 39;
    private marginTop = 3;

    mobile: boolean;

    loading!: number;

    private instantSubscription!: Subscription;
    private lessonSubscription!: Subscription;

    @ViewChild('timeRow')
    timeRow!: ElementRef;

    @ViewChild('availabilityEditMenu')
    availabilityEditMenu!: TemplateRef<any>;
    private socketSub!: Subscription;
    private subscriptions = new Subscription();

    constructor(private backend: Backend,
                private notifications: NotificationsService,
                private router: Router,
                private route: ActivatedRoute,
                private timezoneService: TimezoneService,
                private overlay: Overlay,
                private media: Media,
                private socket: SocketService,
                private elementRef: ElementRef<HTMLDivElement>,
                private ngZone: NgZone,
                private cd: ChangeDetectorRef,
                private renderer2: Renderer2) {
        this.calendarHours = [];
        this.calendarDates = [];
        this.hider = new EventEmitter<boolean>();
        this.me = route.snapshot.data.me;
        this.today = moment().tz(this.me.timezone);
        this.activeDate = this.today.clone();
        this.weekStart = this.activeDate.clone().startOf('week');
        this.weekEnd = this.activeDate.clone().endOf('week');
        this.availForm = new FormGroup({
            date: new FormControl('', Validators.required),
            from: new FormControl('', Validators.required),
            to: new FormControl('', Validators.required),
            recurrent: new FormControl(true)
        });

        this.mobile = !media.query('gt-sm');
        media.watch('gt-sm').subscribe((event: any) => {
            this.mobile = !event.active;
            if (!(<any>this.cd)['destroyed']) {
                this.cd.detectChanges();
            }
        });

        this.buildCalendarHours();
        this.buildCalendarDates();
        this.buildAvailabilityHours();
    }

    ngOnInit(): void {
        this.cd.detectChanges()
        this.fetchData();
        this.subscriptions.add(this.socket.on('notification').subscribe(
            event => {
                const type = _get(event, 'data.data.notification.type');
                if (type === LessonNotificationType.LessonAccepted) {
                    // force loading lessons
                    this.lessonsMonth = null;
                    this.fetchData()
                }
            }
        ));
    }

    ngOnDestroy(): void {
        this.hider.unsubscribe();
        this.subscriptions.unsubscribe();
    }

    ngAfterContentInit() {}

    ngAfterViewInit(): void {
        // this.shiftToNow();
        this.shiftToDayStart();
    }

    shiftToNow() {
        this.ngZone.run(() => {
            if (this.elementRef && this.elementRef.nativeElement) {
                const nowIndicator = this.elementRef.nativeElement.querySelector('#calendar-now')
                if (nowIndicator) {
                    nowIndicator.scrollIntoView()
                }
            }
        })
    }

    shiftToDayStart() {
        this.ngZone.run(() => {
            if (this.elementRef && this.elementRef.nativeElement) {
                const dayStart = this.elementRef.nativeElement.querySelector('.scrollHere');
                if (dayStart) {
                    dayStart.scrollIntoView()
                }
            }
        })
    }

    scrollToContent() {

        let first!: moment.Moment;

        if (this.availability) {
            for (const av of this.availability.forWeek(this.activeDate)) {
                if (!first || av.from.isBefore(first)) {
                    first = av.from;
                }
            }
        }

        if (this.lessons) {
            for (const lesson of this.lessons.items) {
                if (!first || lesson.starts_at.isBefore(first)) {
                    first = lesson.starts_at
                }
            }
        }

        if (first && this.elementRef && this.elementRef.nativeElement) {
            const top = this.getHourTopPosition(first.clone().add(-30, 'minute'));
            this.elementRef.nativeElement.querySelector('#calendar-scroller').scrollTo(
                0,
                top
            )
        }
    }

    timeToDate(d: string, t: string): moment.Moment | undefined {
        if (!/^[0-9]{1,2}:[0-9]{1,2} (a|p)m$/.test(t)) {
            return;
        }

        const delimColon = t.indexOf(':');
        const delimSpace = t.indexOf(' ');

        const hours = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
        let hour = hours.indexOf(t.substring(0, delimColon));
        const minute = parseInt(t.substring(delimColon + 1, delimSpace), 10);
        const period = t.substring(delimSpace + 1);
        if (period === 'pm') {
            hour += 12;
        }
        // remove the UTC timezone so when we convert it will be in the users timezone
        const dd = moment(d.substring(0, 19)).format('MM/DD/YYYY');
        return moment.tz(dd, 'MM/DD/YYYY', this.me.timezone).hour(hour).minute(minute).utc();
    }

    /**
     * Submit the availability for the selected date.
     */
    addAvailability(): void {
        if (this.availForm.get('recurrent').value === null) {
            this.availForm.get('recurrent').setValue(false);
        }

        const form = this.availForm.getRawValue();

        if (form.date === undefined || form.from === undefined || form.to === undefined) {
            return;
        }

        const fromDate = this.timeToDate(form.date, form.from);
        const toDate = this.timeToDate(form.date, form.to);
        if (fromDate === undefined || toDate === undefined) {
            return;
        }

        const payload = {
            recurrent: form.recurrent,
            from: fromDate.format(),
            to: toDate.format()
        };

        // TODO: Remove this function
        this.subscriptions.add(this.backend.createCurrentUserAvailability(payload).subscribe(() => {
            this.availFormEl.shown = false;
            this.notifications.notify('Availability set', 'Calendar was updated.', 'calendar');
            this.fetchData();
        }, (response: HttpErrorResponse) => {
            const error = response.error
            if (error.data.fields === undefined) {
                let message = `There was a problem setting the availability`;
                if (error.data.raw) {
                    message += `: ${error.data.raw}`;
                }
                this.notifications.notify(`Couldn't add availability`, message);
                return;
            }

            const fromField = error.data.fields['from'];
            const toField = error.data.fields['to'];

            if (fromField !== undefined) {
                this.availForm.get('from').setErrors({ apiError: fromField });
            }

            if (toField !== undefined) {
                this.availForm.get('to').setErrors({ apiError: toField });
            }
        }));
    }

    /**
     * Show the availability form for the selected date.
     * @param event
     * @param {moment.Moment} date
     * @param {number} hour
     * @param {boolean} halfHour
     */
    showAddAvailForm(event: any, date: moment.Moment, hour ?: number, halfHour ?: boolean): void {
        event.preventDefault();
        event.stopPropagation();

        if (!this.me.isTutor()) {
            return;
        }

        if (hour !== undefined && hour > 23) {
            return;
        }

        const screenWidth = document.documentElement.clientWidth;
        const screenHeight = document.documentElement.clientHeight;

        let target = event.target;
        if (target.children.length > 0) {
            // if clicking on the span's parent div, use the span as target
            target = target.children[0];
        }
        const dateRect = target.getBoundingClientRect();

        this.availForm.reset({recurrent: true});
        this.availFormEl.date = date.clone();
        const isoTime = this.availFormEl.date.hour(0).minute(0).second(0).millisecond(0).toISOString();
        this.availForm.get('date').setValue(isoTime);
        this.availFormEl.shown = true;

        // pseudo-tooltip is 235
        if (screenWidth - dateRect.right > 300) {
            // enough space on the right to display the form
            this.availFormEl.direction = 'right';
            this.availFormEl.left = dateRect.right + 20;
        } else {
            // not enough space on the right, position on left
            this.availFormEl.direction = 'left';
            this.availFormEl.left = dateRect.left - 235 - 30;
        }

        if (screenHeight - dateRect.top > 300) {
            // enough space on the top to display the form
            this.availFormEl.top = dateRect.top - 70;
        } else {
            if (screenWidth - dateRect.right > 300) {
                // enough space on the right to display the form
                this.availFormEl.top = dateRect.top - 70;
                this.availFormEl.direction = 'bottom-left';
            } else {
                // not enough space on the right, position on left
                this.availFormEl.top = dateRect.top - 70;
                this.availFormEl.direction = 'bottom-right';
            }
        }

        if (hour !== undefined) {
            this.availFormEl.top += 35; // add half an hour block
            const minuteSelector = halfHour ? 1 : 2;
            const fromTime = this.availabilityHoursFiltered.from[((hour + 1) * 2) - minuteSelector];
            this.availForm.get('from').setValue(fromTime);
            this.availForm.get('from').markAsTouched();
        }
    }

    /**
     * Close the availability form if shown, if clicked outside of it.
     * @param $event
     */
    @HostListener('document:click', ['$event'])
    clickedOutside($event: any) {
        if (!/mat-option/.test($event.target.className)) {
            // bypass mat-autocomplete
            if (this.availFormEl.shown) {
                this.availFormEl.shown = false;
            }
        }
        if (!/class-wrapper/.test($event.target.className)) {
            this.hider.next(true);
        }
    }

    onScrollDiv($event: any): void {
        this.hider.next(true);
        this.availFormEl.shown = false;
    }

    now(): moment.Moment {
        return moment.tz(this.me.timezone)
    }

    /**
     * Get availability's height.
     * @param {Availability} av
     * @return {number}
     */
    getAvailHeight(av: AvailabilitySlot): number {
        const from = moment(av.from);
        const to = moment(av.to);
        /* duration in minutes times (% per minute) */
        return this.rowHeight / 60 * to.diff(from, 'minutes');
    }

    /**
     * Get availability's top.
     * @param {Availability} av
     * @return {number}
     */
    getHourTopPosition(m: moment.Moment): number {
        const minPix = (this.rowHeight / 60);
        /* start hour times row height plus start minutes times (pixel per minute) */
        return this.rowHeight * m.hour() + minPix * m.minute();
    }

    /**
     * Get dynamic height for a class block.
     * @param {Lesson} l
     * @return {number}
     */
    getLessonHeight(l: Lesson | InstantSession): number {
        if (isNaN(l.duration)) {
            return 0;
        }
        const height = l.duration * this.rowHeight / this.blockHeight;
        return height < 5 ? height : height - this.marginTop;
    }

    /**
     * Get dynamic top for a class block.
     * @param {Lesson} l
     * @return {number}
     */
    getLessonTop(l: Lesson): number {
        const hour = l.starts_at.hour(), minute = l.starts_at.minute();
        return this.rowHeight * hour + (this.rowHeight / this.blockHeight) * minute + this.marginTop;
    }

    getInstantTop(i: InstantSession): number {
        const hour = i.starts_at.hour(), minute = i.starts_at.minute();
        return this.rowHeight * hour + (this.rowHeight / this.blockHeight) * minute + this.marginTop;
    }

    /**
     * Get the direction for the tooltip based on the day. Last two days of the week don't have
     * the required space to the right.
     * @param {number} i
     * @return {string}
     */
    getDirection(i: number): string {
        return i < 4 ? 'left' : 'right';
    }

    /**
     * Get the X and Y offset for the tooltip based on the day. Last two days have tooltips pop
     * to the left instead of right, and they need special offsets.
     * @param {number} i
     * @param {string} offset
     * @return {number}
     */
    getOffset(i: number, offset: string): number {
        switch (offset.toLowerCase()) {
            case 'x':
                return !this.mobile && this.getDirection(i) === 'left' ? 40 : -10;
            case 'y':
                return -5;
            default:
                return 0;
        }
    }

    /**
     * Set the calendar dates.
     * @param {moment.Moment} date
     */
    setDate(date: moment.Moment) {

        if (this.activeDate.isSame(date)) {
          return;
        }
        this.prevDate = this.activeDate;
        this.activeDate = date.clone();
        this.weekStart = this.activeDate.clone().startOf('week');
        this.weekEnd = this.activeDate.clone().endOf('week');
        this.buildCalendarDates();
        this.scrollToContent();
        this.fetchData();
    }

    isToday() {
        return this.today ? this.today.isSame(this.activeDate, 'day') : false;
    }

    private fetchData(): void {
        this.fetchingData = true;

        Promise.all([
            this.getWeekLessons(this.activeDate.clone()),
            this.getDayLessons(this.activeDate.clone()),
            this.getAvailability(),
            this.getInstantSessions()
        ]).then(() => {
            this.fetchingData = false;
            this.cd.detectChanges();
        }).catch(() => {
            this.fetchingData = false;
            this.cd.detectChanges();
        })
    }

    private getInstantSessions(): Promise<any> {
        return Promise.resolve();
        /*if (!!this.instantSubscription) {
            this.instantSubscription.unsubscribe();
        }
        const lessonParams: URLSearchParams = new URLSearchParams();
        lessonParams.set('from', this.activeDate.clone().startOf('month').subtract(1, 'w').toISOString());
        lessonParams.set('to', this.activeDate.clone().endOf('month').add(1, 'w').toISOString());
        this.instantSubscription = this.backend.get(`/instant_lesson/list?${lessonParams.toString()}`)
            .pipe(finalize(() => this.loading--))
            .subscribe((response: HttpResponse) => {
                for (const instant of response.json()) {
                    const i = new InstantSession({ ...instant, zone: this.me.timezone.replace(' ', '_') });
                    if (isNaN(i.duration)) {
                        continue;
                    }

                    for (const day of this.calendarDates) {
                        if (day.instants === undefined) {
                            day.instants = [];
                        }

                        if (!day.date.isSame(i.starts_at, 'day')) {
                            continue;
                        }

                        day.instants.push(i);
                    }
                }
            });*/
    }

    private getWeekLessons(date): Promise<any> {

        const selectedDate = moment(date);

        const startOfWeek = selectedDate.clone().startOf('week');

        const endOfWeek = selectedDate.clone().endOf('week').add(1, 'minute');

        const from = startOfWeek.clone().utc();
        const to = endOfWeek.clone().utc();

        this.lessonsMonth = date.month();

        return new Promise((resolve, reject) => {
            this.subscriptions.add(this.backend.getCalendarLessons(from, to).subscribe(
                lessons => {
                    this.lessons = new LessonAggregate(lessons, this.me.timezone);
                    resolve();
                },
                err => reject(err)
            ));
        })

    }

    private getDayLessons(date): Promise<any> {

        const selectedDate = moment(date);

        const startOfDay = selectedDate.clone().startOf('day');

        const endOfDay = selectedDate.clone().endOf('day');

        const from = startOfDay.clone().utc();
        const to = endOfDay.clone().utc();

        return new Promise((resolve, reject) => {
            this.subscriptions.add(this.backend.getCalendarLessons(from, to).subscribe(
                lessons => {
                    this.dayLessons = new LessonAggregate(lessons, this.me.timezone);
                    console.log(this.dayLessons)
                    resolve();
                },
                err => reject(err)
            ));
        })
    }

    private getAvailability(): Promise<any> {
        // get availability if week changed
        if (!this.me.isTutor() || (this.prevDate && this.prevDate.isSame(this.activeDate, 'week'))) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            this.subscriptions.add(this.backend.getUserAvailability(this.me, this.weekStart, this.weekEnd, this.me.timezone).subscribe(
                availability => {
                    this.availability = availability
                    resolve();
                },
                err => reject(err)
            ));
        })
    }

    otherFor(l: Lesson | InstantSession): User {
        let student: User;
        if (l['students'] === undefined) {
            student = l['student'];
        } else if (l['student'] === undefined) {
            student = l['students'][0];
        }
        switch (this.me._id) {
            case l.tutor._id:
                // we're the lesson's tutor, return the student
                return student;
            case student._id:
                // we're the lesson's student, return the tutor
                return l.tutor;
        }
    }

    /**
     * Build the calendar dates.
     */
    private buildCalendarDates(): void {
        this.calendarDates = [];
        for (let i = 0; i < 7; i++) {
            if (i === 0) {
              this.calendarDates.push(this.weekStart.clone());
            } else {
              this.calendarDates.push(this.weekStart.clone().add(i, 'day'));
            }
        }
    }

    /**
     * Build the calendar hours.
     */
    private buildCalendarHours(): void {
        const hours = [];
        for (let i = 0; i <= 23; i++) {
            const hour = !i ? 24 : i;
            const time = moment().set('hour', hour);
            hours.push(time);
        }
        this.calendarHours = hours;
    }

    /**
     * Build the hours array for availability form's autocomplete inputs and add subscriber for changes
     * to get to the filter.
     */
    private buildAvailabilityHours(): void {
        const availabilityHours = [];
        const hours = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
        const minutes = ['00', '30'];
        const periods = ['am', 'pm'];
        for (const period of periods) {
            for (const hour of hours) {
                for (const minute of minutes) {
                    availabilityHours.push(`${hour}:${minute} ${period}`);
                }
            }
        }
        this.availabilityHours = availabilityHours;
        this.availabilityHoursFiltered = { from: this.availabilityHours, to: this.availabilityHours };
        this.availForm.get('from').valueChanges.subscribe(v => this.availabilityHoursFiltered.to = this.filterHours(v, 'from'));
        this.availForm.get('to').valueChanges.subscribe(v => this.availabilityHoursFiltered.from = this.filterHours(v, 'to'));
    }

    /**
     * Filter the availability hours from the current input.
     * @param {string} val
     * @param {string} field
     * @return {string[]}
     */
    private filterHours(val: string, field: string): string[] {
        if (val === null || val === undefined || val === '') {
            return this.availabilityHours;
        }

        switch (field) {
            case 'from':
                return this.availabilityHours.slice(this.availabilityHours.indexOf(val) + 2);
            case 'to':
                const h = [];
                for (let i = 0; i < this.availabilityHours.indexOf(val) - 1; i++) {
                    h.push(this.availabilityHours[i]);
                }
                return h;
        }
    }

    openAvailabilityMenu(event: MouseEvent, availability: Availability, recurrent ?: boolean): void {
        event.preventDefault();
        event.stopPropagation();
        const popoverSettings: PopoverBoxSettings = { width: 275, height: 200 };
        const left: number = event.clientX - popoverSettings.width - 15; // also remove the arrow's width
        const top: number = event.clientY - (popoverSettings.height / 2);

        const config = new OverlayConfig();
        config.positionStrategy = this.overlay.position().global().left(left + 'px').top(top + 'px');
        this.overlayRef = this.overlay.create(config);

        const portal = new ComponentPortal(PopoverBoxComponent);
        const compRef: ComponentRef<PopoverBoxComponent> = this.overlayRef.attach(portal);

        compRef.instance.data = { ...availability, recurrent };
        compRef.instance.direction = 'right';
        compRef.instance.width = popoverSettings.width;
        compRef.instance.height = popoverSettings.height;
        compRef.instance.loading = false;
        this.embeddedTpl = compRef.instance.setTemplate(this.availabilityEditMenu);

        this.subscriptions.add(compRef.instance.onDestroy.subscribe(() => {
            this.embeddedTpl.destroy();
            this.overlayRef.dispose();
        }));
    }

    stopAvailabilityRecurrency(id: string): void {
        this.subscriptions.add(this.backend.setAvailabilityRecurrence(id, false).subscribe(() => {
            this.notifications.notify('Availability updated', 'Availability is not recurrent anymore');
            this.fetchData()
            this.embeddedTpl.destroy();
            this.overlayRef.dispose();
        }, () => {
            this.notifications.notify('Availability not updated', 'Couldn\'t update availability, try again later');
        }));
    }

    deleteAvailability(id: string): void {
        const sub = this.backend.deleteCurrentUserAvailability(id).subscribe(() => {
            this.notifications.notify('Availability deleted', 'Availability was successfully deleted');
            this.availability.remove(id);
            this.embeddedTpl.destroy();
            this.overlayRef.dispose();
            this.fetchData();
        }, () => {
            this.notifications.notify('Availability not deleted', 'Couldn\'t remove availability, try again later');
        });
        this.subscriptions.add(sub);
    }
}
