import {
    Component,
    EventEmitter,
    ElementRef,
    OnInit,
    HostListener,
    HostBinding,
    ViewChild,
    Input,
    Output,
    forwardRef, Host,
} from '@angular/core';
import {NG_VALUE_ACCESSOR, ControlValueAccessor} from '@angular/forms';

let __learnt_checkbox_index = 0;
const __learnt_group = {};

@Component({
    selector: 'learnt-checkbox',
    templateUrl: './checkbox.component.html',
    styleUrls: ['./checkbox.component.scss'],
    providers: [
        {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CheckboxComponent), multi: true}
    ],
})
export class CheckboxComponent implements OnInit, ControlValueAccessor {
    @HostBinding('class.style-old') getStyle(): boolean {
        return this._style === 'old';
    }

    private _style: string | 'new' | 'old' = 'old';
    @Input()
    set style(style: string) {
        this._style = style;
    }
    get style(): string {
        return this._style;
    }

    @Input()
    checked: boolean;

    @Input()
    name: string;

    @Input()
    value: any;

    @Input()
    @HostBinding('attr.disabled')
    disabled: boolean;

    @Input()
    @HostBinding('class')
    type: 'checkbox' | 'radio';

    @Input()
    group: string;

    @ViewChild('input')
    input: ElementRef;

    @HostBinding('class.focused')
    focused: boolean;

    @Input()
    @HostBinding('class.dark')
    dark: boolean;

    @Input()
    align: string;

    @Input()
    keepDefaultBehaviour: boolean;

    id: string;

    @Output()
    public readonly change: EventEmitter<any> = new EventEmitter();

    private onChangeFn: Function = () => {
    };

    private onTouchFn: Function = () => {
    };

    constructor() {
        this.id = 'learnt-checkbox-' + (++__learnt_checkbox_index);
    }

    @HostBinding('class.align-left')
    get isLeftAlign() {
        return this.align === 'left';
    }

    ngOnInit(): void {
        this.name = this.group;
        if (this.group) {
            if (!this.type) {
                this.type = 'radio';
            }
            if (!__learnt_group[this.group]) {
                __learnt_group[this.group] = [];
            }
            __learnt_group[this.group].push(this);
        } else {
            if (!this.type) {
                this.type = 'checkbox';
            }
        }
    }

    /**
     * Triggered on clicking the square div checkbox.
     * @param event
     */
    @HostListener('click', ['$event'])
    toggle(event: any): void {
        if (this.disabled) {
            return;
        }

        if (!this.keepDefaultBehaviour) {
            event.stopPropagation();
            event.preventDefault();
        }
        this.onTouchFn();
        this.checked = !this.checked;
        this.emitChange();
    }

    clearCheckbox() {
        this.checked = false;
    }

    /**
     * Triggered on clicking the label, which modified the hidden input.
     * @param event
     */
    onValueChange(event: any): void {
        if (this.disabled) {
            return;
        }
        if (!this.keepDefaultBehaviour) {
            event.stopPropagation();
            event.preventDefault();
        }
        this.onTouchFn();
        this.checked = event.target.checked;
        this.emitChange();
    }

    emitChange() {
        if (this.group) {
            this.onChangeFn(this.value);
            this.change.next(this.value);
            for (const e of __learnt_group[this.group]) {
                if (e !== this) {
                    e.checked = false;
                }
            }
        } else {
            this.onChangeFn(this.checked);
            this.change.next(this.checked);
        }
    }

    writeValue(obj: any): void {
        if (this.type === 'radio') {
            if (obj === this.value) {
                this.checked = true;
            }
        } else {
            this.checked = obj;
        }
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
