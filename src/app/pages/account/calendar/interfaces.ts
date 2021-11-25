import { MomentRange } from './../../../models/user';
import * as moment from 'moment';

export interface CalendarDate {
    date: moment.Moment;
    text: string;
}

export interface CalendarHour {
    time: moment.Moment;
    text: string;
}

export type TimePeriodAM = 0;
export type TimePeriodPM = 1;

export interface Time {
    hour: number;
    minute: number;
    date: string;
}

export interface TimeEntry {
    hour: number;
    minute: number;
    pm?: TimePeriodAM | TimePeriodPM;
    full: Time;
    t: moment.Moment;
}

export class BookingSlot extends MomentRange {

    // First half of hour from one hour slot
    top(): MomentRange {
        const from = this.from.clone()
        return new MomentRange(
            from,
            from.clone().add(30, "minutes")
        )
    }

    // Last half of hour from one hour slot
    bottom(): MomentRange {
        const to = this.to.clone()
        return new MomentRange(
            to.clone().subtract(30, "minutes"),
            to
        )
    }
}
