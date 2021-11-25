import {EventEmitter, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import moment from 'moment-timezone';

function timezonesFromBase(zones: TimezoneBase[]): Timezone[] {
    const timezones: Timezone[] = [];

    for (const zone of zones) {
        let time = '';

        const startOfZone = zone.text.indexOf('(');
        const endOfZone = zone.text.indexOf(')');

        if (startOfZone > -1 || endOfZone > -1) {
            time = zone.text.substr(startOfZone + 1, endOfZone - 1);
        }

        const utc = zone.utc ? zone.utc : [];
        for (const area of utc) {
            timezones.push({zone: area, time: time});
        }
    }

    return timezones.sort((a, b) => a.zone > b.zone ? 1 : (b.zone > a.zone ? -1 : 0));
}

interface TimezoneBase {
    value: string;
    abbr: string;
    offset: number;
    isdst: boolean;
    text: string;
    utc: string[];
}

export interface Timezone {
    zone: string;
    time: string;
}

@Injectable()
export class TimezoneService {
    private done: EventEmitter<boolean> = new EventEmitter<boolean>();
    private _timezones: Timezone[];
    private _USTimezones: Timezone[];

    /**
     * Return the timezone by querying the browser. Might be undefined.
     * @link https://stackoverflow.com/questions/1091372/getting-the-clients-timezone-in-javascript/34602679#34602679
     * @return {string}
     */
    public static get BrowserTimezone(): string {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    /**
     * Returns the UTC timezone.
     * @return {Timezone}
     * @constructor
     */
    static get UTC(): Timezone {
        return <Timezone>{zone: 'Etc/GMT+0', time: 'UTC'};
    }

    /**
     * Offset returns the difference in minutes between two offsets.
     * @param {Timezone} a
     * @param {Timezone} b
     * @return {number}
     */
    static offset(a: Timezone, b: Timezone): number {
        const ao = TimezoneService.UTCOffset(a);
        const bo = TimezoneService.UTCOffset(b);

        if (ao === bo) {
            return 0;
        }

        let offset = 0;

        // one of the timezones is on UTC
        if (ao === 0) {
            offset = Math.abs(bo);
        }

        if (bo === 0) {
            offset = Math.abs(ao);
        }

        // one of the zones is before UTC, other after UTC
        if ((ao < 0 && bo > 0) || (ao > 0 && bo < 0)) {
            offset = Math.abs(ao) + Math.abs(bo);
        }

        // both zones are before UTC, or after UTC
        if ((ao < 0 && bo < 0) || (ao > 0 && bo > 0)) {
            offset = Math.abs(Math.abs(ao) - Math.abs(bo));
        }

        // apply the correct sign to the offset
        if (ao > bo) {
            offset = -offset;
        }

        return offset;
    }

    /**
     * Returns the offset in minutes to UTC.
     * @param {Timezone} tz
     * @return {number}
     */
    static UTCOffset(tz: Timezone): number {
        const execRe = /[-+]/.exec(tz.time);
        if (execRe === null) {
            return 0;
        }

        const signIndex = execRe.index;
        const delimiterIndex = tz.time.indexOf(':');
        if (delimiterIndex <= signIndex) {
            return 0;
        }

        const hour = parseInt(tz.time.substring(signIndex, delimiterIndex), 10);
        let minute = parseInt(tz.time.substring(delimiterIndex + 1, delimiterIndex + 3), 10);

        if (hour < 0) {
            minute = -minute;
        }

        return hour * 60 + minute;
    }

    constructor(private http: HttpClient) {
        this.getTimezones();
    }

    public get timezones(): Observable<Timezone[]> {
        return new Observable(obs => {
            if (this._timezones !== undefined) {
                obs.next(this._timezones);
                obs.complete();
                return;
            }

            this.done.subscribe((done: boolean) => {
                obs.next(this._timezones);
                obs.complete();
            });
        });
    }

    public get USTimezones(): Observable<Timezone[]> {
        return new Observable<Timezone[]>(obs => {
            if (this._USTimezones !== undefined) {
                obs.next(this._USTimezones);
                obs.complete();
                return;
            }

            this.done.subscribe((done: boolean) => {
                obs.next(this._USTimezones);
                obs.complete();
            });
        });
    }

    /**
     * Fetch the timezones from the local file.
     */
    private getTimezones(): void {
        this.http.get<TimezoneBase[]>('/assets/timezones.json').subscribe((zones: TimezoneBase[]) => {
            const usIanaZones = moment.tz.zonesForCountry('US');

            this._timezones = timezonesFromBase(zones);
            this._USTimezones = this._timezones.filter(zone => usIanaZones.includes(zone.zone));

            this.done.next(true);
        });
    }

    /**
     * Returns the timezone associated with the provided zone name.
     * For example, calling `zone('Europe/Bucharest')` returns `{zone: "Europe/Bucharest", time: "UTC+02:00"}`.
     * An undefined timezone returns UTC.
     * @param {string} zone
     * @param {boolean} USOnly
     * @return {Timezone}
     */
    public zone(zone: string, USOnly: boolean = false): Timezone {
        const zones = USOnly ? this._USTimezones : this._timezones;
        const tz = zones.find(_ => _.zone === zone);
        if (tz === undefined) {
            return TimezoneService.UTC;
        }
        return tz;
    }
}
