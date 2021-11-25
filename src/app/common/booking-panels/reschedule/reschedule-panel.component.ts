import { Component, EventEmitter, Injector, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Auth, Backend } from '../../../lib/core/auth';
import { MEET_IN_PERSON, MEET_ONLINE, Notification, User } from '../../../models';
import { Lesson, LessonChangeProposal } from '../../../models/lesson';
import { AlertService } from '../../../services/alerts';
import { NotificationsService } from '../../../services/notifications';
import { PanelData, SidePanel } from '../panel';
import { BookingPanelService } from '../service';

@Component({
    selector: 'learnt-reschedule-panel',
    templateUrl: './reschedule-panel.component.html',
    styleUrls: ['../booking-panel.scss', './reschedule-panel.component.scss']
})
export class ReschedulePanelComponent extends SidePanel implements OnInit {

    @ViewChild('panel', {read: ViewContainerRef})
    panel: ViewContainerRef;

    public loading: boolean;
    public sending: boolean;

    public changeRequest: LessonChangeProposal;
    private notifications: NotificationsService;

    private notification: Notification
    public lesson: Lesson;
    private me: User;

    constructor(private backend: Backend,
                private alerts: AlertService,
                private injector: Injector,
                private auth: Auth) {
        super();
        this.notifications = this.injector.get(NotificationsService);
        this.auth.me.subscribe((u: User) => this.me = u);
    }

    onData(data: PanelData) {

        data.apply(this, "lesson", "notification")

        this.backend.getLesson(this.lesson._id, this.me).subscribe(lesson => {

            this.lesson = lesson

            if (this.lesson.EveryoneAccepted) {
                this.removeNotification();
                this.close();
                this.notifications.notify('Lesson proposal', 'Nothing new to accept at this moment.', 'calendar');
            }

            const proposals = this.lesson.change_proposals;
            this.changeRequest = new LessonChangeProposal({...proposals[proposals.length - 1], zone: this.me.timezone});

            this.loading = false;
        });
    }

    ngOnInit(): void {
        this.loading = true;
    }

    public get user(): User {

        if (this.lesson.tutor._id === this.changeRequest.user._id) {
            return this.lesson.tutor;
        }

        for (const student of this.lesson.students) {
            if (student._id === this.changeRequest.user._id) {
                return student;
            }
        }
    }

    public get location(): string {
        if (this.changeRequest.meet === MEET_IN_PERSON) {
            return this.changeRequest.location;
        } else if (this.changeRequest.meet === MEET_ONLINE) {
            return 'Online';
        }
    }

    public approveChange(): void {
        this.backend.acceptLessonChange(this.lesson._id).subscribe(() => {
            this.alerts.alert('Lesson updated', 'Successfully approved lesson change proposal');
            this.removeNotification();
        }, (error: HttpErrorResponse) => {
            this.alerts.alert('Couldn\'t update lesson', 'Couldn\'t update lesson, please try again later.');
        }, () => {
            this.close();
        });
    }

    public cancelLesson(): void {
        const alertOpts = {lifetime: 0, buttons: [{label: 'Yes', result: true}, {label: 'No', result: false}]};
        const alertMessage = 'Are you sure you want to cancel the lesson? This can\'t be undone.';
        const alert = this.alerts.alert('Decline lesson change', alertMessage, alertOpts);

        alert.result.subscribe(res => {
            if (res === true) {
                this.backend.declineLessonChange(this.lesson._id).subscribe(() => {
                    this.alerts.alert('Lesson cancelled', 'Successfully cancelled lesson');
                    this.removeNotification();
                }, (error: HttpErrorResponse) => {
                    this.alerts.alert('Couldn\'t cancel lesson', 'Couldn\'t cancel lesson, please try again later.');
                }, () => this.close());
            }
            alert.dispose();
        });
    }

    private removeNotification(): void {
        this.notifications.remove(this.notification).subscribe(
            () => true, // data
            (err: HttpErrorResponse) => console.log('[!] Error removing notification', err));
    }
}
