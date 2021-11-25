import {Component, HostListener, ElementRef, ChangeDetectorRef} from '@angular/core';
import {WhiteboardToolbarButtonComponent} from 'app/white-board/whiteboard-toolbar-button/whiteboard-toolbar-button.component';

@Component({
    selector: 'learnt-whiteboard-toolbar-font-button',
    templateUrl: './whiteboard-toolbar-font-button.component.html',
    styleUrls: ['./whiteboard-toolbar-font-button.component.scss']
})
export class WhiteboardToolbarFontButtonComponent extends WhiteboardToolbarButtonComponent {

    constructor(elementRef: ElementRef, cdRef: ChangeDetectorRef) {
        super(elementRef, cdRef);
        this.hasSubmenu = true;
    }

    canAutoClose(event: MouseEvent) {
        let e: HTMLElement = <HTMLElement> event.target;
        while (e.parentElement) {
            if (e.nodeName.toLowerCase() === 'learnt-whiteboard-toolbar-font-button') {
                return false;
            }
            e = e.parentElement;
        }
        return true;
    }

    @HostListener('mousedown', ['$event'])
    onButtonClick(event: MouseEvent) {
        super.onButtonClick(event);
        this.action.next();
    }
}
