import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { AddToCalendarService } from 'app/services/add-to-calendar.service';
import { SidePanel } from '../panel';
import { Auth } from '../../../lib/core/auth';
import { Notification, User } from '../../../models';
import { PanelData } from '../panel';
import { LessonNotificationType } from 'app/models/lesson';

@Component({
    selector: 'learnt-notification-panel',
    templateUrl: './lesson-change-notification-panel.component.html',
    styleUrls: ['../booking-panel.scss', './lesson-change-notification-panel.component.scss']
})
export class LessonChangeNotificationPanelComponent extends SidePanel implements OnInit {

    @ViewChild('panel', {read: ViewContainerRef})
    panel: ViewContainerRef;
    
    public loading: boolean;
    public accepted: boolean;

    public notification: Notification;
    public me: User;

    public calendarLinks: any;

    constructor(private auth: Auth,
                private addToCalendarService: AddToCalendarService
                ) {
        super();
    }

    onData(data: PanelData) {
        data.apply(this, "notification")
        this.accepted = this.notification.type == LessonNotificationType.LessonChangeRequestAccepted
    }

    ngOnInit(): void {
        
        this.loading = true;

        const lesson = this.notification.data.lesson;

        this.auth.me.subscribe((u: User) => {
            this.me = u;
            this.loading = false;
        });

        const event = {
            title: 'Class with Learnt',
            start: lesson.starts_at,
            end: lesson.ends_at
        }

        this.calendarLinks = this.addToCalendarService.generateCalendarEvent(event);
    }
}
