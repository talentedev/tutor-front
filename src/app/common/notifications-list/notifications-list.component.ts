import { Component, EventEmitter, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Backend, PaginatedItems } from '../../lib/core/auth';
import { Notification } from '../../models';
import { NotificationsService } from '../../services/notifications';
import { BookingPanelService } from '../booking-panels/service';
import { TutorRateDialog } from '../tutor-rate/tutor-rate.component';
import { LessonNotificationType } from 'app/models/lesson';
import { AlertOptions, AlertService } from '../../services/alerts';

@Component({
    selector: 'learnt-notifications-list',
    templateUrl: './notifications-list.component.html',
    styleUrls: ['./notifications-list.component.scss']
})
export class NotificationsListComponent implements OnInit, OnDestroy {

    @Input()
    public counter = true;

    @Input()
    public paginated = false;

    @Input()
    public padding = '20px';

    @Input()
    public limit = 10;

    public pageNum = 0;

    public count = 0;

    public loading: boolean;

    public notifications: Notification[] = [];

    public onCompleteDisplay: EventEmitter<any> = new EventEmitter(true);

    public deletingAll: boolean = false;

    private s: Subscription[] = [];

    constructor(private service: NotificationsService,
                private backend: Backend,
                private panels: BookingPanelService,
                private tutorRateDialog: TutorRateDialog,
                private alerts: AlertService) {
    }

    ngOnInit(): void {
        this.s.push(this.service.notifications.subscribe(n => this.get()));

        this.s.push(this.service.load().subscribe(() => {
            this.loading = false;
            this.onCompleteDisplay.next();
        }, () => {
            this.loading = false;
            this.onCompleteDisplay.next();
        }));
    }

    /**
     * Unsubscribe all subscriptions encountered during lifetime.
     */
    ngOnDestroy(): void {
        this.s.forEach(s => s.unsubscribe());
    }

    public getPage(p: number): void {
        const offset = p * this.limit;
        this.pageNum = p;
        this.get(offset);
    }

    public get pages(): number {
        return Math.ceil(this.count / this.limit);
    }

    /**
     * Retrieve the notifications
     */
    private get(offset: number = 0): void {

        const subscription = this.backend.getNotifications(offset, this.limit).subscribe((res: PaginatedItems<Notification>) => {

            const deletingNotifications = this.notifications.filter(n => n.deleting);
            
            this.notifications = [];
            if (res.items === null || res.items.length === 0) {
                this.count = 0;
                return;
            }

            (<any[]>res.items).forEach(n => {
                n.deleting = deletingNotifications.findIndex(d => d._id === n._id) !== -1;
                this.notifications.push(new Notification(n));
            });
            this.count = res.length;

            subscription.unsubscribe();
        });
    }

    /**
     * Delete notification
     */
    public remove(notification: Notification, event: MouseEvent): void {
        event.stopPropagation();
        notification.deleting = true;
        const removal = this.service.remove(notification).subscribe(() => {
            const indexOf = this.notifications.indexOf(notification);
            if (indexOf > -1) {
                this.notifications.splice(indexOf, 1);
            }
            this.count--;
            removal.unsubscribe();
        });
    }

    public rateTutor(n: Notification): void {
        this.tutorRateDialog.show(n.data.user);
    }

    public openPanel(n: Notification, type: number): void {
        switch (type) {
            case LessonNotificationType.LessonChangeRequest:
                this.panels.openReschedulePanel(n.data.lesson, n);
                break;
            case LessonNotificationType.LessonChangeRequestAccepted:
            case LessonNotificationType.LessonChangeRequestDeclined:
                this.panels.openLessonChangeNotificationPanel(n)
                break;
        }
    }

    public clearAll() {
        const alertOpts = {lifetime: 0, buttons: [{label: 'Yes', result: true}, {label: 'No', result: false}]};
        const alertMessage = 'Are you sure you want to clear all new notifications?';
        const alert = this.alerts.alert('Clear all notifications', alertMessage, alertOpts);

        alert.result.subscribe(res => {
            
            if (res === true) {
                this.deletingAll = true;
                const removal = this.service.removeAll().subscribe(() => {
                    this.notifications = [];
                    this.count = 0;
                    this.deletingAll = false;
                    removal.unsubscribe();
                });
            }

            alert.dispose();
        });
    }

    log(n: Notification): void {
        console.log(n);
    }
}
