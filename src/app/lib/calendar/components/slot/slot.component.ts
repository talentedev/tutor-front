import { RenderingService, SlotState } from '../../services/rendering.service';
import { Component, Input, ElementRef, ChangeDetectorRef, HostListener, HostBinding, OnInit } from '@angular/core';

@Component({
    selector: 'learnt-calendar-slot',
    templateUrl: './slot.component.html',
    styleUrls: ['./slot.component.scss']
})
export class CalendarSlotComponent implements OnInit {

    @Input()
    @HostBinding('class')
    mode: 'available' | 'unavailable' = 'available';

    resizeSide: 'left' | 'width';

    showHandlers: boolean;

    @HostBinding('class.dragging')
    dragging: boolean;

    resizeStartState: any;
    resizeStartEvent: MouseEvent;

    @HostBinding('class.end')
    end: boolean;

    constructor(
        private ref: ElementRef,
        private cd: ChangeDetectorRef,
        private rendering: RenderingService
    ) {
        this.onDocumentMouseMove = this.onDocumentMouseMove.bind(this);
        this.onDocumentMouseUp = this.onDocumentMouseUp.bind(this);
    }

    ngOnInit() {
        this.setState({
            left: 0,
            width: 91.25,
        });
    }

    setState(state: SlotState) {
        this.ref.nativeElement.style.left = state.left + 'px';
        this.ref.nativeElement.style.width = state.width + 'px';
    }

    getState(): SlotState {
        return {
            left: parseInt(this.ref.nativeElement.style.left, 10) || 0,
            width: parseInt(this.ref.nativeElement.style.width, 10) || 0,
        };
    }

    @HostListener('mouseenter')
    onMouseEnter() {
        this.showHandlers = true;
    }

    @HostListener('mouseleave')
    onMouseLeave() {
        if (!this.dragging) {
            this.showHandlers = false;
        }
    }

    @HostListener('mousedown', ['$event'])
    onMouseDown(event: MouseEvent) {
        event.stopPropagation();
        const e: HTMLElement = <HTMLElement> event.target;
        if (e.classList.contains('handler')) {

            if (e.classList.contains('left')) {
                this.resizeSide = 'left';
            } else {
                this.resizeSide = 'width';
            }

            this.resizeStartEvent = event;
            this.resizeStartState = this.getState();
            this.dragging = true;
            document.addEventListener('mousemove', this.onDocumentMouseMove);
            document.addEventListener('mouseup', this.onDocumentMouseUp);
        }
    }

    get timeStart() {
        return this.rendering.getSlotRangeFromState(this.getState()).min.toString();
    }

    get timeEnd() {
        return this.rendering.getSlotRangeFromState(this.getState()).max.toString();
    }

    onDocumentMouseUp(event: MouseEvent) {
        document.removeEventListener('mousemove', this.onDocumentMouseMove);
        this.dragging = false;
    }

    onDocumentMouseMove(event: MouseEvent) {
        const state = this.rendering.getSlotDragPosition(
            this.resizeSide,
            event,
            this.resizeStartEvent,
            this.resizeStartState,
        );

        const e: HTMLElement = this.ref.nativeElement;

        if (this.rendering.isSlotAtEnd(state)) {
            e.classList.add('end');
        } else {
            e.classList.remove('end');
        }

        this.setState(state);
    }
}
