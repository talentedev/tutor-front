import { Component, EventEmitter } from '@angular/core';

@Component({
    selector: 'learnt-instant-request-notification',
    templateUrl: './instant-request.component.html',
    styleUrls: ['./instant-request.component.scss']
})
export class InstantRequestNotificationComponent {
    
    public readonly close: EventEmitter<void> = new EventEmitter();
    public readonly accept: EventEmitter<void> = new EventEmitter();
    public readonly decline: EventEmitter<void> = new EventEmitter();

    public title: string;
    public message: string;
    public controls: boolean;
    public timeout: number;

    private intv: any;

    setState(title: string, message: string, controls: boolean, timeout: number) {

        this.title = title;
        this.message = message;
        this.controls = controls;
        this.timeout = parseInt(timeout.toFixed());

        this.intv = setInterval(() => {
            this.timeout--;
            if (this.timeout === 0) {
                clearInterval(this.intv);
                this.close.next();
                this.close.complete();
            }
        }, 1000);
    }

    acceptRequest() {
        this.accept.next()
        this.accept.complete();
    }

    declineRequest() {
        this.decline.next()
        this.decline.complete();
    }
}
