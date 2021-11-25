import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    OnDestroy,
    OnInit,
    Input,
    Output,
} from '@angular/core';
import * as moment from 'moment-timezone';
import { User } from '../../../../models';
import { Auth, Backend, TokenLocalStorage } from '../../../../lib/core/auth';
import { Media } from 'app/lib/core/media';
import { format, utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { BehaviorSubject, Subscription } from 'rxjs';
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import {
    addDays,
    addMonths,
    endOfMonth,
    getWeekOfMonth,
    isBefore,
    isSameDay,
    isSameMonth,
    startOfDay,
    startOfMonth,
    startOfWeek,
    subDays, subMonths
} from 'date-fns';
import { take } from 'rxjs/operators';

interface IDate {
    date: Date
    current: boolean // date belongs to current month
    booked?: boolean
    unixTimeStamp: number
}

@Component({
    selector: 'learnt-calendar-left-side',
    templateUrl: './calendar-left-side.component.html',
    styleUrls: ['./calendar-left-side.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarLeftSideComponent implements OnInit, OnDestroy {

    loading: boolean;
    @Output() dateChanged: EventEmitter<moment.Moment> = new EventEmitter<moment.Moment>();
    selectedDate: Date;
    private prevSelectedDate: Date;
    today: Date;
    calendarDates: IDate[];
    calendarDatesMobile: IDate[];
    readonly weekdays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    me: User;
    mobile: boolean;
    private lessons$: BehaviorSubject<Date[]>;
    private subs: Subscription;
    public calendarLink: string;
    textMessage:any;
    msgHideAndShow:boolean=false;
    @Input() events: any;
    constructor(
        private auth: Auth,
        private media: Media,
        private cd: ChangeDetectorRef,
        private backend: Backend,
        private http: HttpClient,
        private token: TokenLocalStorage,
    ) {
        this.subs = new Subscription();
        this.mobile = !media.query('gt-sm');
        this.calendarDatesMobile = [];
        this.calendarDates = [];
        this.lessons$ = new BehaviorSubject<Date[]>([]);
    }

    get lessons(): Date[] {
        return this.lessons$.getValue();
    }

    ngOnInit() {
        this.subs.add(this.media.watch('gt-sm').subscribe(event => {
            this.mobile = !event.active;
            this.cd.detectChanges();
        }));

        this.subs.add(this.auth.me.subscribe(async (user: User) => {
            if (user) {
                this.me = user;
                const today = utcToZonedTime(new Date(), user.timezone);
                this.today = startOfDay(today);
                this.prevSelectedDate = null;
                this.selectedDate = today;
                if (!isSameMonth(this.prevSelectedDate, this.selectedDate)) {
                    await this.getLessons();
                }
                this.buildDays();
            }
        }));

        this.subs.add(this.lessons$.subscribe(() => {
            this.updateBookedState();
        }));
        this.getCalendarLink();
    }

    /**
     * Get the refer links.
     */
    private getCalendarLink(): void {
        this.backend.getCalendarLink().subscribe(res => {
            this.calendarLink = environment.WEBCAL + '/me/calendar-lessons/icsfeed?access_token=' + res.token
        });
    }

    copyMessage(): void {
        var inputElement = document.createElement("textarea");
        document.body.appendChild(inputElement);
        inputElement.value = this.calendarLink
        inputElement.select();
        document.execCommand('copy');
        document.body.removeChild(inputElement);
        inputElement.setSelectionRange(0, 0);
        this.textMessage = "Link copied. Paste into your calendar app!";  
        this.msgHideAndShow = true;  
        setTimeout(() => {  
          this.textMessage="";  
          this.msgHideAndShow=false;  
        }, 1000);  
    }


    ngOnDestroy() {
        this.subs.unsubscribe();
    }

    private updateBookedState() {
        this.calendarDates = this.calendarDates.map((cDate: IDate) => ({
            ...cDate,
            booked: this.lessons.filter((d: Date) => isSameDay(d, cDate.date)).length > 0,
        }));
        this.calendarDatesMobile = this.calendarDatesMobile.map((cDate: IDate) => ({
            ...cDate,
            booked: this.lessons.filter((d: Date) => isSameDay(d, cDate.date)).length > 0,
        }));
        this.cd.detectChanges();
    }

    private getLessons() {
        this.backend.getCalendarLessons2(format(this.selectedDate, 'yyyy-MM')).pipe(take(1)).subscribe(
            (dates: string[] | null) => {
                if (dates) {
                    this.lessons$.next(dates.map(d => utcToZonedTime(new Date(d), this.me.timezone)));
                } else {
                    this.lessons$.next([]);
                }
            }
        );
    }

    async navigate(direction: number): Promise<void> {
        if ([-1, 1].indexOf(direction) === -1) {
            return;
        }
        this.prevSelectedDate = this.selectedDate;
        if (this.mobile) {
            this.selectedDate = addDays(this.selectedDate, direction * 7);
        } else {
            this.selectedDate = direction > 0 ? addMonths(this.selectedDate, 1) : subMonths(this.selectedDate, 1);
            if (isSameMonth(this.today, this.selectedDate)) {
                this.selectedDate = this.today;
            } else {
                this.selectedDate = isBefore(this.selectedDate, this.today) ?
                    endOfMonth(this.selectedDate) : startOfMonth(this.selectedDate);
            }
        }
        if (!isSameMonth(this.selectedDate, this.prevSelectedDate)) {
            await this.getLessons();
        }
        this.buildDays();
        this.dateChanged.next(moment(zonedTimeToUtc(this.selectedDate, this.me.timezone)).tz(this.me.timezone));
    }

    async setDate(calendarDate: IDate): Promise<void> {
        if (this.selectedDate && isSameDay(calendarDate.date, this.selectedDate)) {
            return;
        }
        if (!isSameMonth(this.selectedDate, calendarDate.date)) {
            await this.getLessons();
        }
        this.prevSelectedDate = this.selectedDate;
        this.selectedDate = calendarDate.date;
        this.dateChanged.next(moment(zonedTimeToUtc(this.selectedDate, this.me.timezone)).tz(this.me.timezone));
        this.buildDays();
    }

    private buildDays() {
        const startOfThisMonth = startOfMonth(this.selectedDate);
        const endOfThisMonth = endOfMonth(startOfThisMonth);
        // mobile calendar dates
        let dates: IDate[] = [];
        let date = subDays(this.selectedDate, 4);
        if (!this.calendarDatesMobile.filter((cDate: IDate) => isSameDay(this.selectedDate, cDate.date)).length) {
            for (let i = 0; i < 9; i++) {
                dates.push({
                    date,
                    current: isSameMonth(startOfThisMonth, date),
                    unixTimeStamp: date.getTime(),
                });
                date = addDays(date, 1);
            }
            this.calendarDatesMobile = [...dates]
        }

        if (!isSameMonth(this.selectedDate, this.prevSelectedDate)) {
            dates = [];
            date = startOfWeek(startOfThisMonth);
            for (let i = 1; i <= getWeekOfMonth(endOfThisMonth); i++) {
                for (let j = 1; j <= 7; j++) {
                    dates.push({
                        date,
                        current: isSameMonth(startOfThisMonth, date),
                        unixTimeStamp: date.getTime(),
                    });
                    date = addDays(date, 1);
                }
            }
            this.calendarDates = [...dates];
        }
        this.cd.detectChanges();
    }

    public async download() {
        const token = await this.token.get();
        this.http.get(`${environment.API_HOST}/me/calendar-lessons/ics`, {
            headers: {
                "Authorization": "Bearer " + token,
            },
            responseType: "blob"
        }).subscribe(data => {
            const file = window.URL.createObjectURL(data);
            const a = document.createElement("a");
            a.href = file;
            a.target = "_blank";
            document.body.appendChild(a);
            a.onclick = () => {
                setTimeout(() => a.remove(), 500);
            }
            a.click();
        }, err => {
            console.error(err);
        });
    }

    isSameDateAsSelected(date: Date): boolean {
        return isSameDay(date, this.selectedDate);
    }

    isToday(date: Date): boolean {
        return isSameDay(date, this.today);
    }

    trackByUnixTime(index: number, item: IDate): number {
        return item.unixTimeStamp;
    }
}
