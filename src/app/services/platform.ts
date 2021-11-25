import { Injectable, Injector, Inject } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
import { SocketEvent, SocketService, SocketServiceHandler } from 'app/lib/core/socket';
import { Observable } from 'rxjs/Observable';
import { Backend } from '../lib/core/auth';
import { MicroEvents } from 'app/lib/core/common/events';
import { NotificationsService } from './notifications';

@Injectable({providedIn:'root'})
export class Platform implements Resolve<any>, SocketServiceHandler {

    private settings: any = {};
    private 
    constructor(
        private backend: Backend,
        private router: Router,
        sockets: SocketService,
        private notifications: NotificationsService,
        @Inject('bus') private bus: MicroEvents,
    ) {
        sockets.register('instant', this);
    }

    onSocketEvent(event: SocketEvent): void {
        if (event.type === 'instant.start') {
            this.bus.emit('panels.close')
            this.router.navigateByUrl(`/main/class/${event.data.get('room')}`);
        }
        
        if (event.type === 'instant.deny') {
            this.notifications.notify('Session cancelled','Instant session request was declined.', 'user');
        }

        if (event.type === 'instant.timeout') {
            this.notifications.notify(
                `Instant session request timeout`,
                `Tutor didn't answer to your request`
              );
        }
    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
        return new Observable(sub => {
            this.backend.getPlatformUISettings().subscribe(
                settings => {
                    for (const setting of settings) {
                        this.settings[setting.name] = setting.value;
                    }
                    sub.next(this.settings);
                    sub.complete();
                }
            );
        });
    }

    /**
     * Get platform setting
     * @param name Name of the setting
     * @param def Default value
     */
    setting(name: string, def?: any): any {
        if (!this.settings.hasOwnProperty(name)) {
            return def;
        }
        return this.settings[name];
    }
}
