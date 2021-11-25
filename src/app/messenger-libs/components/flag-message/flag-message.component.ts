import {NotificationsService} from '../../../services/notifications';
import {Thread} from '../../core/models';
import {Component, ElementRef, Inject, Input, ViewChild} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {Backend} from '../../../lib/core/auth';

@Component({
    selector: 'learnt-flag-message',
    templateUrl: './flag-message.component.html',
    styleUrls: ['./flag-message.component.scss']
})
export class FlagMessageComponent {

    @Input()
    thread: Thread;

    @ViewChild('reason')
    public reason: ElementRef;

    sending: boolean;

    constructor(public dialogRef: MatDialogRef<FlagMessageComponent>,
                private notifications: NotificationsService,
                @Inject(MAT_DIALOG_DATA) thread: Thread,
                private backend: Backend) {
        this.thread = thread;
    }

    public cancel() {
        this.dialogRef.close();
    }

    public send() {
        this.sending = true;
        setTimeout(() => {
            this.sending = false;
            this.dialogRef.close();
            this.notifications.notify('Flag message', 'Your message has been sent to the server for verifying.');
        }, 3000);
    }
}
