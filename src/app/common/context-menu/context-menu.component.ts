import {Component, Directive, ElementRef, HostListener, Input, Output, EventEmitter} from '@angular/core';
import {isNullOrUndefined} from 'util';

// tslint:disable-next-line:directive-selector
@Directive({selector: '[learnt-context-menu]'})
export class ContextMenuDirective {

    @Input('learnt-context-menu')
    menu: ContextMenuComponent;

    @HostListener('click', ['$event'])
    onClick(event: MouseEvent) {
        event.stopPropagation();
        this.toggle();
    }

    toggle() {
        if (this.menu.visible) {
            this.menu.hide();
        } else {
            this.menu.show();
        }
    }
}

@Component({
    selector: 'learnt-context-menu',
    template: '<ng-content></ng-content>',
    styleUrls: ['./context-menu.component.scss']
})
export class ContextMenuComponent {

    visible = false;

    private readonly replacer: Comment;

    @Output()
    public readonly select: EventEmitter<any> = new EventEmitter(true);

    constructor(private ref: ElementRef) {
        this.replacer = document.createComment('learnt-context-menu');
        this.hide();
    }

    show() {
        this.visible = true;
        this.replacer.parentElement.replaceChild(this.ref.nativeElement, this.replacer);
    }

    hide() {
        this.visible = false;
        if (!isNullOrUndefined(this.ref.nativeElement.parentElement)) {
            this.ref.nativeElement.parentElement.replaceChild(this.replacer, this.ref.nativeElement);
        }
    }

    @HostListener('click', ['$event'])
    onClick(event: MouseEvent) {
        this.hide();
        this.select.next(event.target);
    }

    @HostListener('document:click', ['$event'])
    clickedOutside(event: MouseEvent) {
        this.hide();
    }
}
