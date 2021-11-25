import {Component, EventEmitter, HostBinding, HostListener, Output} from '@angular/core';
import {Notification} from '../../models';

@Component({
    selector: 'learnt-notification',
    templateUrl: './notification.component.html',
    styleUrls: ['./notification.component.scss']
})
export class NotificationComponent {

    click: EventEmitter<any> = new EventEmitter();

    n: Notification;

    @HostBinding('class.actionable')
    actionable: boolean;

    @Output()
    dismiss: EventEmitter<any> = new EventEmitter(true);

    constructor() {
    }

    close(event: MouseEvent) {
        event.stopPropagation();
        this.dismiss.next();
    }

    set notification(n: Notification) {
        this.n = n;
        this.actionable = n.action !== '';
    }

    @HostListener('click', ['$event'])
    onNotificationClick() {
        this.click.next();
        this.dismiss.next();
    }
}
