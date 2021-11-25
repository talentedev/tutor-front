import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';

@Component({
    selector: 'learnt-button-option',
    templateUrl: './button-option.component.html',
    styleUrls: ['./button-option.component.scss']
})
export class ButtonOptionComponent {
    @Input() value: any;
    active: boolean;
    @Output() onClick = new EventEmitter<any>();

    constructor() {
    }
}
