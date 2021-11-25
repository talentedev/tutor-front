import {Component, ContentChildren, forwardRef, OnInit, QueryList, ViewChildren} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from "@angular/forms";
import {ButtonOptionComponent} from "../button-option/button-option.component";
import {Subject} from "rxjs";
import {first} from "rxjs/operators/first";

@Component({
    selector: 'learnt-button-select',
    templateUrl: './button-select.component.html',
    styleUrls: ['./button-select.component.scss'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => ButtonSelectComponent),
        multi: true,
    }],
})
export class ButtonSelectComponent implements OnInit, ControlValueAccessor {
    onChangeFn: (val: any) => void;
    onTouchedFn: () => void;
    disabled: boolean = false;
    private _value: any;
    value$ = new Subject<any>();

    @ContentChildren(ButtonOptionComponent)
    options: QueryList<ButtonOptionComponent>;

    constructor() {
    }

    ngOnInit(): void {
    }

    ngAfterContentInit() {
        this.options.map((option) => {
            option.active = option.value === this._value;
            option.onClick.subscribe((value) => {
               this.value$.next(value);
               this._value = value;
            });
        });

        this.value$.subscribe(val => {
            this.options.map((option) => {
                option.active = option.value === val;
            });
            this.onChangeFn(val);
        });
    }

    registerOnChange(fn: any): void {
        this.onChangeFn = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouchedFn = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    writeValue(obj: any): void {
        this._value = obj;
        this.value$.next(obj);
    }

}
