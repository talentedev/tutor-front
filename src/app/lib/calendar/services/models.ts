

export class Time {

    hour: number;
    minute: number;

    constructor(hours?: number | Date, minutes?: number) {
        if (hours instanceof Date) {
            this.hour = hours.getHours();
            this.minute = hours.getMinutes();
        } else {
            this.hour = hours;
            this.minute = minutes || 0;
        }
    }

    addHours(hours: number): Time {
        return this.addMinutes(hours * 60);
    }

    addMinutes(minutes: number): Time {
        const unixlike = this.minutes + minutes;
        this.hour = Math.floor(unixlike / 60);
        this.minute = Math.floor(unixlike % 60);
        return this;
    }

    setHours(hour: number) {
        this.hour = hour;
    }

    setMinutes(minute: number) {
        this.minute = minute;
    }

    get minutes(): number {
        return this.hour * 60 + this.minute;
    }

    set minutes(value: number) {
        this.hour = Math.floor(value / 60);
        this.minute = value % 60;
    }

    updateDate(date: Date) {
        date.setHours(this.hour, this.minute, 0, 0);
    }

    clone(): Time {
        return new Time(this.hour, this.minute);
    }

    compare(t: Time): number {

        if (this.hour > t.hour) {
            return 1;
        }

        if (this.hour < t.hour) {
            return -1;
        }

        if (this.minute > t.minute) {
            return 1;
        }

        if (this.minute < t.minute) {
            return -1;
        }

        return 0;
    }

    same(time: Time): boolean {
        return this.compare(time) === 0;
    }

    hours(): string {
        const m = this.hour > 12 ? 'pm' : 'am';
        const h = this.hour > 12 ? this.hour - 12 : this.hour;
        return h + m;
    }

    toString() {
        const hour = this.hour < 10 ? '0' + this.hour : this.hour;
        const minutes = this.minute < 10 ? '0' + this.minute : this.minute;
        return hour + ':' + minutes;
    }
}

export class TimeRange {

    static from(date: Date, duration: number): TimeRange {
        const min = new Time(date);
        const max = min.clone();
        max.addMinutes(duration);
        return new TimeRange(min, max);
    }

    constructor (public min: Time, public max: Time) {}

    iterate(): Time[] {
        const a = [];
        for (let i = this.min.hour; i <= this.max.hour; i++) {
            a.push(new Time(i));
        }
        return a;
    }

    canShift(hours: number) {

        if (hours < 0) {
            return this.min.hour >= 8;
        }

        return this.max.hour <= 16;
    }

    shift(hours: number): TimeRange {
        const min = this.min.hour + hours;
        const max = Math.min(this.max.hour + hours, 24);
        return new TimeRange(
            new Time(min),
            new Time(max)
        );
    }

    get duration(): number {
        return (Math.max(0, this.max.hour - this.min.hour) * 60) + (this.max.minute - this.min.minute);
    }

    clone(): TimeRange {
        return new TimeRange(
            this.min.clone(),
            this.max.clone(),
        );
    }

    changeDuration(duration: number) {
        const max = this.min.clone();
        max.addMinutes(duration);
        this.max = max;
    }

    toString() {
        const zf = (n) => n > 9 ? n : '0' + n;
        const hours = zf(Math.floor(this.duration / 60));
        const minutes = zf(this.duration % 60);
        return `${hours}:${minutes} from ${this.min.toString()}`;
    }

    get nice() {
        const hour = Math.floor(this.duration / 60);
        const minute = this.duration % 60;

        if (minute === 0) {
            return hour === 1 ? `${hour} hour` : `${hour} hours`;
        }

        if (hour === 0 && minute < 60) {
            return `${minute}m`;
        }

        return `${hour}h ${minute}m`;
    }

    same(range: TimeRange): boolean {
        return this.min.same(range.min) && this.max.same(range.max);
    }
}

export declare type AvailabilityState = 'available' | 'unavailable';

export class Availability {
    date: Date;
    time: TimeRange;
    state: AvailabilityState;
}

export class Class {

    /**
     * Date of this class
     */
    date: Date;

    /**
     * Time of this class
     */
    time: Time;

    /**
     * Duration in minutes
     */
    duration: number;
}

export class Blackout {
    constructor(
        public id: string,
        public from: Date,
        public to: Date,
        public occurence: number,
    ) {}
}

export class Availability2 {
    constructor(
        public id: string,
        public from: Date,
        public to: Date,
        public occurence: number,
    ) {}
}
