import { Component, Inject, OnDestroy, ViewChild, ViewContainerRef } from '@angular/core';
import { SocketService, SocketEvent, SocketServiceHandler } from 'app/lib/core/socket';
import { Auth, Backend, BACKEND_HOST } from '../../../lib/core/auth';
import { User } from '../../../models';
import { NotificationsService } from '../../../services/notifications';
import { PanelData, SidePanel } from '../panel';
import { filter, take, first } from "rxjs/operators";
import { addMinutes } from "date-fns";
import { Subscription } from "rxjs";

@Component({
    templateUrl: './instant-booking-panel.component.html',
    styleUrls: ['../booking-panel.scss', './instant-booking-panel.component.scss']
})
export class InstantBookingPanelComponent extends SidePanel implements  SocketServiceHandler, OnDestroy {
    
    public loading: boolean;
    public state: '' | 'waiting' = '';

    // Panel data
    public tutor: User;
    subject: any;

    skipCloseNotification: boolean;
    requestMade: boolean;
    private subs: Subscription;

    constructor(private notifications: NotificationsService,
                private backend: Backend,
                private auth: Auth,
                private socket: SocketService,
                @Inject(BACKEND_HOST) private _host: string,
    ) {
        super();
        this.subs = new Subscription();
        this.socket.register('instant', this);
    }

    onData(data: PanelData) {
        data.apply(this, "tutor");
    }

    onSubjectChange(event) {
        this.subject = event.value
    }

    onSocketEvent(event: SocketEvent) {

        if (event.type === 'instant.timeout') {
            this.skipCloseNotification = true;
            this.close()
        }

        if (event.type === 'instant.deny') {
            this.skipCloseNotification = true;
            this.close()
        }
    }

    ngOnDestroy() {
        this.socket.unregister(this)
    }

    /**
     * Request an instant lesson.
     */
    public requestLesson(): void {
        this.loading = true;
        const from = addMinutes(new Date(), 0);
        const to = addMinutes(from, 60);

        this.subs.add(this.backend.isAvailable(this.tutor, from.toISOString(), to.toISOString())
            .pipe(first()).subscribe(available => {
                if (!available) {
                    this.skipCloseNotification = true;
                    this.notifications.notify("Can't start instant session", "Tutor is unavailable at this time.", "user")
                    this.close();
                } else {
                    this.auth.me.pipe(filter(Boolean), take(1)).subscribe((me: User) => {
                        this.backend.requestInstantSession(me._id, this.tutor._id, this.subject._id).pipe(first()).subscribe((response: any) => {
                            this.requestMade = true;
                            this.loading = false;
                            this.state = 'waiting';
                        }, (response: any) => {
                            this.skipCloseNotification = true;
                            const title = 'Can\'t start instant session';
                            this.notifications.notify(title, response.error.error, 'user');
                            this.close()
                        });
                    });
                    
                }
            })
        ); 
    }

    close() {
        super.close();
        if (!this.skipCloseNotification && this.requestMade) {
            this.notifications.notify(
                `Instant session request`,
                `You'll be notified when tutor responds to your request`
            );
        }
    }
}
