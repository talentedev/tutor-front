import {Component, EventEmitter, OnInit} from '@angular/core';

@Component({
    selector: 'learnt-modal-alert',
    templateUrl: './new-modal-alert.component.html',
    styleUrls: ['./new-modal-alert.component.scss']
})
export class NewModalAlertComponent implements OnInit {

    title: string;

    message: string;

    buttons: any;

    result: EventEmitter<any> = new EventEmitter(true);

    closeButton: boolean;

    constructor() {
    }

    ngOnInit() {
    }

    eventListner(data) {
        this.result.next(data);
    }

}
