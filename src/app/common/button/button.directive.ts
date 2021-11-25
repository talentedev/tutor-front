import { Directive, ElementRef, Host, HostBinding, Input, OnInit, Renderer2 } from '@angular/core';

@Directive({
    selector: '[learnt-button], [learntButton]',
})
export class ButtonDirective {
    private _color: string;
    @Input('learntButton') set color1(color: string) {
        this._color =  color;
    }
    @Input('learnt-button') set color2(color: string) {
        this._color = color;
    }
    @Input('icon-position') iconPosition: string;
    @Input('size') size: string;
    @Input('disabled') disabled: boolean;
    @Input('fluid') fluid: boolean;
    @HostBinding('class.btn--red') get isRed() {
        return this._color === 'red';
    }
    @HostBinding('class.btn--blue') get isBlue() {
        return this._color === 'blue';
    }
    @HostBinding('class.btn--default') get isDefault() {
        return !this._color;
    }
    @HostBinding('class.btn--red-stroked') get isRedStroked() {
        return this._color == 'red-stroked';
    }
    @HostBinding('class.btn--sm') get isSmall() {
        return this.size === 'sm';
    }
    @HostBinding('class.btn--lg') get isLarge() {
        return this.size === 'lg';
    }
    @HostBinding('class.disabled') get isDisabled() {
        return this.disabled;
    }
    @HostBinding('class.icon-left') get iconLeft() {
        return this.iconPosition == 'left';
    }
    @HostBinding('class.btn--fluid') get isFluid() {
        return this.fluid;
    }

    constructor(private renderer: Renderer2, private el: ElementRef) {
        this.renderer.addClass(el.nativeElement, 'btn');
    }
}
