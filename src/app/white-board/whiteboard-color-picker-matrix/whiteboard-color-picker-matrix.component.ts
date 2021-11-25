import { Component, Output, EventEmitter, HostListener, OnInit } from '@angular/core';

@Component({
    selector: 'learnt-whiteboard-color-picker-matrix',
    templateUrl: './whiteboard-color-picker-matrix.component.html',
    styleUrls: ['./whiteboard-color-picker-matrix.component.scss']
})
export class WhiteboardColorPickerMatrixComponent implements OnInit {

    colors = [
        '#111111',
        '#FFCD00',
        '#FF6600',
        '#0000F0',
        '#1BBBFF',
        '#9800E9',
        '#00C300',
        '#58FA73',
        '#A05100',
        '#FD0000',
        '#FB00F2',
        '#666666'
    ];

    color: string;

    @Output()
    change: EventEmitter<string> = new EventEmitter();

    constructor() {}

    ngOnInit() {}

    @HostListener('click', ['$event'])
    onColorClick(event: MouseEvent) {
        const e: HTMLElement = <HTMLElement> event.target;
        const color = e.dataset.color;
        this.color = color;
        this.change.next(color);
    }
}
