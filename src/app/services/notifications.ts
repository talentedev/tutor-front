import { User } from 'app/models';
import { Overlay, OverlayConfig } from '@angular/cdk/overlay';
import { ComponentPortal, DomPortalOutlet } from '@angular/cdk/portal';
import { ComponentRef, Injectable, ViewChild } from '@angular/core';
import { List } from 'immutable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { NotificationComponent } from '../common/notification/notification.component';
import { NotificationStackComponent } from '../common/notification/stack';
import { Backend } from '../lib/core/auth';
import { Notification } from '../models';
import { MicroEvents } from 'app/lib/core/common/events';
import _get from 'lodash-es/get';
import { ROUTE_LOGIN } from 'routes';

export class NotificationRef {
    constructor(public model: Notification,
                public ui: ComponentRef<NotificationComponent>,
                public stack: ComponentRef<NotificationStackComponent>) {
    }
}

@Injectable({providedIn: "root"})
export class NotificationsService extends MicroEvents {

    private _notifications: BehaviorSubject<List<Notification>> = new BehaviorSubject(List<Notification>());

    public readonly notifications: Observable<List<Notification>> = this._notifications.asObservable();

    private stackRef: ComponentRef<NotificationStackComponent>;

    constructor(private backend: Backend,
                public readonly overlay: Overlay) {
        super();
        this.createStack();
    }

    /**
     * Create the stack for regular notifications.
     */
    private createStack(): void {
        const state = new OverlayConfig({
            panelClass: "notifications-overlay-panel",
            hasBackdrop: false,
        });

        const overlayRef = this.overlay.create(state);
        overlayRef.overlayElement.classList.add('notifications');

        const portal = new ComponentPortal<NotificationStackComponent>(NotificationStackComponent);
        this.stackRef = overlayRef.attach(portal);
    }


    /**
     * Show a notification to the logged user. Wraps the settings and calls this.display
     * @param {string} title
     * @param {string} message
     * @param {string} icon
     * @param {number} lifetime
     * @param {boolean} sound
     * @return {NotificationRef}
     */
    notify(title: string, message: string, icon = 'bell', lifetime = 5000, sound = false): NotificationRef {
        // icon = icon || 'bell';
        // lifetime = lifetime || 5000;
        // sound = sound || false;
        return this.display(new Notification({title, message, icon}), lifetime, sound);
    }

    /**
     * Display the notification.
     * @param {Notification} n
     * @param {number} lifetime
     * @param {boolean} sound
     * @return {NotificationRef}
     */
    display(n: Notification, lifetime = 0, sound = true): NotificationRef {

        if (sound) {
            this.playSound();
        }

        const ui = this.stackRef.instance.push(n, lifetime);
        const nref = new NotificationRef(n, ui, this.stackRef);

        this._notifications.next(List<Notification>([n]));

        return nref;
    }

    public playSound(): void {
        const audio = new Audio('/assets/notification.wav');
        audio.play();
    }

    /**
     * Retrieves the notifications from the backend.
     * @return {Observable<any>}
     */
    public load(): Observable<any> {
        return new Observable(sub => {
            return this.backend.getNotifications().subscribe(response => {
                this._notifications.next(List<Notification>(response.items));
                sub.next();
            });
        });
    }

    /**
     * Removes a notification from the backend.
     * @param {Notification} notification
     * @return {Observable<any>}
     */
    public remove(notification: Notification): Observable<any> {
        return new Observable(sub => {
            if (notification === undefined || notification._id === undefined) {
                sub.next();
                sub.complete();
                return;
            }

            this.backend.deleteNotification(notification._id).subscribe(() => {
                const notifications = this._notifications.getValue();
                this._notifications.next(notifications.remove(notifications.indexOf(notification)));
                sub.next();
            }, (err) => sub.error(err), () => sub.complete());
        });
    }

    public removeAll(): Observable<any> {
        return new Observable(sub => {

            this.backend.deleteAllNotifications().subscribe(() => {
                const notifications = this._notifications.getValue();
                this._notifications.next(notifications.clear());
                sub.next();
            }, (err) => sub.error(err), () => sub.complete());
        });
    }

    public notifyNewUser(user: User): void{
        if(!_get(user, 'profile.avatar')){
            this.display(new Notification({
                title: 'Add Your Photo',
                message: 'Be sure to add a user photo so other members can see you!',
            }));
        }
        if(user.isStudent() && !_get(user, 'payments.cards')){
            this.display(new Notification({
                title: 'Add Your Payment Info',
                message: 'You haven\'t added payment information yet. Click Your Account and the card icon on the left to add a card.'
            }));
        }
    }
}
