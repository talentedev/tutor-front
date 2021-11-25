import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {
    Component,
    OnInit,
    forwardRef,
    ViewChild,
    ElementRef,
    Input,
    HostBinding,
    OnDestroy,
    ViewChildren, QueryList
} from '@angular/core';
import {MatFormFieldControl} from '@angular/material/form-field';
import {FocusMonitor} from '@angular/cdk/a11y';
import {Subject, Subscription} from 'rxjs';
import {type} from "os";
import {MAT_INPUT_VALUE_ACCESSOR} from "@angular/material/input";

@Component({
    selector: 'learnt-ssninput',
    templateUrl: './ssninput.component.html',
    styleUrls: ['./ssninput.component.scss'],
    providers: [
        {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SSNInputComponent), multi: true},
        {provide: MAT_INPUT_VALUE_ACCESSOR, useExisting: SSNInputComponent}
    ]
})
export class SSNInputComponent extends MatFormFieldControl<string> implements ControlValueAccessor, OnInit, OnDestroy {

    static nextId = 0;

    controlType = 'learnt-ssninput';

    id = `example-tel-input-${SSNInputComponent.nextId++}`;
    private focusMonitorSubscription: Subscription;

    @Input()
    set value(v: string) {

        if (!v) {
            return;
        }

        const values = v.split('').filter(c => c !== '-');
        const inputs = this._elRef.nativeElement.querySelectorAll('input');
        values.map((v: string, i: number) => {
            (inputs[i] as HTMLInputElement).value = v;
        });
        this.stateChanges.next();
    }

    get value(): string {
        let val = '';
        let counter = 0;
        this._elRef.nativeElement.querySelectorAll('input').forEach((inputEl: HTMLInputElement) => {
            val += inputEl.value;
            if (counter === 2 || counter === 4) {
                val += '-';
            }
            counter++;
        });
        return val;
    }

    isDisabled: boolean;
    focused: boolean;

    stateChanges = new Subject<void>();

    onChangeFn: (val: string) => void;
    onTouchedFn: () => void;

    @HostBinding('attr.aria-describedby') describedBy = '';

    setDescribedByIds(ids: string[]) {
        this.describedBy = ids.join(' ');
    }

    constructor(private _focusMonitor: FocusMonitor, private _elRef: ElementRef<HTMLElement>) {
        super();
        this.focusMonitorSubscription = _focusMonitor.monitor(this._elRef, true).subscribe(origin => {
            if (this.focused && !origin) {
                this.onTouchedFn();
            }
            this.focused = !!origin;
            this.stateChanges.next();
        });

        if (this.ngControl != null) {
            this.ngControl.valueAccessor = this;
        }
    }


    ngOnInit(): void {
    }

    ngAfterViewInit(): void {
        this._elRef.nativeElement.querySelectorAll('input').forEach((input: HTMLInputElement) => {
            input.addEventListener('input', (evt: InputEvent) => {
                this.onChangeFn(this.value);
                this.onTouchedFn();
            });

            input.addEventListener('keyup', (evt: KeyboardEvent) => {
                evt.stopPropagation();
                if (evt.repeat && evt.key !== 'Backspace') {
                    return;
                }
                const whiteListed = ['Tab', '1', '2', '3', '4', '5','6', '7', '8', '9', '0', 'Backspace'];

                const el = evt.target as HTMLInputElement;
                if (evt.key === 'Backspace' && !el.value) {
                    let nextEl = el.previousElementSibling as HTMLInputElement;
                    if (nextEl && nextEl.tagName !== 'INPUT') {
                        nextEl = nextEl.previousElementSibling as HTMLInputElement;
                    }
                    if (nextEl && nextEl.tagName === 'INPUT') {
                        nextEl.focus();
                        nextEl.select();
                    }
                }

                if (evt.shiftKey && evt.key === 'Tab') {
                    let nextEl = evt.target as HTMLInputElement;
                    if (nextEl && nextEl.tagName === 'INPUT') {
                        nextEl.focus();
                        nextEl.select();
                    }
                    return;
                }

                if (!whiteListed.includes(evt.key)) {
                    evt.preventDefault();
                }

                if ('1234567890'.includes(evt.key)) {
                    let nextEl = el.nextElementSibling as HTMLInputElement;
                    if (nextEl && nextEl.tagName !== 'INPUT') {
                        nextEl = nextEl.nextElementSibling as HTMLInputElement;
                    }
                    if (nextEl && nextEl.tagName === 'INPUT') {
                        setTimeout(() => {
                            nextEl.focus();
                            nextEl.select();
                        }, 200)
                    }
                }

            });
        })
    }

    ngOnDestroy(): void {
        this.focusMonitorSubscription.unsubscribe();
    }

    isTextSelected(input: HTMLInputElement) {
        if (input.value === '') {
            return false;
        }
        return input.value.substring(input.selectionStart, input.selectionEnd).length === input.value.length
    }

    writeValue(v: string): void {
        this.value = v;
    }

    registerOnChange(fn: any): void {
        this.onChangeFn = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouchedFn = fn;
    }

    setDisabledState?(isDisabled: boolean): void {
        this.isDisabled = isDisabled;
        this.stateChanges.next();
    }

    onContainerClick(event: MouseEvent): void {
        event.preventDefault();
    }
}
