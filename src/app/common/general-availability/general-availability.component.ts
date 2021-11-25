import {Component, EventEmitter, forwardRef, Input, Output} from '@angular/core';
import {NG_VALUE_ACCESSOR, ControlValueAccessor} from '@angular/forms';
import { WhenFilterDayInfo } from '../../pages/search/search.component';

@Component({
    selector: 'learnt-general-availability',
    templateUrl: './general-availability.component.html',
    styleUrls: [
        './general-availability.component.desktop.scss',
        './general-availability.component.mobile.scss',
        './general-availability.component.scss'
    ],
    providers: [
        {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => GeneralAvailabilityComponent), multi: true}
    ]
})
export class GeneralAvailabilityComponent implements ControlValueAccessor {

    @Output()
    public readonly change: EventEmitter<any> = new EventEmitter();

    private disabled: boolean;

    public days: string[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    private availabilities: { [key: number]: number } = {};

    public day = -1;

    public showDayPart = false;

    private onChangeFn: Function;
    private onTouchFn: Function;

    @Input()
    public set availability(av: string) {
        if (av === null || av === undefined) {
            return;
        }

        if (Object.keys(this.availabilities).length > 0) {
            // already have availabilities set
            return;
        }

        (<string[]>av.split(',')).forEach(n => this.value = parseInt(n, 10));
    }

    private set value(v: number) {
        if (typeof v !== 'number') {
            // also takes care of null and undefined
            return;
        }

        if (v === 0) {
            delete this.availabilities[this.day];
            return;
        }

        if (this.day > -1) {
            this.availabilities[this.day] = v;
            return;
        }

        // all days
        for (let d = 0; d < this.days.length; d++) {
            const [m, a, e] = [this.getMask(1, d), this.getMask(2, d), this.getMask(3, d)];
            const intervals: number[] = [m, a, e, m | a, m | e, a | e, m | a | e];

            if (intervals.indexOf(v) > -1) {
                this.availabilities[d] = v;
            }
        }
    }

    constructor() {
        this.onChangeFn = this.onTouchFn = () => {
        };
    }

    public isDayModified(day: number): boolean {
        const morning = this.getMask(1, day);
        const afternoon = this.getMask(2, day);
        const evening = this.getMask(3, day);
        return this.isSet(morning) || this.isSet(afternoon) || this.isSet(evening);
    }

    public hasDay(day: number): boolean {
        return this.availabilities[day] !== undefined;
    }

    public isPartSelected(part: number): boolean {
        if (part === 4) {
            // all day
            return this.isSet(this.getMask(1)) && this.isSet(this.getMask(2)) && this.isSet(this.getMask(3));
        }

        const maskPart: boolean = this.isSet(this.getMask(part));
        let availabilityPart = false;

        if (this.availabilities[this.day] !== undefined) {
            availabilityPart = (this.availabilities[this.day] & this.getMask(part, this.day)) !== 0;
        }

        return maskPart || availabilityPart;
    }

    private isDayFull(day: number): boolean {
        const morning = this.getMask(1, day);
        const afternoon = this.getMask(2, day);
        const evening = this.getMask(3, day);
        return this.isSet(morning) && this.isSet(afternoon) && this.isSet(evening);
    }

    public onDaysClick(event: MouseEvent): void {
        const e: HTMLElement = <any>event.target;

        if (!e.classList.contains('day')) {
            return;
        }

        this.day = Array.prototype.indexOf.call(e.parentElement.children, e);
        this.showDayPart = true;

        // if (this.hasDay(this.day)) {
        //     return;
        // }

        // this.value = this.getMask(4, this.day - 1);
        // this.fillDay(this.day);
        this.dispatch();
    }

    public getMask(n: number, day: number = this.day): number {
        const factor = 3 * day;
        return 1 << (n + factor);
    }

    private isSet(mask: number): boolean {
        return (this.availabilities[this.day] & mask) !== 0;
    }

    private set(mask: number) {
        this.value = this.availabilities[this.day] | mask;
    }

    private unset(mask: number) {
        this.value = this.availabilities[this.day] ^ mask;
    }

    private toggle(mask: number): void {
        this.isSet(mask) ? this.unset(mask) : this.set(mask);
    }

    private clearDay(day: number): void {
        for (let i = 1; i <= 3; i++) {
            const mask = this.getMask(i, day);
            if (this.isSet(mask)) {
                this.unset(mask);
            }
        }
    }

    private fillDay(day: number): void {
        for (let i = 1; i <= 3; i++) {
            const mask = this.getMask(i, day);
            if (!this.isSet(mask)) {
                this.set(mask);
            }
        }
    }

    public clearGeneralAvailabilityFilter(whenIndex: number, whenFilter: WhenFilterDayInfo) {
        this.day = whenFilter.dayNumber;
        this.clearDay(whenIndex);
        this.unset(whenFilter.whenFilterValue);
        this.day = -1;
    }

    public onDayPartsClick(event: MouseEvent, shiftNum?: number): void {
        const e: HTMLElement = <any>event.target;

        let shift: number, mask: number;

        if (shiftNum === undefined) {
            if (!e.classList.contains('day-part')) {
                return;
            }

            shift = parseInt(e.dataset.shift, 10);
            mask = this.getMask(shift);
        } else {
            shift = shiftNum;
            mask = this.getMask(shiftNum);
        }

        if (shift === 4) {
            if (this.isDayFull(this.day)) {
                this.clearDay(this.day);
            } else {
                this.fillDay(this.day);
            }
        } else {
            this.toggle(mask);
        }

        this.dispatch();
    }

    private dispatch(): void {
        const availabilities: string[] = [];
        for (const k in this.availabilities) {
            if (k === '-1' || isNaN(this.availabilities[k])) {
                continue;
            }
            availabilities.push('' + this.availabilities[k]);
        }

        this.change.next(availabilities.join(','));
        this.onChangeFn(availabilities.join(','));
        this.onTouchFn();
    }

    /**
     * Write a new value to the element.
     */
    writeValue(availability: any): void {
        this.value = availability;
    }

    /**
     * Set the function to be called when the control receives a change event.
     */
    registerOnChange(fn: any): void {
        this.onChangeFn = fn;
    }

    /**
     * Set the function to be called when the control receives a touch event.
     */
    registerOnTouched(fn: any): void {
        this.onTouchFn = fn;
    }

    /**
     * This function is called when the control status changes to or from "DISABLED".
     * Depending on the value, it will enable or disable the appropriate DOM element.
     *
     * @param isDisabled
     */
    setDisabledState?(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }
}
