import {Component, HostBinding, Input, OnInit} from '@angular/core';

@Component({
    selector: 'learnt-box',
    templateUrl: './box.component.html',
    styleUrls: ['./box.component.scss']
})
export class BoxComponent implements OnInit {

    @Input()
    headline: string;

    @HostBinding('style.padding')
    @Input()
    padding: string;

    @Input('content-paddings')
    contentPaddings: number;

    constructor() {
    }

    ngOnInit() {
        if (!this.padding) {
            this.padding = '20px';
        }
    }
}
