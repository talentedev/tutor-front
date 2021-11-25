import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AccountService} from '../../services/account';
import {Auth} from '../../lib/core/auth';
import {User} from '../../models';
import * as moment from 'moment';
import {isNull, isNullOrUndefined, isUndefined} from 'util';
import {Time, TimeRange} from '../../lib/calendar/services/models';

@Component({
    selector: 'learnt-specific-availability',
    templateUrl: './specific-availability.component.html',
    styleUrls: [
        './specific-availability.component.scss',
        './specific-availability.component.mobile.scss'
    ]
})
export class SpecificAvailabilityComponent implements OnInit {
    public timezone: string;

    @Input()
    public date: moment.Moment;

    public timeRange: TimeRange;

    @Input()
    public fromRange: number[] = [13, 0];

    @Input()
    public toRange: number[] = [17, 0];

    @Input()
    public intervalRange: number[] = [8, 20];

    @Input()
    public onlyFuture = true;

    private user: User;

    private firstRun = true;
    private timeChangedTimer: any;

    @Output()
    public readonly change: EventEmitter<string> = new EventEmitter<string>();

    public selectorDates: moment.Moment[];
    private selectorDate: moment.Moment;

    /**
     * Fill the local data from a string.
     * Format: year-month-day_from:time_to:time
     * @param {string} d
     */
    public static fromString(d: string): { date: moment.Moment, time: TimeRange } | null {
        if (isNullOrUndefined(d) || d === '') {
            return null;
        }

        const split = d.split('_');
        if (split.length !== 3) {
            return null;
        }

        const fromTime = split[1].split(':').map(t => parseInt(t, 10));
        const toTime = split[2].split(':').map(t => parseInt(t, 10));

        if (fromTime.length !== 2 || toTime.length !== 2) {
            return null;
        }

        // invalid hour
        if (fromTime[0] < 0 || fromTime[0] > 24 || toTime[0] < 0 || toTime[0] > 25) {
            return null;
        }

        // invalid minute, fallback to 0 mins
        if ([0, 30].indexOf(fromTime[1]) === -1) {
            fromTime[1] = 0;
        }

        if ([0, 30].indexOf(toTime[1]) === -1) {
            toTime[1] = 0;
        }

        return {
            date: moment(split[0]),
            time: new TimeRange(
                new Time(fromTime[0], fromTime[1]),
                new Time(toTime[0], toTime[1])
            )
        };
    }

    @Input()
    public set value(v: string) {
        const parsedValue = SpecificAvailabilityComponent.fromString(v);
        let date, time;
        if (parsedValue !== null) {
            date = parsedValue.date;
            time = parsedValue.time;
        }
        this.date = moment(date);
        this.timeRange = time;

        if (!isNullOrUndefined(v) && this.firstRun) {
            this.fromRange = this.getFromRange();
            this.toRange = this.getToRange();
            this.intervalRange = this.getInterval();
        }

        this.firstRun = false;
    }

    constructor(private account: AccountService,
                private auth: Auth) {
        this.auth.me.subscribe((u: User) => {
            if (isNull(u)) {
                return;
            }
            this.user = u;
            this.timezone = u.timezone;
        });
    }

    ngOnInit(): void {
        this.setTimeAndDate();
    }

    /**
     * Set the time range and date if not previously set.
     * @return {any}
     */
    private setTimeAndDate(): { date: moment.Moment, time: TimeRange } {
        if (isUndefined(this.date)) {
            this.date = moment().add(1, 'day');
        }

        if (isUndefined(this.timeRange)) {
            this.timeRange = new TimeRange(new Time(15, 0), new Time(19, 0));
        }

        this.selectorDate = this.date.clone();
        this.navigateWeek(0);
        return {date: this.date, time: this.timeRange};
    }

    public navigateWeek(n: number): void {
        if ([-1, 0, 1].indexOf(n) < 0) {
            return;
        }

        this.selectorDates = [];

        if (n < 0) {
            this.selectorDate.subtract(9, 'day');
        } else if (n > 0) {
            this.selectorDate.add(9, 'day');
        }

        const day = this.selectorDate.clone().subtract(3, 'day');
        for (let i = 0; i < 9; i++) {
            this.selectorDates.push(day.clone());
            day.add(1, 'day');
        }
    }

    public isCurrentDay(m: moment.Moment): boolean {
        return m.isSame(this.date, 'day');
    }

    public isDisabled(m: moment.Moment): boolean {
        if (!this.onlyFuture) {
            return false;
        }
        return m.isSameOrBefore(moment(), 'day');
    }

    /**
     * Return date & time range as a string.
     * Format: year-month-day_from:time_to:time
     * @return {string}
     */
    private toString(): string {
        return `${this.date.format('YYYY-MM-DD')}_${this.timeRange.min.toString()}_${this.timeRange.max.toString()}`;
    }

    /**
     * Return the time interval min range.
     * @return {number[]}
     */
    private getFromRange(): number[] {
        const min = this.timeRange.min.clone();
        return [min.hour, min.minute];
    }

    /**
     * Return the time interval max range.
     * @return {number[]}
     */
    private getToRange(): number[] {
        const max = this.timeRange.max.clone();
        return [max.hour, max.minute];
    }

    /**
     * Return the time range interval.
     * @return {number[]}
     */
    private getInterval(): number[] {
        // try to center the time range, otherwise it gets moved while scrolling
        const min = this.timeRange.min.clone();
        let fromHour = Math.ceil(min.hour - (12 - min.hour) / 2);
        if (fromHour === 12) {
            fromHour = 10;
        }
        if (fromHour + 12 > 24) {
            fromHour = 12;
        }
        if (fromHour < 0) {
            fromHour = 0;
        }
        return [fromHour, fromHour + 12];
    }

    /**
     * Handler for time changed event, raised by time interval component.
     * @param {TimeRange} t
     */
    public timeChanged(t: TimeRange): void {
        clearInterval(this.timeChangedTimer);
        this.timeChangedTimer = setTimeout(() => {
            this.timeRange = t;
            this.change.next(this.toString());
        }, 1000);
    }

    public setDate(date: moment.Moment): void {
        if (this.isDisabled(date)) {
            return;
        }
        this.date = date.clone();
        this.change.next(this.toString());
    }

    /**
     * Change the timezone.
     * @param {MouseEvent} event
     */
    changeTimezone(event: MouseEvent) {
        event.stopPropagation();
        event.preventDefault();
        this.account.changeTimezone().subscribe(timezone => this.timezone = timezone.zone);
    }

}
