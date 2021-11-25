import { UserPresenceObject, Presence, UserPresence } from './../lib/core/userpresence';
import {Upload} from './upload';
import {Hydratable, HydrateProperty} from '../lib/core/hydratable';
import {Subject} from './subject';
import * as moment from 'moment-timezone';
import {Capitalize} from '../lib/helpers/functions';
import {Lesson} from "./lesson";
import { stateCodeToName } from "../lib/helpers/states";
import _get from 'lodash-es/get';
import { DataMouseEvent } from "@agm/core";

export const MEET_ONLINE = 2;
export const MEET_IN_PERSON = 4;

type Occurence = number
export const OCCURENCE_NONE: Occurence = 0;
export const OCCURENCE_WEEKLY: Occurence = 1;

export enum ApprovalStatus {
    _,
    ApprovalStatusNew,
    ApprovalStatusApproved,
    ApprovalStatusRejected,
    ApprovalStatusBackgroundCheckRequested,
    ApprovalStatusBackgroundCheckCompleted,
}

export class UserEmail extends Hydratable {

    @HydrateProperty()
    email: string;

    @HydrateProperty('moment')
    created: moment.Moment;

    @HydrateProperty('boolean')
    verified: boolean;
}

export class University extends Hydratable {

    @HydrateProperty()
    _id: string;

    @HydrateProperty()
    name: string;

    @HydrateProperty()
    country: string;

    @HydrateProperty('country_code')
    countryCode: string;
}

export class TutoringSubject extends Hydratable {

    @HydrateProperty()
    _id: string;

    @HydrateProperty(Subject)
    subject: Subject;

    @HydrateProperty(Upload)
    certificate: Upload;

    @HydrateProperty('boolean')
    verified: boolean;
}

export class TutoringDegree extends Hydratable {

    @HydrateProperty()
    _id: string;

    @HydrateProperty()
    course: string;

    @HydrateProperty()
    degree: string;

    @HydrateProperty()
    university: string;

    @HydrateProperty(Upload)
    certificate: Upload;

    @HydrateProperty('boolean')
    verified: boolean;
}

export class MomentRange {

    constructor(
        public from: moment.Moment,
        public  to: moment.Moment
    ) {}

    setTimezone(tz: string) {
        this.from = moment.tz(tz).startOf('day').set('hour', this.from.hour()).set('minute', this.from.minute());
        this.to = moment.tz(tz).startOf('day').set('hour', this.to.hour()).set('minute', this.to.minute());
    }
}

export class AvailabilitySlot extends Hydratable {

    @HydrateProperty()
    id: string;

    @HydrateProperty('moment')
    from: moment.Moment;

    @HydrateProperty('moment')
    to: moment.Moment;

    @HydrateProperty()
    occurence: Occurence;

    constructor(raw?: any) {
        super();
        if (raw) {
            this.hydrate(raw);
        }
    }

    /**
     * Get shifted AvailabilitySlot if weekday matches BookedSlot's weekday
     */
    at(slot: MomentRange) {

        let shift = {}

        if (this.from.weekday() === slot.from.weekday()) {
            shift = {
                'year': slot.from.get('year'),
                'month': slot.from.get('month'),
                'date': slot.from.get('date'),
            };
        }

        return new AvailabilitySlot({
            id: this.id,
            from: this.from.set(shift),
            to: this.to.set(shift),
        })
    }

    canBook(slot: MomentRange): boolean {
        return slot.from.isSameOrAfter(this.from, 'minute') &&
               slot.to.isSameOrBefore(this.to, 'minute')
    }

    toString() {
        return this.from.format('MMM Do H:mm') + '-' + this.to.format('MMM Do H:mm');
    }
}

export class Availability extends Hydratable {

    @HydrateProperty(AvailabilitySlot, true)
    slots: AvailabilitySlot[] = [];

    timezone: string;

    constructor(slots: any[], timezone?: string) {
        super();
        this.slots = slots.map(raw => new AvailabilitySlot(raw));
        if (timezone) {
            this.timezone = timezone;
            this.setTimezone(timezone)
        }
    }

    setTimezone(tz: string) {
        const settz = (s: AvailabilitySlot) => {
            s.from.tz(tz); s.to.tz(tz);
        };
        this.slots.map(settz)
    }

    remove(id: string): boolean {
        for (let index = 0; index < this.slots.length; index++) {
            const av = this.slots[index];
            if (av.id === id) {
                this.slots.splice(index, 1)
                return true
            }
        }
    }

    /**
     * Verify if tutor is available at specific
     * moment with certain amount of duration in minutes
     */
    public canBook(booking: MomentRange, bookedLessons: Lesson[]): boolean {
        if (booking.from.isBefore(moment.tz(this.timezone).add(1, 'hour'))) {
            return false;
        }

        // find lesson that overlaps this book slot
        const overlap = bookedLessons.find(lesson => booking.from.isSameOrAfter(lesson.starts_at) &&
            booking.to.isSameOrBefore(lesson.ends_at));
        if (overlap) return false;

        return !!this.slots.find(s => s.canBook(booking));
    }

    /**
     * Get slots for date
     */
    public forDate(date: moment.Moment): AvailabilitySlot[] {

        const availability: AvailabilitySlot[] = [];

        for (const slot of this.slots) {
            if (slot.from.isSame(date, 'day') || slot.to.isSame(date, 'day')) {
                availability.push(slot)
            }
        }

        return availability
    }

    /**
     * Get recurrent or not slot only
     */
    public forDateSpecific(date: moment.Moment, recurrent?: boolean): AvailabilitySlot[] {
        const availability: AvailabilitySlot[] = [];
        for (const slot of this.slots) {

            const startDay = date.clone().startOf('day')
            const endofDay = date.clone().endOf('day')

            if (!slot.from.isBetween(startDay, endofDay, 'minutes', '[)') && !slot.to.isBetween(startDay, endofDay, 'minutes', '(]')) {
                continue
            }

            if (recurrent === Boolean(slot.occurence)) {
                availability.push(slot)
            }
        }
        return availability
    }

    public forWeek(ref: moment.Moment): AvailabilitySlot[] {
        const result: AvailabilitySlot[] = [];
        const startOfWeek = ref.clone().startOf('week')
        const endOfWeek = ref.clone().endOf('week')
        const slots = [...this.slots];

        for (const slot of slots) {
            if (slot.from.isAfter(startOfWeek) && slot.to.isBefore(endOfWeek)) {
                result.push(slot)
            }
        }
        return result;
    }
}

export class Tutoring extends Hydratable {

    @HydrateProperty('number')
    rate: number;

    @HydrateProperty('number')
    lesson_buffer: number;

    @HydrateProperty('number')
    rating: number;

    @HydrateProperty()
    meet: number;

    @HydrateProperty()
    availability: Availability[];

    @HydrateProperty(TutoringSubject, true)
    subjects: TutoringSubject[];

    @HydrateProperty(TutoringDegree, true)
    degrees: TutoringDegree[];

    @HydrateProperty(Upload, false)
    video: Upload;

    @HydrateProperty(Upload, false)
    resume: Upload;

    @HydrateProperty()
    instant_session: boolean;

    @HydrateProperty()
    instant_booking: boolean;

    @HydrateProperty()
    hours_taught: number;

    @HydrateProperty()
    title: string;

    @HydrateProperty()
    youtube_video: string;

    @HydrateProperty()
    promote_video_allowed: boolean;
}

export class Address extends Hydratable {
    @HydrateProperty() address: string;
    @HydrateProperty() city: string;
    @HydrateProperty() state: string;
    @HydrateProperty() zipcode: string;

    toString(): string {
        return `${this.address} ${this.city}, ${this.state}`;
    }
}

export class Profile extends Hydratable {

    @HydrateProperty()
    first_name: string;

    @HydrateProperty()
    last_name: string;

    @HydrateProperty()
    about: string;

    @HydrateProperty(Upload)
    avatar: Upload;

    @HydrateProperty()
    telephone: string;

    @HydrateProperty()
    resume: string;

    @HydrateProperty('moment')
    birthday: moment.Moment;

    @HydrateProperty(Address)
    address: Address;

    @HydrateProperty()
    employer_identification_number: string;

    @HydrateProperty()
    social_security_number: string;
}

export class Coordinate extends Hydratable {

    @HydrateProperty()
    lat: number;

    @HydrateProperty()
    lng: number;

    constructor(raw?: any) {
        super();
        if (raw) {
            this.hydrate(raw);
        }
    }
}

export class GeoJSON extends Hydratable {

    @HydrateProperty()
    type: string;

    @HydrateProperty(Coordinate)
    coordinates: Coordinate;

    constructor(raw?: any) {
        super();
        if (raw) {
            this.hydrate(raw);
        }
    }
}

export class UserLocation extends Hydratable {

    @HydrateProperty(GeoJSON)
    position: GeoJSON;

    @HydrateProperty()
    country: string;

    @HydrateProperty()
    state: string;

    @HydrateProperty()
    city: string;

    @HydrateProperty()
    address: string;

    @HydrateProperty()
    postal_code: string;

    constructor(raw?: any) {

        super();

        if (raw) {
            console.log('constructor userlocation', raw);
            this.hydrate(raw);
        }

        const props = [
            'postal_code',
            'address',
            'city',
            'state',
            'country',
        ];

        for (const key of props) {
            if (typeof(this[key]) === 'undefined') {
                this[key] = '';
            }
        }
    }

    toString(): string {
        const address = [
            this.address.trim(),
            this.city.trim(),
            stateCodeToName(this.state),
            this.postal_code,
        ];

        return address.join(', ').trim();
    }

    public isBlank(text: string): boolean {
        if (text.trim() !== '') {
            return true;
        } else {
            return false;
        }
    }

    get nice(): string {
        if (this.city === '' && this.country === '') {
            return '';
        }
        if (this.city === '') {
            return this.country;
        }
        if (this.country === '') {
            return this.city;
        }
        return this.city + ', ' + this.country;
    }
}

export class LoginDetails extends Hydratable {

    @HydrateProperty()
    ip: any;

    @HydrateProperty()
    device: any;

    @HydrateProperty('moment')
    time: moment.Moment;
}

export interface CreditCard {
    id: string;       // stripe card id
    default: boolean; // default card
    month: number;    // expiration month
    year: number;     // expiration year
    number: string;   // last 4 digits
    type: string;     // card provider
}

export class ReferData extends Hydratable {

    @HydrateProperty()
    referrer: string;

    @HydrateProperty()
    referral_code: string;
}

export enum NoteType {
    rejected = 'rejected',
    misc = 'miscellaneous',
}

export class NoteWriter extends Hydratable {
    @HydrateProperty()
    name: string;

    @HydrateProperty()
    _id: string;

    constructor(raw: {[k: string]: string|number}) {
        super(raw);
    }
}

export interface Intercom {
    contact: string;
    workspace: string;
}

export class UserNote extends Hydratable {
    @HydrateProperty()
    _id: string;

    @HydrateProperty()
    note_type: NoteType;

    @HydrateProperty()
    note: string;

    @HydrateProperty()
    created_at: Date;

    @HydrateProperty()
    updated_by: NoteWriter;

    constructor(raw: {[k: string]: string|number}) {
        super(raw);
    }
}

export class User extends Hydratable implements UserPresenceObject {

    @HydrateProperty()
    _id: string;

    _timezone: string;

    @HydrateProperty(UserEmail, true)
    emails: UserEmail[];

    @HydrateProperty(Profile)
    profile: Profile;

    @HydrateProperty(Tutoring)
    tutoring: Tutoring;

    @HydrateProperty(UserLocation)
    location: UserLocation;

    @HydrateProperty()
    role: any;

    @HydrateProperty()
    preferences: any;

    @HydrateProperty()
    payments: any;

    @HydrateProperty(UserNote, true)
    notes: UserNote[];

    @HydrateProperty()
    approval: number;

    @HydrateProperty()
    is_test_account: boolean;

    @HydrateProperty()
    set timezone (v: string) {
        this._timezone = v;
    }

    get timezone(): string {

        if (this._timezone) {
            return this._timezone;
        }
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    @HydrateProperty('moment')
    registered_date: moment.Moment;

    @HydrateProperty()
    cc: boolean;

    @HydrateProperty()
    online: Presence;

    @HydrateProperty(LoginDetails)
    last_login: LoginDetails;

    @HydrateProperty()
    has_checkr_data: boolean;

    @HydrateProperty()
    has_bgcheck_data: boolean;

    @HydrateProperty(ReferData)
    refer: ReferData;

    @HydrateProperty()
    surveys: any;

    @HydrateProperty()
    username: string;

    @HydrateProperty()
    disabled: boolean;

    @HydrateProperty()
    intercom: Intercom;

    @HydrateProperty()
    private favorite: any;

    constructor(raw?: any) {

        super();

        if (raw) {
            this.hydrate(raw);
        }
    }

    update(raw: any) {
        this.hydrate(raw);
    }

    isFavorite(userId: string): boolean {

        if(userId && this.favorite && this.favorite.students) {
            const found = this.favorite.students.find(x => x.student == userId);

            if(found) {
                return true;
            }
        }

        return false;
    }

    get age(): number {
        return moment().diff(this.profile.birthday, 'year');
    }

    get shortName(): string {
        return Capitalize(`${this.profile.first_name} ${this.profile.last_name.substring(0, 1)}.`);
    }

    get name(): string {
        return Capitalize(`${this.profile.first_name} ${this.profile.last_name}`);
    }

    get avatar(): string {
        if (this.profile && this.profile.avatar) {
            return this.profile.avatar.href;
        }
        return 'https://s3.amazonaws.com/tutorthepeople/temp/default-avatar.png';
    }

    get email() {
        if (this.emails) {
            if (this.emails.length) {
                return this.emails[0].email;
            }
        }
        
        return '';
    }

    public get card(): null | CreditCard {
        if (this.payments === undefined || this.payments == null || this.cc !== true) {
            return null;
        }

        let defaultCard = (<CreditCard[]>this.payments.cards).find(cc => cc.default === true);
        if (defaultCard === undefined) {
            if (this.payments.cards.length > 0) {
                defaultCard = this.payments.cards[0];
            }
        }
        return defaultCard === undefined ? null : defaultCard;
    }

    hasRole(role: any): boolean {
        if (typeof(role) === 'string') {
            role = {'admin': 8, 'tutor': 4, 'student': 2}[role];
        }

        return Number(this.role & role) !== 0;
    }

    public isAdmin(): boolean {
        return this.hasRole(8) || this.hasRole(16);
    }

    public isTutor(): boolean {
        return this.hasRole(4);
    }

    public isStudent(): boolean {
        return this.hasRole(2);
    }

    public isAffiliate(): boolean {
        return this.role === 1;
    }

    unverifiedSubjects() {
        const out = [];

        if (!this.tutoring || !this.tutoring.subjects || this.tutoring.subjects.length === 0) {
            return out;
        }

        for (const subject of this.tutoring.subjects) {
            if (!subject.verified) {
                out.push(subject);
            }
        }

        return out;
    }

    unverifiedDegrees() {

        const out = [];

        if (!this.tutoring || !this.tutoring.degrees || this.tutoring.degrees.length === 0) {
            return out;
        }

        for (const degree of this.tutoring.degrees) {
            if (!degree.verified) {
                out.push(degree);
            }
        }

        return out;
    }

    preference(name: string, def: any): any {
        const data = this.preferences || {};
        return data[name] || def;
    }

    canMeet(kind: number): boolean {
        if (this.tutoring === undefined) {
            return false;
        }
        return (this.tutoring.meet & kind) !== 0;
    }

    get canMeetOnline(): boolean {
        return this.canMeet(MEET_ONLINE);
    }

    get canMeetInPerson(): boolean {
        return this.canMeet(MEET_IN_PERSON);
    }

    public get hasLocation(): boolean {
        return !!_get(this, 'location.position.coordinates');
    }

    public get profileComplete(): boolean {
        if (this.tutoring === undefined) {
            return false;
        }

        if (this.profile.avatar === undefined) {
            return false;
        }

        if (this.tutoring.rate === undefined || this.tutoring.rate <= 0) {
            return false;
        }

        if (this.tutoring.subjects === undefined || this.tutoring.subjects === null || this.tutoring.subjects.length === 0) {
            return false;
        }

        if (this.tutoring.degrees === undefined || this.tutoring.degrees === null || this.tutoring.degrees.length === 0) {
            return false;
        }

        if (this.tutoring.availability === undefined || this.tutoring.availability === null || this.tutoring.availability.length === 0) {
            return false;
        }

        return true;
    }

    getID(): string {
        return this._id;
    }

    setPresence(presence: Presence): void {
        this.online = presence;
    }
}

export class Transaction extends Hydratable {
    @HydrateProperty()
    _id: string;

    @HydrateProperty(User)
    user: User;

    @HydrateProperty()
    amount: number;

    @HydrateProperty()
    lesson: string;

    @HydrateProperty()
    details: string;

    @HydrateProperty()
    reference: string;

    @HydrateProperty()
    status: string;

    @HydrateProperty()
    state: number;

    @HydrateProperty('moment')
    time: moment.Moment;

    constructor(raw?: any) {
        super();
        if (raw) {
            this.hydrate(raw);
        }
    }

    public getState(s: string): number {
        switch (s.toLowerCase().trim()) {
            case 'sent':
                return 0;
            case 'approved':
                return 1;
            case 'pending':
                return 2;
            case 'cancelled':
                return 3;
        }
    }

    get stateDisplay(): string {
        switch (this.state) {
            case 0:
                return 'sent';
            case 1:
                return 'approved';
            case 2:
                return 'pending';
            case 3:
                return 'canceled';
        }
    }
}

export class Credit extends Hydratable {
    @HydrateProperty()
    balance: number;

    constructor(raw?: any) {
        super();
        if (raw) {
            this.hydrate(raw);
        }
    }
}

