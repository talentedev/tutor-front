import * as moment from 'moment-timezone';
import { Hydratable, HydrateProperty } from '../lib/core/hydratable';
import { Subject } from './';
import { User } from './user';

// TODO: Is this required?
export enum LessonNotificationType {
    LessonBooked = 1,
    LessonAccepted,
    LessonTutorCancelled,
    LessonStudentCancelled,
    LessonNotify24hBefore,
    LessonNotify30mBefore,
    LessonChangeRequest,
    LessonStarted,
    LessonSystemCancelled,
    InstantLessonRequest,
    InstantLessonAccept,
    InstantLessonReject,
    InstantLessonCancel,
    LessonChangeRequestAccepted,
    LessonChangeRequestDeclined,
    LessonCompleteReview,
    LessonNotifyBefore,
}

enum State {
    Booked = 0,
    Confirmed,
    Progress,
    Completed,
    Cancelled,
}

enum LocationType {
    Online = 2,
    Offline = 4,
}

enum LessonTypes {
    LessonDefault,
    LessonRecurrent,
    LessonInstant
}

interface LessonType {
    type(): 'lesson' | 'instant';
}

export class LessonNote extends Hydratable {
    @HydrateProperty()
    id: string;

    @HydrateProperty()
    note: string;

    @HydrateProperty()
    lesson: string;

    @HydrateProperty()
    lesson_type: number;

    @HydrateProperty()
    user: string;

    @HydrateProperty('moment')
    created_at: moment.Moment;

    constructor(raw?: any) {
        super();
        if (raw) {
            this.hydrate(raw);
        }
    }
}

export class LessonChangeProposal extends Hydratable {
    @HydrateProperty(User)
    user: User;

    @HydrateProperty(Subject)
    subject: Subject;

    @HydrateProperty()
    meet: number;

    @HydrateProperty()
    location: string;

    @HydrateProperty('moment')
    starts_at: moment.Moment;

    @HydrateProperty('moment')
    ends_at: moment.Moment;

    @HydrateProperty('moment')
    created_at: moment.Moment;

    constructor(raw?: any) {
        super();
        if (raw) {
            this.hydrate(raw);
        }
    }
}

export class LessonCharge extends Hydratable {
    @HydrateProperty()
    tutor_pay: number;

    @HydrateProperty()
    tutor_rate: number;

    @HydrateProperty()
    platform_fee: number;

    @HydrateProperty()
    student_cost: number;

    @HydrateProperty()
    charge_id: string;
}

export class Lesson extends Hydratable implements LessonType {
    public static State = State;
    public static Location = LocationType;

    @HydrateProperty()
    _id: string;

    @HydrateProperty(Subject)
    subject: Subject;

    @HydrateProperty(User)
    tutor: User;

    @HydrateProperty(User, true)
    students: User[];

    @HydrateProperty()
    rate: number;

    @HydrateProperty()
    state: number;

    @HydrateProperty(User, true)
    accepted: User[];

    @HydrateProperty()
    room: string | null;

    @HydrateProperty()
    meet: number;

    @HydrateProperty()
    location: string;

    @HydrateProperty('moment')
    starts_at: moment.Moment;

    @HydrateProperty('moment')
    ends_at: moment.Moment;

    @HydrateProperty()
    auto_billable: string;

    @HydrateProperty('moment')
    created_at: moment.Moment;

    @HydrateProperty()
    recurrent: boolean;

    @HydrateProperty(LessonChangeProposal, true)
    change_proposals: LessonChangeProposal[];

    @HydrateProperty()
    lesson_type: number;

    @HydrateProperty(User)
    student: User;

    @HydrateProperty(LessonCharge)
    charge: LessonCharge;

    public static StateString(s: number): string {
        switch (s) {
            case State.Booked:
                return 'booked';
            case State.Confirmed:
                return 'confirmed';
            case State.Progress:
                return 'progress';
            case State.Completed:
                return 'completed';
            case State.Cancelled:
                return 'cancelled';
        }
    }

    public get lessonType(): string {
        switch (this.lesson_type) {
            case LessonTypes.LessonDefault:
                return 'default';
            case LessonTypes.LessonRecurrent:
                return 'recurrent';
            case LessonTypes.LessonInstant:
                return 'instant';
            default:
                return '';
        }
    }

    public type(): 'lesson' {
        return 'lesson';
    }

    constructor(raw?: any) {
        super();
        if (raw) {
            this.hydrate(raw);
        }
    }

    get duration(): number {
        return this.ends_at.diff(this.starts_at, 'minute');
    }

    public get State(): string {
        return Lesson.StateString(this.state);
    }

    public get Offline(): boolean {
        return this.meet === Lesson.Location.Offline;
    }

    public get Online(): boolean {
        return this.meet === Lesson.Location.Online;
    }

    public get EveryoneAccepted(): boolean {
        return this.students.length + 1 === this.accepted.length;
    }
}

export class InstantSession extends Hydratable implements LessonType {
    @HydrateProperty()
    id: string;

    @HydrateProperty('moment')
    created_at: moment.Moment;

    @HydrateProperty('moment')
    starts_at: moment.Moment;

    @HydrateProperty('moment')
    ended_at: moment.Moment;

    @HydrateProperty(User)
    tutor: User;

    @HydrateProperty(User)
    student: User;

    @HydrateProperty()
    status: number;

    @HydrateProperty()
    end_reason: number;

    @HydrateProperty()
    room: string | null;

    public type(): 'instant' {
        return 'instant';
    }

    constructor(raw?: any) {
        super();
        if (raw) {
            this.hydrate(raw);
        }
    }

    get duration(): number {
        return this.ended_at.diff(this.starts_at, 'minute');
    }
}

export class LessonAggregate {

    private lessons: Lesson[] = [];

    get length(): number {
        return this.lessons.length
    }

    private index = 0

    constructor(lessons: Lesson[], timezone: string) {

        if (lessons && lessons.length && !(lessons[0] instanceof Lesson)) {
            this.lessons = lessons.map(raw => new Lesson(raw))
        } else {
            this.lessons = lessons;
        }

        this.setTimezone(timezone);
    }

    setTimezone(tz: string) {
        this.lessons.forEach((lesson: Lesson) => {
            lesson.starts_at.tz(tz)
            lesson.ends_at.tz(tz)
        })
    }

    forDate(date: moment.Moment): Lesson[] {
        const from = date.clone().startOf('day');
        const to = date.clone().endOf('day');
        return this.forRange(from, to);
    }

    isBetween(from: moment.Moment, to: moment.Moment, left: moment.Moment, right: moment.Moment): boolean {
        if (from.isBetween(left, right, 'minutes', '[)') && to.isBetween(left, right, 'minutes', '(]')) {
            return true;
        }
        return false;
    }

    forRange(from: moment.Moment, to: moment.Moment): Lesson[] {
        const out: Lesson[] = []
        for (let i = 0; i < this.lessons.length; i++) {
            const less = this.lessons[i];
            if (this.isBetween(less.starts_at, less.ends_at, from, to)) {
                out.push(this.lessons[i]);
            }
        }
        out.sort((lessonA, lessonB) => {
            if (lessonA.starts_at.isBefore(lessonB.starts_at, 'minutes')) {
                return -1;
            } else if (lessonA.starts_at.isAfter(lessonB.starts_at, 'minutes')) {
                return 1;
            }
            return 0;
        });
        return out;
    }

    firstDayHavingLesson(ref: moment.Moment): moment.Moment {
        let date: moment.Moment
        const lessons = this.forDate(ref)
        for (let i = 0; i < lessons.length; i++) {
            if (!moment || lessons[i].starts_at.isBefore(date)) {
                date = lessons[i].starts_at.clone()
            }
        }
        return date ? date : ref
    }

    [Symbol.iterator]() {

        const lessons = this.lessons;

        const iterator = {
            index: 0,
            next() {
                if (this.index < lessons.length) {
                    const out = { value: lessons[this.index], done: false };
                    this.index++
                    return out;
                }
                return { value: null, done: true };
            }
        };

        return iterator;
    }

    get items(): Lesson[] {
        return this.lessons
    }
}
