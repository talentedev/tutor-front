import { EventEmitter } from '@angular/core';

export class ValueSubject<T> extends EventEmitter<T> {

    private _valueIsSet = false;

    private _value: any;

    set value(value: T) {
        this._value = value;
        this._valueIsSet = true;
        this.next(value);
    }

    get value(): T {
        return this._value;
    }

    get isSet() {
        return this._valueIsSet;
    }

    subscribe(generatorOrNext?: any, error?: any, complete?: any): any {
        if (this.isSet) {
            return generatorOrNext.next(this.value);
        }
        return super.subscribe(generatorOrNext, error, complete);
    }
}
