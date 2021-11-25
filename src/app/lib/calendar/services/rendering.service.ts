import {CalendarDayComponent} from '../components/day/day.component';
import {Availability, Time, TimeRange} from './models';
import {Injectable, QueryList} from '@angular/core';
import * as moment from 'moment';

export interface SlotState {
    left: any;
    width: any;
}

export interface SlotInterval {
    start: Time;
    end: Time;
}

const MIDDLE_TIME_RANGE = new TimeRange(
    new Time(9),
    new Time(16)
);

@Injectable()
export class RenderingService {

    /**
     * Current month
     */
    date: moment.Moment;

    /**
     * Current week number
     */
    week = 0;

    /**
     * Timeline with
     */
    width: number;

    /**
     * Hour with in timeline
     */
    hour: number;

    /**
     * 15 mintues width
     */
    step: number;

    /**
     * Current timeline range
     */
    range: TimeRange;

    minSlotRange;

    /**
     * Day views
     */
    dayviews: QueryList<CalendarDayComponent>;

    setCalendarWidth(width: number) {
        this.width = width;
        this.hour = width / 8;
        this.step = width / 8 / 4;
        this.minSlotRange = this.hour / 2;
    }

    setTimeRange(range: TimeRange) {
        this.range = range;
    }

    getSlotDragPosition(side: string, move: MouseEvent, start: MouseEvent, state: SlotState): SlotState {

        const newstate: SlotState = <SlotState> {};
        const diff = move.clientX - start.clientX;

        if (side === 'left') {

            if (state[side] + diff < 0) {
                return {left: 0, width: state.width};
            }

            newstate[side] = state[side] + diff;
            newstate[side] = newstate[side] - (newstate[side] % this.step);

            newstate.width = state.width - diff;
            newstate.width = newstate.width - (newstate.width % this.step);
            newstate.width += this.step;
        } else if (side === 'width') {
            if (state.left + state.width + diff > this.width) {
                return {left: state.left, width: this.width - state.left};
            }
            newstate.width = state.width + diff;
            newstate.width = newstate.width - (newstate.width % this.step);
        }
        return newstate;
    }

    isSlotAtEnd(state: SlotState): boolean {
        return this.width === state.left + state.width;
    }

    getSlotRangeFromState(state: SlotState): TimeRange {
        const min = this.range.min.clone();
        min.setMinutes(Math.ceil(state.left / this.hour * 60));
        const max = min.clone();
        max.setMinutes(Math.ceil(state.width / this.hour * 60));
        return new TimeRange(min, max);
    }

    hasPrevHours() {
        return this.range.canShift(-8);
    }

    hasNextHours() {
        return this.range.canShift(8);
    }

    prevHours() {
        this.range = this.range.shift(-8);
    }

    nextHours() {
        this.range = this.range.shift(8);
    }

    hasPrevWeek() {
        return this.week > 0;
    }

    hasNextWeek() {
        const max = this.date.daysInMonth() > 28 ? 5 : 4;
        return this.week < max - 1;
    }

    prevWeek() {
        this.week--;
        this.render();
    }

    nextWeek() {
        this.week++;
        this.render();
    }

    prevMonth() {
        this.date = this.date.add(-1, 'month');
        this.range = MIDDLE_TIME_RANGE;
        this.week = 0;
        this.render();
    }

    nextMonth() {
        this.date = this.date.add(1, 'month');
        this.range = MIDDLE_TIME_RANGE;
        this.week = 0;
        this.render();
    }

    getMonthNavigationLabel() {
        if (this.date.year() === moment().year()) {
            return this.date.format('MMMM');
        }

        return this.date.format('MMMM YYYY');
    }

    setDate(date: Date) {
        this.date = moment(date);
    }

    setAvailability(availability: Availability[]) {

    }

    setDayViews(days: QueryList<CalendarDayComponent>) {
        this.dayviews = days;
    }

    render() {

        const mdays = this.date.daysInMonth();
        this.dayviews.forEach((day, i) => {
            const n = (this.week * 7) + (i + 1);
            if (mdays >= n) {
                day.setDay(n);
            } else {
                day.setDay(n - mdays, true);
            }
        });
    }
}
