import {
    ApplicationRef,
    Component,
    ComponentFactoryResolver,
    ComponentRef,
    EventEmitter,
    Injector,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';
import {Notification} from '../../models';
import {NotificationComponent} from './notification.component';

@Component({
    selector: 'learnt-notification-stack',
    template: '<div #container></div>',
    styles: [
            `
            :host {
                display: flex;
                flex-direction: column;
                position: fixed;
                right: 20px;
                top: 103px;
            }
        `
    ]
})
export class NotificationStackComponent {

    empty: EventEmitter<any> = new EventEmitter();

    @ViewChild('container', {read: ViewContainerRef})
    container: ViewContainerRef;

    private notifications: ComponentRef<NotificationComponent>[] = [];

    constructor(private resolver: ComponentFactoryResolver,
                private appRef: ApplicationRef,
                private injector: Injector) {
    }

    public push(notification: Notification, lifetime: number): ComponentRef<NotificationComponent> {
        const factory = this.resolver.resolveComponentFactory(NotificationComponent);
        const compRef = this.container.createComponent(factory, 0, this.injector);

        this.notifications.push(compRef);

        compRef.instance.n = notification;
        compRef.instance.dismiss.subscribe(() => {
            const index = this.notifications.indexOf(compRef);
            this.notifications.splice(index, 1);
            compRef.destroy();
        });

        if (lifetime > 0) {
            setTimeout(() => compRef.instance.dismiss.next(), lifetime);
        }

        compRef.changeDetectorRef.detectChanges();

        return compRef;
    }
}
