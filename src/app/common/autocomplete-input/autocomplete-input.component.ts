import { ConnectedPositionStrategy, Overlay, OverlayRef, ViewportRuler, OverlayContainer } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Component, ElementRef, EventEmitter, forwardRef, HostBinding, HostListener, Input, Output, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { isNull } from 'util';
import { Subject } from '../../models';
import { AutocompleteInputData, AutocompleteInputDataProvider } from './types';
import { Platform } from '@angular/cdk/platform';

@Component({
    selector: 'learnt-autocomplete-input',
    templateUrl: './autocomplete-input.component.html',
    styleUrls: ['./autocomplete-input.component.scss'],
    providers: [
        {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AutocompleteInputComponent), multi: true}
    ]
})
export class AutocompleteInputComponent implements ControlValueAccessor, OnDestroy {

    @Input('multiple-outputs')
    @HostBinding('class.multiple-outputs')
    multipleOutputs = false;

    /**
     * Property to set this field disabled
     */
    @Input() disabled: boolean;

    /**
     * @type Function | string
     * Label to set as value or dropdown listing
     */
    @Input() label: Function | string;

    /**
     * Data key to bind to the form. If data key is not
     * specified the whole object will be sent to the form value
     */
    @Input() dataKey: string;

    /**
     * Show locked icon
     */
    @Input() locked: boolean;

    @HostBinding('class.focused') focused: boolean;

    @Output() change: EventEmitter<any> = new EventEmitter();

    @ViewChild('input') inputRef: ElementRef;

    hints: AutocompleteInputData[];

    hintsIndex = 0;

    skipKeyUp: boolean;

    working: boolean;

    valueOfInput: string;

    private _value: Subject[];

    private _dataProvider: AutocompleteInputDataProvider;

    onChangeFn: Function;
    onTouchedFn: Function;

    // List overlay
    @ViewChild('list') listRef: TemplateRef<HTMLDivElement>;
    listOverlayRef: OverlayRef;


    get value(): Subject[] {
        return this._value;
    }

    constructor(
        public ref: ElementRef,
        private overlay: Overlay,
        private platform: Platform,
        private container: OverlayContainer,
        private viewportRuller: ViewportRuler,
        private viewContainerRef: ViewContainerRef) {
    }

    @Input()
    set dataProvider(dp: AutocompleteInputDataProvider) {
        this._dataProvider = dp;
    }

    get dataProvider(): AutocompleteInputDataProvider {
        return this._dataProvider;
    }

    getInputLabel(item: any) {
        if (this.multipleOutputs) {
            return '';
        }

        return this.getHintLabel(item);
    }

    /**
     * If in multiple mode and hint already selected remove it
     * @param item Hint Item
     */
    removeSelectedHints(item: any) {
        if (!this.multipleOutputs || !this._value) {
            return true;
        }

        for (let i = 0; i < this._value.length; i++) {
            if (this._value[i] === item) {
                return false;
            }
        }

        return true;
    }

    getHintsTopPosition(): number {
        const boundsContainer = this.inputRef.nativeElement.getBoundingClientRect()
        const boundsInput = this.inputRef.nativeElement.getBoundingClientRect()
        return (boundsInput.top - boundsContainer.top) + boundsInput.height;
    }

    ngOnDestroy() {
        if (this.listOverlayRef) {
            this.listOverlayRef.dispose();
            this.listOverlayRef = null;
        }
    }

    /**
     * Create list overlay to display subjects
     */
    showHintsOverlay() {

        // Create once at focus
        if (this.listOverlayRef) {
            return;
        }

        const a = this.container.getContainerElement();

        this.listOverlayRef = this.overlay.create({
            positionStrategy: new ConnectedPositionStrategy(
                { originX: 'start', originY: 'center' },
                { overlayX: 'start', overlayY: 'top' },
                this.inputRef.nativeElement,
                this.viewportRuller,
                window.document,
                this.platform,
                this.container
            ),
        });
    }

    /**
     * Attach list overlay to display subjects
     */
    attachListOverlay() {
        if (!this.listOverlayRef.hasAttached()) {
            this.listOverlayRef.attach(
                new TemplatePortal(this.listRef, this.viewContainerRef)
            );
        }
    }

    removeItem(index: number) {
        this.value.splice(index, 1);
        this.emitChange();
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        if (!this.ref.nativeElement.contains(event.target)) {
            if (this.listOverlayRef) {
                this.listOverlayRef.detach();
            }
        }
    }

    @HostListener('click', ['$event'])
    onAutocompleteClick(event: MouseEvent) {
        event.stopPropagation();
        if (this.multipleOutputs) {
            this.setFocus();
        }
    }

    onHintSelect(item: AutocompleteInputData, event: MouseEvent) {
        event.stopPropagation();
        this.setValue(item);
        this.listOverlayRef.detach();
        if (this.multipleOutputs) {
            this.setFocus();
        }
    }

    /**
     * Avoid change event propagation
     */
    onInputChange(event) {
        event.stopPropagation();
    }

    onKeyUp(event: any) {

        if (this.skipKeyUp) {
            this.skipKeyUp = false;
            return;
        }

        if (!this.dataProvider) {
            return console.warn('No data provided for', this);
        }

        if (this._value !== null && !this.multipleOutputs) {
            this._value = null;
        }

        if (event.target.value === '') {
            return this.listOverlayRef.detach();
        }

        this.working = true;

        const obs = this.dataProvider.provide(
            event.target.value
        );

        obs.subscribe(hints => {

            this.hints = hints.filter(hint => this.value.find(selected => selected._id === (<any>hint)._id) === undefined);

            this.working = false;

            if (this.hints.length) {
                this.attachListOverlay();
                this.listOverlayRef.updatePosition();
            } else {
                this.listOverlayRef.detach();
            }
        });
    }

    emitChange() {
        this.onChangeFn(this._value);
        this.change.next(this._value);
    }

    onKeyDown(event: KeyboardEvent) {
        const UP = 38;
        const DOWN = 40;
        const ENTER = 13;
        const BACK = 8;

        switch (event.keyCode) {
            case BACK:
                if (this.valueOfInput === '' && this.multipleOutputs) {
                    if (!isNull(this._value)) {
                        this._value.pop();
                    }
                    this.emitChange();
                }
                break;
            case UP:
                this.skipKeyUp = true;
                event.stopPropagation();
                event.preventDefault();
                if (this.hintsIndex > 0) {
                    this.hintsIndex--;
                }
                break;
            case DOWN:
                this.skipKeyUp = true;
                event.stopPropagation();
                event.preventDefault();
                if (this.hintsIndex < this.hints.length - 1) {
                    this.hintsIndex++;
                }
                break;
            case ENTER:
                this.skipKeyUp = true;
                event.stopPropagation();
                event.preventDefault();
                this.listOverlayRef.detach();
                const hint = this.hints[this.hintsIndex];
                if (typeof hint !== 'undefined') {
                    this.setValue(hint);
                    this.hintsIndex = 0;
                    this.setFocus();
                }
                break;
        }
    }

    getMultipleOptions() {

        if (!this.multipleOutputs) {
            return [];
        }

        return this.value;
    }

    /**
     * Hint display label
     * @param item Hint Item
     */
    getHintLabel(item: any) {
        if (!item) {
            return '';
        }

        if (typeof (this.label) === 'string') {
            return item[this.label];
        } else if (typeof (this.label) === 'function') {
            return this.label(item);
        }

        return 'Unknown label';
    }

    /**
     * Get hint data on select. By default object is returned
     * @param item Hint item
     */
    getHintValue(item: any): any {

        if (this.dataKey) {

            if (item && !item.hasOwnProperty(this.dataKey)) {
                throw new Error(`Hint data item has no property ${this.dataKey}`);
            }

            return item[this.dataKey];
        }

        return item;
    }

    setValue(value: any, emit = true) {

        this.hints = [];

        if (this.multipleOutputs) {
            this._value = this._value || [];
            this._value.push(value);
            this.valueOfInput = '';
        } else {
            this._value = value;
            this.valueOfInput = this.getHintLabel(value);
        }

        if (emit) {
            this.emitChange();
        }
    }

    setFocus() {
        setTimeout(() => {
            this.inputRef.nativeElement.focus();
            this.onFocus({target: this.inputRef.nativeElement});
        });
    }

    onFocus(event: any) {
        this.focused = true;
        if (!this.dataProvider) {
            return console.warn('No data provided for', this);
        }
        this.onTouchedFn();
        if (event.target.value !== '') {
            this.dataProvider.provide(
                event.target.value
            );
        }

        this.showHintsOverlay();
    }

    onBlur(event: any) {
        this.focused = false;
    }

    writeValue(obj: any): void {
        this._value = obj;
        this.valueOfInput = this.getHintLabel(obj);
    }

    registerOnChange(fn: any): void {
        this.onChangeFn = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouchedFn = fn;
    }

    setDisabledState?(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }


    private clearInputValue() {

    }
}
