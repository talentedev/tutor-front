import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    SimpleChanges,
    EventEmitter,
    forwardRef,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    ViewChild,
    ChangeDetectionStrategy,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

export class PriceIntervalValue {

    constructor(public min: number, public max: number) {}

    isValid(): boolean {
        if (isNaN(this.min) || isNaN(this.max)) {
            return false;
        }
        return this.max >= this.min;
    }

    equal(b: PriceIntervalValue): boolean {
        return this.min === b.min && this.max === b.max;
    }

    clone(): PriceIntervalValue {
        return new PriceIntervalValue(this.min, this.max);
    }

    toString() {
        return `[Min:${this.min} Max:${this.max}`;
    }
}

@Component({
    selector: 'learnt-price-interval',
    templateUrl: './price-interval.component.html',
    styleUrls: ['./price-interval.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default,
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PriceIntervalComponent), multi: true }
    ]
})
export class PriceIntervalComponent implements OnInit, OnChanges, OnDestroy, ControlValueAccessor {

    @Input()
    min = 10;

    @Input()
    max = 100;

    @Input()
    step = 5;

    @Input()
    value: PriceIntervalValue;

    @Input('default')
    defaultValue: PriceIntervalValue;

    @Input()
    disabled: boolean;

    @ViewChild('bar', { static: true })
    bar: ElementRef;

    @ViewChild('progress', { static: true })
    progress: ElementRef;

    @ViewChild('handlerLeft', { static: true })
    handlerLeft: ElementRef;

    @ViewChild('handlerRight', { static: true })
    handlerRight: ElementRef;

    activeHandler: HTMLElement;
    activeHandlerKind: string;

    startEvent: UIEvent;

    shift = 3;

    dragOnChangeIntv: any;

    @Output()
    public readonly change: EventEmitter<any> = new EventEmitter(true);

    onChangeFn = (x) => {};
    onTouchedFn = () => {};

    constructor(private cdRef: ChangeDetectorRef) {
        this.onHandlerStart = this.onHandlerStart.bind(this);
        this.onHandlerEnd = this.onHandlerEnd.bind(this);
        this.onHandlerMove = this.onHandlerMove.bind(this);
        this.onBarStart = this.onBarStart.bind(this);
        this.onResize = this.onResize.bind(this);
    }

    ngOnInit() {
        this.writeValue(this.value ? this.value : new PriceIntervalValue(10, 30));
        this.bar.nativeElement.addEventListener('mousedown', this.onBarStart);
        this.bar.nativeElement.addEventListener('touchstart', this.onBarStart);

        this.handlerLeft.nativeElement.addEventListener('mousedown', this.onHandlerStart);
        this.handlerRight.nativeElement.addEventListener('mousedown', this.onHandlerStart);
        this.handlerLeft.nativeElement.addEventListener('touchstart', this.onHandlerStart);
        this.handlerRight.nativeElement.addEventListener('touchstart', this.onHandlerStart);

        window.addEventListener('resize', this.onResize);
    }

    ngOnDestroy() {
        window.removeEventListener('resize', this.onResize);
        this.handlerLeft.nativeElement.removeEventListener('mousedown', this.onHandlerStart);
        this.handlerRight.nativeElement.removeEventListener('mousedown', this.onHandlerStart);
        this.handlerLeft.nativeElement.removeEventListener('touchstart', this.onHandlerStart);
        this.handlerRight.nativeElement.removeEventListener('touchstart', this.onHandlerStart);
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.defaultValue && !this.value) {
            this.value = changes.defaultValue.currentValue;
        }
    }

    onBarStart(event: UIEvent) {
        this.onHandlerStart(event);
    }

    onHandlerStart = (event: UIEvent) => {
        event.preventDefault();
        event.stopPropagation();
        this.startEvent = event;
        this.activeHandler = <HTMLElement> event.target;
        if (event instanceof MouseEvent) {
            document.addEventListener('mouseup', this.onHandlerEnd);
            document.addEventListener('mousemove', this.onHandlerMove);
        } else if (event instanceof TouchEvent) {
            document.addEventListener('touchend', this.onHandlerEnd);
            document.addEventListener('touchmove', this.onHandlerMove);
        }
    }

    onHandlerEnd = (event: UIEvent) => {
        if (event instanceof MouseEvent) {
            document.removeEventListener('mouseup', this.onHandlerEnd);
            document.removeEventListener('mousemove', this.onHandlerMove);
        } else if (event instanceof TouchEvent) {
            document.removeEventListener('touchend', this.onHandlerEnd);
            document.removeEventListener('touchmove', this.onHandlerMove);
        }
        this.startEvent = null;
    }

    onHandlerMove = (event: UIEvent) => {
        const barRect = this.bar.nativeElement.getBoundingClientRect();
        const handlerRect = this.activeHandler.getBoundingClientRect();
        const kind = this.activeHandler.dataset['kind'];

        let left = 0;
        if (event instanceof MouseEvent && this.startEvent instanceof MouseEvent) {
            left = event.clientX - barRect.left - this.startEvent.offsetX;
        } else if (event instanceof TouchEvent && this.startEvent instanceof TouchEvent) {
            left = event.touches[0].clientX - ((this.startEvent.touches[0].target as HTMLElement).offsetParent as HTMLElement).offsetLeft;
        }

        if (left > barRect.width - (handlerRect.width - this.shift)) {
            left = barRect.width - (handlerRect.width - this.shift);
        }

        if (left < -this.shift) {
            left = -this.shift;
        }

        const percent = (left + this.shift) /
                        (barRect.width - handlerRect.width + this.shift * 2);

        let value = Math.round(((this.max - this.min) * percent) + this.min);

        value = value - (value % this.step);

        const emit = this.value[kind] !== value;

        if (kind === 'min' && value >= this.value.max) {
            return;
        }

        if (kind === 'max' && value <= this.value.min) {
            return;
        }

        const _new = this.value.clone();

        _new[kind] = value;

        this.value = _new;
        this.cdRef.detectChanges();
        this.onTouchedFn();

        if (!emit) {
            return;
        }

        if (this.dragOnChangeIntv) {
            clearTimeout(this.dragOnChangeIntv);
        }

        this.dragOnChangeIntv = setTimeout(() => {
            this.onChangeFn(this.value);
            this.change.next(this.value);
        }, 500);

        this.updateHandlersPosition();
    }

    onResize(event) {
        this.writeValue(this.value);
    }

    getBarWidth(): number {
        const bar: HTMLElement = this.bar.nativeElement;
        return bar.getBoundingClientRect().width;
    }

    updateHandlersPosition() {
        const barRect = this.bar.nativeElement.getBoundingClientRect();
        const handlerRect = this.handlerLeft.nativeElement.getBoundingClientRect();
        const percentLeft = (this.value.min - this.min) / (this.max - this.min);
        const percentRight = (this.value.max - this.min) / (this.max - this.min);
        const left = percentLeft * (barRect.width - handlerRect.width);
        const right = percentRight * (barRect.width - handlerRect.width);
        this.handlerLeft.nativeElement.style.left = left + 'px';
        this.handlerRight.nativeElement.style.left = right + 'px';
        this.progress.nativeElement.style.left = left + handlerRect.width / 2 + 'px';
        this.progress.nativeElement.style.width = right - left + 'px';
    }

    /**
     * Write a new value to the element.
     */
    writeValue(value: PriceIntervalValue): void {

        if (this.startEvent) {
            return;
        }

        if (!(value instanceof PriceIntervalValue)) {
            throw new Error('Not a valid price interval value. Typeof is ' + typeof(value));
        }

        if (!value.isValid()) {
            throw new Error(
                'Price value is not valid. Shoud contain min, max numbers and max should be hihgher or equal with min'
            );
        }

        this.value = value;
        this.updateHandlersPosition();
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
