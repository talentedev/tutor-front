import {Lesson} from '../../models/lesson';
import {ControlValueAccessor} from '@angular/forms';
import {NG_VALUE_ACCESSOR} from '@angular/forms';
import {Time, TimeRange} from '../../lib/calendar/services/models';
import {
    Component,
    OnChanges,
    ElementRef,
    HostListener,
    Input,
    OnInit,
    ChangeDetectorRef,
    forwardRef,
    Output,
    EventEmitter
} from '@angular/core';
import * as moment from 'moment';
import {isNullOrUndefined, isUndefined} from 'util';
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'learnt-time-interval',
    templateUrl: './time-interval.component.html',
    styleUrls: ['./time-interval.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TimeIntervalComponent), multi: true}
    ]
})
export class TimeIntervalComponent implements OnInit, OnChanges, ControlValueAccessor {

    @Input()
    interval = [0, 8];

    @Input()
    step = 30;

    @Input()
    lessons: Lesson[];

    @Input()
    buffer = 15;

    @Input()
    date: moment.Moment;

    @Input()
    max = 60 * 8;

    @Input()
    min = 30;

    @Input()
    fromRange = [8, 0];

    @Input()
    toRange = [11, 30];

    @Output()
    public readonly change: EventEmitter<TimeRange> = new EventEmitter<TimeRange>();

    range: TimeRange;

    activeHours: any;

    currentDragEvent: UIEvent;
    currentDragRange: TimeRange;
    currentDragSide: 'left' | 'right' | 's'; // what is 's'?
    scrollCounter = 0;

    handlerLeftVisible = true;
    handlerRightVisible = true;

    onChangeFn: Function;
    onTouchedFn: Function;

    constructor(private eref: ElementRef,
                private cdRef: ChangeDetectorRef) {

        this.onChangeFn = this.onTouchedFn = () => {
        };

        this.onMove = this.onMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);
    }

    ngOnInit(): void {
        this.activeHours = this.hours();

        if (isNullOrUndefined(this.fromRange) || this.fromRange.length !== 2) {
            this.fromRange = [8, 0];
        }

        if (isNullOrUndefined(this.toRange) || this.toRange.length !== 2) {
            this.toRange = [11, 30];
        }

        this.range = new TimeRange(
            new Time(this.fromRange[0], this.fromRange[1]),
            new Time(this.toRange[0], this.toRange[1])
        );
    }

    ngOnChanges(changes: any): void {
        if (this.lessons && this.date) {
            this.cdRef.detectChanges();
        }

        if (changes.interval) {
            this.activeHours = this.hours();
        }
    }

    private hours(): number[] {
        const out = [];
        for (let i = this.interval[0]; i < this.interval[1]; i++) {
            out.push(i + 1);
        }
        return out;
    }

    private getHourWidth(time?: Time): number {
        if (!isUndefined(time)) {
            const w = this.getHourWidth();
            return (time.hour * w) + (time.minute / 60) * w;
        }

        const e: HTMLElement = this.eref.nativeElement;
        const qry = e.querySelector('.dragging-zone .hour');
        return qry.getBoundingClientRect().width;
    }

    private updateRange(): void {
        if (this.interval[0] >= this.range.min.hour) {
            const min = new Time(this.interval[0] + 1, 0);
            const max = min.clone().addMinutes(this.range.duration);
            this.range = new TimeRange(min, max);
            this.change.next(this.range);
        }

        if (this.interval[1] < this.range.max.hour) {
            const max = new Time(this.interval[1] + 1, 0);
            const min = max.clone().addMinutes(-this.range.duration);
            this.range = new TimeRange(min, max);
            this.change.next(this.range);
        }

        if (this.range.duration > this.max) {
            this.range.changeDuration(this.max);
            this.change.next(this.range);
        }

        this.cdRef.detectChanges();
    }

    public nav(dir: number): void {
        if (dir > 0) {
            if (this.interval[1] < 24) {
                this.interval[0] += dir;
                this.interval[1] += dir;
            }
        } else {
            if (this.interval[0] > 0) {
                this.interval[0] += dir;
                this.interval[1] += dir;
            }
        }

        this.activeHours = this.hours();
        this.updateRange();
    }

    @HostListener('touchstart', ['$event'])
    public onTouchStart(event: any): void {
        this.onStart(event);
    }

    public onTouchEnd(event: any): void {
        document.removeEventListener('touchmove', this.onMove);
        document.removeEventListener('touchend', this.onTouchEnd);
    }

    @HostListener('DOMMouseScroll', ['$event'])
    @HostListener('mousewheel', ['$event'])
    public onWheel(event): void {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();

        if (this.interval[1] - this.interval[0] === 24) {
            return;
        }

        // cross-browser wheel delta
        const e = window.event || event; // old IE support
        const delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));

        if (!this.scrollCounter) {
            this.nav(delta);
        }

        this.scrollCounter++;

        if (this.scrollCounter > 6) {
            this.scrollCounter = 0;
        }
    }

    @HostListener('mousedown', ['$event'])
    public onMouseDown(event: MouseEvent): void {
        this.onStart(event);
    }

    public onMouseUp(event: MouseEvent): void {
        document.removeEventListener('mousemove', this.onMove);
        document.removeEventListener('mouseup', this.onMouseUp);
    }

    public onStart(event: UIEvent) {
        if (event.target['nodeName'] !== 'DIV') {
            return;
        }

        const c = event.target['className'];

        if (!c || c === '') {
            return;
        }

        if (c.indexOf('handler') === -1) {
            return;
        }

        this.currentDragEvent = event;
        this.currentDragRange = this.range.clone();
        this.currentDragSide = c.replace('handler', '').trim();

        if (event instanceof MouseEvent) {
            document.addEventListener('mousemove', this.onMove);
            document.addEventListener('mouseup', this.onMouseUp);
        } else if (window['TouchEvent'] && event instanceof TouchEvent) {
            document.addEventListener('touchmove', this.onMove);
            document.addEventListener('touchend', this.onTouchEnd);
        }
    }

    public onMove(event: UIEvent): void {
        const diff = this.getClientX(event) - this.getClientX(this.currentDragEvent);
        const duration = Math.ceil(diff / this.getHourWidth() * 60);
        const range = this.currentDragRange.clone();
        const rounded = duration - (duration % this.step);
        const actual = range.duration;

        if (this.currentDragSide === 's') {
            range.min.minutes += rounded;
            range.max.minutes += rounded;

            if (range.min.hour < 0) {
                range.min = new Time(0, 0);
                range.max = new Time();
                range.max.minutes += actual;
            }

            if (range.min.hour > 23 || (range.min.hour === 23 && range.min.minute === 30)) {
                range.min = new Time(23, 30);
            }

            if (range.max.hour > 24 || (range.max.hour === 24 && range.max.minute === 30)) {
                range.max = new Time(24, 0);
            }

            if (this.range.same(range)) {
                return;
            }

            this.range = range;

            this.change.next(this.range);
            this.updateHandlersVisibility();
            this.cdRef.detectChanges();
            this.onChangeFn(range);

            return;
        }

        const time = this.currentDragSide.startsWith('left') ? range.min : range.max;

        time.addMinutes(rounded);

        if (this.currentDragSide.startsWith('left')) {
            if (range.duration <= this.min) {
                range.min = range.max.clone();
                range.min.addMinutes(-this.step);
            }
            if (range.min.hour < this.interval[0]) {
                range.min = new Time(0, 0);
            }

            if (range.duration > this.max) {
                return;
            }
        }

        if (this.currentDragSide.startsWith('right')) {
            if (range.duration < this.min) {
                range.max = range.min.clone();
                range.max.addMinutes(this.step);
            }
            const left = this.getHourWidth(range.min);
            const width = this.getHourWidth() * (range.duration / 60);
            if (left + width > this.interval[1] * this.getHourWidth()) {
                range.max = new Time(this.interval[1] + 1);
            }

            if (range.max.hour < this.interval[0]) {
                range.max = new Time(this.interval[0]);
            }

            if (range.max.hour > 24 || (range.max.hour === 24 && range.max.minute === 30)) {
                range.max = new Time(24, 0);
            }
        }

        if (range.duration > this.max) {
            range.changeDuration(this.max);
        }

        if (this.range.same(range)) {
            return;
        }

        this.range = range;

        this.change.next(this.range);
        this.updateHandlersVisibility();
        this.cdRef.detectChanges();
        this.onChangeFn(range);
    }

    private getClientX(event: UIEvent): number {
        if (event instanceof MouseEvent) {
            return event.clientX;
        } else if (window['TouchEvent'] && event instanceof TouchEvent) {
            return event.touches[0].clientX;
        }
        return 0;
    }

    private updateHandlersVisibility(): void {
        this.handlerLeftVisible = this.range.min.hour * 60 + this.range.min.minute >= (this.interval[0] + 1) * 60;
        this.handlerRightVisible = this.range.max.hour * 60 + this.range.max.minute <= (this.interval[1] + 1) * 60;
    }

    writeValue(range: TimeRange): void {
        if (!range) {
            return;
        }

        const n = range.min.hour + Math.floor((range.max.hour - range.min.hour) / 2);
        let interval = [n - 4, n + 4];
        if (interval[0] < 0) {
            interval = [0, 8];
        }

        this.interval = interval;
        this.range = range;

        this.activeHours = this.hours();

        this.cdRef.detectChanges();
    }

    registerOnChange(fn: any): void {
        this.onChangeFn = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouchedFn = fn;
    }

    setDisabledState?(isDisabled: boolean): void {
    }

    public isUnavailable(range: TimeRange): boolean {
        if (!this.lessons || !this.date) {
            return false;
        }

        if (this.date && moment(this.date).hour(range.min.hour - 1).isSameOrBefore(moment())) {
            return true;
        }

        const from = moment(this.date).hour(range.min.hour).minute(range.min.minute).second(0);
        const to = moment(this.date).hour(range.max.hour).minute(range.max.minute).second(0);

        for (let i = 0; i < this.lessons.length; i++) {
            const lesson = this.lessons[i];

            // Add buffer before & after of this.buffer minutes
            const when = lesson.starts_at.clone().add(-this.buffer, 'minutes');
            const ends = lesson.ends_at.clone().add(this.buffer, 'minutes');

            if (!lesson.starts_at.isSame(this.date, 'day')) {
                continue;
            }

            if (from.isSame(when, 'minute') && to.isSame(ends, 'minute')) {
                return true;
            }

            if (from.isBefore(when, 'minute') && to.isAfter(ends, 'minute')) {
                return true;
            }

            if (from.isBetween(when, ends, 'minutes') ||
                to.isBetween(when, ends, 'minutes')) {
                return true;
            }
        }

        return false;
    }

    public isUnavailableHour(hour: number, minutes: number): boolean {
        if (!this.lessons || !this.date) {
            return false;
        }

        for (let i = 0; i < this.lessons.length; i++) {
            const lesson = this.lessons[i];
            if (lesson.starts_at.isSame(this.date, 'day')) {
                const start = lesson.starts_at.hours() * 60 + lesson.starts_at.minutes();
                let end = lesson.ends_at.hours() * 60 + lesson.ends_at.minutes();
                if (lesson.ends_at.isSame(this.date.clone().add(1, 'day'), 'day')) {
                    end = start + lesson.duration;
                }
                if (hour * 60 + minutes > start && hour * 60 + minutes <= end) {
                    return true;
                }
            }
        }

        return false;
    }

    public get style(): { width: string, marginLeft: string } {
        if (!this.range) {
            return;
        }

        const hourWidth = this.getHourWidth();

        const width = hourWidth * (this.range.duration / 60);

        const diff = (((this.range.min.hour - this.interval[0] - 1) * 60) + this.range.min.minute) / 60;

        const left = diff * hourWidth;

        return {
            width: width + 'px',
            marginLeft: left + 'px',
        };
    }
}
