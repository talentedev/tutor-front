import { OverlayConfig } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ComponentRef, Injectable } from '@angular/core';
import { BookingPanelService } from 'app/common/booking-panels/service';
import { InstantRequestNotificationComponent } from 'app/common/notification/instant-request/instant-request.component';
import { TutorRateDialog } from 'app/common/tutor-rate/tutor-rate.component';
import { Auth, Backend } from 'app/lib/core/auth';
import { SocketEvent, SocketService, SocketServiceHandler } from 'app/lib/core/socket';
import { LessonNotificationType } from 'app/models/lesson';
import { Notification, Subject, User } from '../models';
import { NotificationsService } from './notifications';
import { AlertService } from './alerts';
import { differenceInDays } from "date-fns";
import { environment } from "../../environments/environment";
import _get from 'lodash-es/get';
import { interval } from "rxjs";
import { map, filter, take, first } from "rxjs/operators";


@Injectable({providedIn: "root"})
export class LessonNotificationService implements SocketServiceHandler {

  private instantRequest: ComponentRef<InstantRequestNotificationComponent>;

  hideInstantRequest: () => void;
  private me: User;
  private allowInstantSessionRequsts: boolean;

  constructor(
    private panels: BookingPanelService,
    private notifications: NotificationsService,
    private alerts: AlertService,
    private backend: Backend,
    private socket: SocketService,
    private auth: Auth,
    private tutorRateDialog: TutorRateDialog) {
    this.allowInstantSessionRequsts = true;
    this.auth.me.subscribe(me => this.me = me);
    socket.register('notification', this);
    socket.register('instant', this)
  }

  onSocketEvent(event: SocketEvent): void {
    // survey
    if (event.type === 'form_opened') {
      this.auth.refresh();
      return;
    }

    if (event.type === 'instant.request' && this.allowInstantSessionRequsts) {
      return this.showInstantSessionRequestDialog(
        new User(event.data.get('student')),
        new Subject(event.data.get('subject')),
        event.data.get("timeout"),
      );
    }

    if (event.type === 'instant.timeout') {
      this.hideInstantRequest && this.hideInstantRequest()
    }

    if (event.type !== 'notification' || window.location.pathname.indexOf('/class') === 0) {
      // only interested in notifications while not in a class
      return;
    }

    const notification = new Notification(event.data.get('notification'));
    
    switch (notification.type) {
      case LessonNotificationType.LessonChangeRequest:

        this.notifications.display(notification);
        this.panels.openReschedulePanel(
          notification.data.lesson,
          notification,
        )

        break;
      case LessonNotificationType.LessonCompleteReview:
        this.showSurvey()
        break;
      case LessonNotificationType.LessonChangeRequestAccepted:
      case LessonNotificationType.LessonChangeRequestDeclined:

        this.notifications.display(notification);
        this.panels.openLessonChangeNotificationPanel(
          notification,
        )

        break;
      default: // regular notification
        this.notifications.display(notification);
    }
  }

  showInstantSessionRequestDialog(student: User, subject: Subject, timeout: number): void {

    if (timeout < 0) {
      return;
    }

    const title = 'Instant Session Request';
    const message = `${student.shortName} requested an instant session for ${subject.name} lesson`;

    this.notifications.playSound();
    const overlayState = new OverlayConfig();
    overlayState.hasBackdrop = true;

    const overlayRef = this.notifications.overlay.create(overlayState);
    overlayRef.overlayElement.classList.add('instant-notifications');

    const portal = new ComponentPortal<InstantRequestNotificationComponent>(
      InstantRequestNotificationComponent
    );

    const ref: ComponentRef<InstantRequestNotificationComponent> = overlayRef.attach(portal);

    ref.instance.setState(title, message, true, timeout)
    ref.changeDetectorRef.detectChanges()

    var destroy = () => {
      ref.destroy();
      overlayRef.dispose()
    };

    this.hideInstantRequest = destroy;

    ref.instance.close.subscribe(() => { destroy() });

    ref.instance.accept.pipe(first()).subscribe(() => {
      destroy()
      this.backend.acceptInstantSession().subscribe().unsubscribe();
    });

    ref.instance.decline.pipe(first()).subscribe(() => {
      destroy()
      this.backend.declineInstantSession().subscribe().unsubscribe();
    });
  }

  /**
   * loads NativeForms survey form after a session and only if survey_last_opened_at has been a month ago
   * @private
   */
  showSurvey() {
    const now = new Date();
    if (!this.me) {
      return;
    }
    let lastSurvey = new Date(null);
    for(const formName in _get(this.me, 'surveys', {})) {
      const dateString = _get(this.me, `surveys.${formName}.opened_at`);
      if (dateString) {
        lastSurvey = new Date(dateString);
        break;
      }
    }
    if (differenceInDays(now, lastSurvey) > environment.SURVEY_DAYS_RECURRENT) {
      window["nativeForms"] = {
        license: environment.NATIVEFORMS_LICENSE,
        widgetId: "1",
        email: this.me.email,
        name: this.me.name,
      }
      
      const script = document.createElement("script");
      script.src = "https://script.nativeforms.com/main.js";
      script.onload = (): void => {
        const sub = interval(1000)
            .pipe(
                map(() => document.getElementById('native_forms_widget-1')),
                filter(Boolean),
                take(1),
            )
            .subscribe((widget: HTMLDivElement) => {
              const button = widget.querySelector('[role="button"]') as HTMLDivElement;
              button.click();
            });
        setTimeout(() => sub.unsubscribe(), 10000);
      }
      document.body.appendChild(script);
    }
  }
  
  disableInstantSessionRequest(): void { 
    this.allowInstantSessionRequsts = false;
  }
  
  enableInstantSessionRequest(): void { 
    this.allowInstantSessionRequsts = true;
  }
}
