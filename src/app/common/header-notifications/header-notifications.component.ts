import {NotificationsService} from '../../services/notifications';
import {Backend} from '../../lib/core/auth';
import {PopoverBoxComponent, PopoverDirection} from '../popover-box/popover-box.component';
import {NotificationsListComponent} from '../notifications-list/notifications-list.component';

import {
    Component,
    Injector,
    ViewChild,
    ViewContainerRef,
    ComponentFactoryResolver,
    ApplicationRef,
    OnInit,
    ComponentRef
} from '@angular/core';

@Component({
    selector: 'learnt-header-notifications',
    templateUrl: './header-notifications.component.html',
    styleUrls: ['./header-notifications.component.scss']
})
export class HeaderNotificationsComponent implements OnInit {

    @ViewChild('popover', {read: ViewContainerRef})
    popoverContainer: ViewContainerRef;

    popover: ComponentRef<PopoverBoxComponent>;

    notifications: ComponentRef<NotificationsListComponent>;

    count = 0;

    constructor(private injector: Injector,
                private resolver: ComponentFactoryResolver,
                private appRef: ApplicationRef,
                private notificationsService: NotificationsService,
                private backend: Backend) {
    }

    ngOnInit(): void {
        this.notificationsService.notifications.subscribe(n => {
            this.backend.getNotifications().subscribe(
                response => {
                    this.count = response.length;
                }
            )
        });
    }

    /**
     * Show popover dialog
     */
    private showPopover(): void {
        if (this.popover) {
            return;
        }
        const notificationsFactory = this.resolver.resolveComponentFactory(NotificationsListComponent);

        const factory = this.resolver.resolveComponentFactory(PopoverBoxComponent);
        this.popover = this.popoverContainer.createComponent(factory);

        this.notifications = notificationsFactory.create(this.injector);
        this.appRef.attachView(this.notifications.hostView);

        this.popover.instance.direction = <PopoverDirection>'bottom';
        this.popover.instance.loading = true;
        this.popover.instance.margin = '0 0 0 3px';

        this.notifications.instance.counter = false;
        this.notifications.instance.limit = 10;

        const displaySubscription = this.notifications.instance.onCompleteDisplay.subscribe(() => {
            if (this.popover) {
                this.popover.instance.loading = false;
                this.popover.instance.setContent(this.notifications.location);
            }
            displaySubscription.unsubscribe();
        });

        const destroySubscription = this.popover.instance.onDestroy.subscribe(() => {
            displaySubscription.unsubscribe();
            this.popover.destroy();
            this.notifications.destroy();
            this.popover = null;
            destroySubscription.unsubscribe();
        });
    }

    /**
     * Show the popover dialog
     */
    public click(event) {
        event.stopPropagation();
        event.preventDefault();

        if (this.popover) {
            return this.popover.instance.destroy();
        }

        // Show dialog in next cycle to avoid hiding
        // when document clicks occurs in popover
        setTimeout(() => this.showPopover());
    }
}
