import { Overlay, OverlayConfig } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ComponentFactoryResolver, ComponentRef, Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Rx';
import { environment } from '../../environments/environment';
import { TimezoneSidePopupComponent } from '../common/timezone-side-popup/timezone-side-popup.component';
import { Auth, Backend } from '../lib/core/auth';
import { Logger } from '../lib/core/common/logger';
import { SocketService } from '../lib/core/socket';
import { MessengerService, OnMessageCreate } from '../messenger-libs/core/messenger.service';
import { Thread } from '../messenger-libs/core/models';
import { Upload, User } from '../models';
import { AlertRef, AlertService } from './alerts';
import { MessengerFrontService } from './messenger';
import { NotificationsService } from './notifications';
import { take } from "rxjs/operators";
import { Token } from "../lib/core/auth/common"

@Injectable({ providedIn: 'root' })
export class AccountService {

    private me: User;
    private messengerSubscription: Subscription;
    private messengerService: MessengerService;
    private recipient: string;
    private subs: Subscription;

    constructor(private auth: Auth,
                private backend: Backend,
                private router: Router,
                private logger: Logger,
                private alerts: AlertService,
                private overlay: Overlay,
                private SocketService: SocketService,
                private injector: Injector,
                private componentFactoryResolver: ComponentFactoryResolver,
                private messenger: MessengerFrontService,
                private notifications: NotificationsService) {
        this.auth.me.subscribe((me: User) => this.me = me);
        this.subs = new Subscription();
    }

    upload(file: File, context: string): Promise<Upload> {
        return new Promise((resolve, reject) => {
            const data = new FormData();
            data.append('file', file);
            data.append('context', context);
            this.backend.upload(data).subscribe(upload => {
                resolve(upload);
            }, err => reject(err));
        });
    }

    setAvatar(user: User, avatar: File): Promise<any> {
        // TODO: Check if is correct file
        return this.upload(avatar, 'avatars').then(upload => {
            return new Promise((resolve, reject) => {
                this.backend.setAvatar(upload).subscribe(response => {
                    user.profile.avatar = upload;
                    resolve();
                }, err => reject(err));
            });
        });
    }

    /**
     * Save user timezone
     * @param timezone
     */
    setTimezone(timezone: string): Observable<any> {
        return new Observable(sub => {
            this.backend.updateCurrentUser({timezone}).subscribe(me => {
                this.me.timezone = timezone;
                sub.next();
                sub.complete();
            }, err => sub.error(err));
        });
    }

    /**
     * Login functionality
     * @param raw Login object
     */
    login(raw: any): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!raw.email || !raw.password) {
                const alert = this.alertAuthFailed();
                alert.result.subscribe(res => {
                    if (res === true) {
                        alert.dispose();
                    }
                });
                return reject();
            }

            this.auth.login(raw.email, raw.password).then(resolve).catch(() => {
                const alert = this.alertAuthFailed();
                alert.result.subscribe(
                    result => {
                        if (result === true) {
                            alert.dispose();
                        }
                    }
                );
                reject();
            });
        });
    }

    /**
     * Google Login functionality
     * @param raw Login object
     */
    googleLogin(code: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!code) {
                const alert = this.alertAuthFailed();
                alert.result.subscribe(res => {
                    if (res === true) {
                        alert.dispose();
                    }
                });
                return reject();
            }

            this.auth.googleLogin(code).then(resolve).catch(() => {
                const alert = this.alertAuthFailed();
                alert.result.subscribe(
                    result => {
                        if (result === true) {
                            alert.dispose();
                        }
                    }
                );
                reject();
            });
        });
    }

    /**
     * social Login functionality
     * @param raw Login object
     */
    socialLogin(token: Token): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!token) {
                const alert = this.alertAuthFailed();
                alert.result.subscribe(res => {
                    if (res === true) {
                        alert.dispose();
                    }
                });
                return reject();
            }

            this.auth.socialLogin(token).then(resolve).catch(() => {
                const alert = this.alertAuthFailed();
                alert.result.subscribe(
                    result => {
                        if (result === true) {
                            alert.dispose();
                        }
                    }
                );
                reject();
            });
        });
    }

    private alertAuthFailed(): AlertRef {
        return this.alerts.alert(
            'Authentication',
            'Authentication failed. Please try again!',
            {
                lifetime: 0,
                backdropClose: true,
                buttons: [
                    {label: 'OK', result: true}
                ]
            }
        );
    }

    init() {
        this.initPostAuth();
    }

    getCurrentInboxThread(): string | boolean {
        const path = window.location.pathname + '';

        if (path.indexOf('/main/inbox') === -1) {
            return false;
        }

        const parts = path.split('/');

        if (parts.length !== 3) {

            if (this.messengerService.thread) {
                return this.messengerService.thread._id;
            }

            return '';
        }

        return parts[2];
    }

    private initInbox(): void {
        if (this.messengerSubscription && !this.messengerSubscription.closed) {
            return;
        }

        this.messengerSubscription = this.messenger.load().subscribe(mod => {
            this.messengerService = this.injector.get(MessengerService);

            this.subs.add(this.messengerService.onMessageCreate.subscribe((m: OnMessageCreate) => {
                // Do not show notification if user already present on conversation
                if (this.getCurrentInboxThread() === m.thread._id) {
                    return;
                }

                // Do not show notification for sender
                if (m.message.sender._id === this.me._id) {
                    return;
                }

                if (window.location.pathname.indexOf('/class') === 0) {
                    return;
                }

                this.messengerService.getThreadById(m.message.thread).subscribe((t: Thread) => {
                    let sender: string = t.participants[1].profile.first_name + ' ' + t.participants[1].profile.last_name;
                    if (this.messengerService.me._id === t.participants[0]._id) {
                        sender = t.participants[1].profile.first_name;
                    } else {
                        sender = t.participants[0].profile.first_name;
                    }
                    const title = `Message from ${sender}`;

                    const notificationRef = this.notifications.notify(title, m.message.text(40), 'user', 10000, true);
                    if (location.pathname.indexOf('/class/') === -1) {
                        // make notification clickable if not into a class
                        notificationRef.ui.instance.click.first().subscribe(() => this.router.navigate(['/main/inbox', m.thread._id]));
                    }
                });

                this.messengerService.updateCounts();
            }));
        });
    }

    private initIntercom(loggedin: boolean): void {
        // break out if we have turned off intercom via query params
        if (window.location.search && window.location.search.includes('intercom')) {
            return;
        }

        // load intercom using the user details above
        if (window.Intercom) {
            if (loggedin) {
                const group = this.me.isTutor() ? 'tutors' : (
                    this.me.isStudent() ? 'students' : (
                        this.me.isAffiliate() ? 'affiliates' : ''
                    )
                );
                if (group) {
                    window.Intercom('boot', {
                        email: this.me.email,
                        name: this.me.name,
                        external_id: this.me._id,
                        phone: this.me.profile.telephone,
                        app_id: environment.INTERCOM_APP_ID,
                        profile: `${environment.HOST}/admin/${group}/${this.me._id}`,
                        last_seen: Math.floor(new Date().getTime() / 1000),
                        widget: {
                          activator: '#IntercomDefaultWidget'
                        }
                     });
                }
            }
        } else {
            // if the intercome library hasn't loaded try again after 2 seconds
            setTimeout(() => this.initIntercom(loggedin), 2000);
        }
    }

    private initPostAuth() {

        // TODO: Remove this subscribe
        // Since the auth.change doesn't always seem to fire on page load
        // we are using the auth.me as a backup for the meantime.
        this.auth.me.subscribe((me: User) => {
            if (me === null || me === undefined) {
                return;
            }
            this.me = me;
            this.SocketService.connect();
            this.initIntercom(true);
            this.initInbox();
        });
    }


    changeTimezone(): Observable<any> {
        return new Observable(sub => {
            const state = new OverlayConfig();
            state.hasBackdrop = true;
            const overlay = this.overlay.create(state);

            const injector = Injector.create({
                providers: [
                    {provide: 'account', useValue: this},
                ],
                parent: this.injector,
            });

            const portal = new ComponentPortal<TimezoneSidePopupComponent>(TimezoneSidePopupComponent, null, injector);
            const componentRef: ComponentRef<TimezoneSidePopupComponent> = overlay.attach(portal);

            componentRef.instance.onClose.pipe(take(1)).subscribe(() => {
                overlay.dispose();
            });

            componentRef.instance.onSelect.pipe(take(1)).subscribe((timezone) => {
                sub.next(timezone);
                sub.complete();
                this.setTimezone(timezone.zone).subscribe();
            });

            this.subs.add(overlay.backdropClick().subscribe(() => {
                componentRef.instance.close();
                sub.complete();
            }));
        });
    }

    unsubscribe() {
        this.subs.unsubscribe();
    }
}
