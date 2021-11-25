import {
    Component,
    EventEmitter,
    forwardRef,
    HostBinding,
    HostListener,
    Input,
    Output,
} from '@angular/core';
import {NG_VALUE_ACCESSOR, ControlValueAccessor} from '@angular/forms';
import {
    trigger,
    state,
    style,
    animate,
    transition
} from '@angular/animations';

const ON_COLOR = '#89C0CA';
const OFF_COLOR = '#F37073';

@Component({
    selector: 'learnt-toggle-button',
    templateUrl: './toggle-button.component.html',
    styleUrls: ['./toggle-button.component.scss'],
    animations: [

        trigger('circle', [
            state('left', style({left: '8%', backgroundColor: OFF_COLOR})),
            state('right', style({left: '60%', backgroundColor: ON_COLOR})),
            transition('right => left', [style({left: '7px', backgroundColor: OFF_COLOR}), animate('0.2s cubic-bezier(0, 1.49, 1, 1)')]),
            transition('left => right', [style({left: '30px', backgroundColor: ON_COLOR}), animate('0.2s cubic-bezier(0, 1.49, 1, 1)')]),
        ]),

        trigger('off', [
            state('left', style({opacity: 1})),
            state('right', style({opacity: 0})),
            transition('left => right', [style({opacity: 0}), animate('0.2s cubic-bezier(0, 0, 0, 1)')]),
            transition('right => left', [style({opacity: 1}), animate('0.2s cubic-bezier(0, 0, 0, 1)')]),
        ]),

        trigger('on', [
            state('left', style({opacity: 0})),
            state('right', style({opacity: 1})),
            transition('left => right', [style({opacity: 1}), animate('0.2s cubic-bezier(0, 0, 0, 1)')]),
            transition('right => left', [style({opacity: 0}), animate('0.2s cubic-bezier(0, 0, 0, 1)')]),
        ]),
    ],
    providers: [
        {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ToggleButtonComponent), multi: true}
    ]
})
export class ToggleButtonComponent implements ControlValueAccessor {

    @Input()
    @HostBinding('class.active')
    active: boolean;

    @Output()
    change: EventEmitter<boolean> = new EventEmitter(true);

    @HostBinding('attr.tabIndex')
    tabIndex = 1;

    @HostBinding('attr.role')
    role = 'button';

    disabled: boolean;

    onChangeFn = (x) => {
    }

    onTouchedFn = () => {
    }

    @HostListener('click', ['$event'])
    onClick(event: MouseEvent) {
        this.active = !this.active;
        this.onChangeFn(this.active);
        this.onTouchedFn();
        this.change.next(this.active);
    }

    @HostListener('keydown', ['$event'])
    onKeywordDown(event) {
        if (event.keyCode === 32 || event.keyCode === 13) {
            this.onClick(null);
        }
    }

    get state() {
        return this.active ? 'right' : 'left';
    }

    /**
     * Write a new value to the element.
     */
    writeValue(active: any): void {
        this.active = active;
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
        this.onTouchedFn = fn;
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
