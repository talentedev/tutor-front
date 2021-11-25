import { GlobalPositionStrategy, Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal, ComponentType } from '@angular/cdk/portal';
import { ComponentRef, Injectable, Injector, Inject } from '@angular/core';
import { PanelNavigation } from './panels';
import { AddCardPanelComponent } from './add-card/add-card-panel.component';
import { BookingPanelComponent } from './booking/booking-panel.component';
import { InstantBookingPanelComponent } from './instant-booking/instant-booking-panel.component';
import { LoginPanelComponent } from './login/login-panel.component';
import { LessonChangeNotificationPanelComponent } from './notification/lesson-change-notification-panel.component';
import { PanelData, SidePanel } from './panel';
import { RecoverPasswordPanelComponent } from './recover-password/recover-password-panel.component';
import { ReschedulePanelComponent } from './reschedule/reschedule-panel.component';
import { SignUpPanelComponent } from './sign-up/sign-up-panel.component';
import { Notification, User } from 'app/models';
import { Lesson } from 'app/models/lesson';
import { MicroEvents } from 'app/lib/core/common/events';
import { NotificationsService } from 'app/services/notifications';
import { ActivationStart, NavigationStart, Router, RouterEvent } from '@angular/router';
import { Auth } from '../../lib/core/auth';

type PanelOverlay<T> = {
    overlayRef: OverlayRef
    componentRef: ComponentRef<T>
    instance: T & SidePanel;
    destroy: () => void
}

@Injectable({ providedIn: 'root' })
export class BookingPanelService {

    private readonly overlayState: OverlayConfig;

    private panels: any[] = [];

    private _globals: PanelData = new PanelData();
    get globals(): PanelData {
        return this._globals;
    }

    private me: User | null;

    constructor(private overlay: Overlay, @Inject('bus')
                private bus: MicroEvents,
                private notifications: NotificationsService,
                private route: Router,
                private auth: Auth) {
        this.auth.me.subscribe(me => {
            this.me = me;
        });

        this.overlayState = new OverlayConfig({
            panelClass: 'booking-overlay-panel',
            hasBackdrop: true,
        });

        this.route.events.subscribe((event: RouterEvent) => {
            if (event instanceof NavigationStart) {
                this.close();
            }
        });

        bus.on('panels.open.booking', this.openBookingPanel.bind(this));
        bus.on('panels.open.add_card', this.openCreditCardPanel.bind(this));

        bus.on('panels.globals', (globals: any) => {
            for (const key in globals) {
                this.globals.set(key, globals[key]);
            }
        });

        bus.on('panels.close', () => this.close());
    }

    /**
     * Navigate to another panel
     * @param to PanelNavigation
     */
    navigate(to: PanelNavigation, data?: PanelData) {

        switch (to) {
            case 'login':
                this.openLoginPanel();
                break;
            case 'signup':
                this.openSignupPanel();
                break;
            case 'recover_password':
                this.openRecoverPasswordPanel();
                break;
            case 'instant_booking':
                // this.openInstantSessionPanel();
                break;
            case 'add_card':
                // this.openCreditCardPanel();
                break;
            case 'booking':
                // this.openBookingPanel(data);
                break;
            case 'lesson_change_notification':
                // this.openLessonChangeNotificationPanel();
                break;
        }

        throw new Error(`Trying to navigate to undefined panel '${to}'`);
    }

    /**
     * Create a new panel overlay
     * @param component ComponentType<T>
     * @param data Data for panel
     */
    open<T>(component: ComponentType<T>, data?: PanelData): PanelOverlay<T> {
        if (data) {
            data.merge(this.globals);
        }

        const portal = new ComponentPortal(component, null);
        const oref = this.overlay.create(this.overlayState);
        const ref = oref.attach(portal);

        const instance = ref.instance as any;
        const panel: T & SidePanel = instance;

        panel.setVisibility(true);

        const destroy = () => {
            panel.clearEvents();
            panel.setVisibility(false);
            setTimeout(() => {
                oref.dispose();
                ref.destroy();
            }, 1000);
        };

        panel.on('close', () => destroy());

        oref.backdropClick().subscribe(() => {
            destroy();
        });

        if (data) {
            panel.onData(data);
            ref.changeDetectorRef.detectChanges();
        }

        panel.on('navigate', (to: PanelNavigation) => {
            destroy();
            this.navigate(to);
        });

        this.panels.push(destroy);

        return {
            overlayRef: oref,
            componentRef: ref,
            destroy: destroy,
            instance: panel,
        };
    }

    close() {
        this.panels.forEach(destroy => destroy());
    }

    async openBookingPanel(tutor: User, lesson?: Lesson): Promise<void> {
        if (!this.me) {
            await this.auth.refresh();
        }

        if (!tutor.isTutor()) {
            throw new Error('Must be tutor to book');
        }

        return new Promise((resolve, reject) => {
            console.log('will open', this.me, tutor);
            if (this.me._id === tutor._id) {
                resolve();
                return;
            }
            const ref = this.open(BookingPanelComponent, new PanelData({
                tutor: tutor,
                lesson: lesson,
            }));
            ref.instance.on('complete', () => {
                resolve();
                ref.destroy();
            });
        });
    }

    openLoginPanel(): Promise<void> {
        return new Promise((resolve, reject) => {
            const ref = this.open(LoginPanelComponent);
            ref.instance.on('complete', () => {
                resolve();
                ref.destroy();
            });
        });
    }

    openSignupPanel() {
        this.open(SignUpPanelComponent);
    }

    openRecoverPasswordPanel() {
        return this.open(RecoverPasswordPanelComponent);
    }

    openCreditCardPanel(tutor: User) {
        // tutor
        this.open(AddCardPanelComponent);
    }

    async openInstantSessionPanel(tutor: User): Promise<void> {
        if (!this.me) {
            await this.auth.refresh();
        }

        if (!tutor.isTutor()) {
            throw new Error('Must be tutor to book');
        }


        if (!tutor.tutoring.instant_session) {
            throw new Error('Tutor does not accept instant session');
        }

        if (tutor.online === 0) {
            throw new Error('Tutor is not online');
        }

        if (!this.me) {
            await this.openLoginPanel();
            return;
        }

        if (!this.me.cc) {
            this.openCreditCardPanel(tutor);
            return;
        }

        if (this.me._id === tutor._id) {
            return;
        }

        const data = new PanelData({ tutor });

        const ref = this.open(InstantBookingPanelComponent, data);

        const sub = ref.overlayRef.backdropClick().subscribe(() => {
            if (ref.instance.requestMade) {
                sub.unsubscribe();
                this.notifications.notify(
                    `Instant session request`,
                    `You'll be notified when tutor responds to your request`,
                );
            }
        });
    }

    openReschedulePanel(lesson: Lesson, notification?: Notification) {
        this.open(ReschedulePanelComponent, new PanelData({
            lesson,
            notification,
        }));
    }

    openLessonChangeNotificationPanel(notification: Notification) {
        this.open(LessonChangeNotificationPanelComponent);
    }
}
