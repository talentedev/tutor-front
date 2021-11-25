import { MessengerModule } from './../../lib/messenger/messenger.module';
import {
    ApplicationRef,
    Component,
    ComponentFactoryResolver,
    ComponentRef,
    EmbeddedViewRef, Injector,
    NgModuleRef, OnDestroy, OnInit,
    TemplateRef,
    ViewChild,
    ViewContainerRef
} from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Auth, MessengerBackend, Backend } from '../../lib/core/auth';
import { MessengerService } from '../../messenger-libs/core/messenger.service';
import { Thread } from '../../messenger-libs/core/models';
import { User } from '../../models';
import { EmojiService } from '../../services/emoji';
import { MessengerFrontService } from '../../services/messenger';
import { PopoverBoxComponent, PopoverDirection } from '../popover-box/popover-box.component';


@Component({
    selector: 'learnt-header-inbox',
    templateUrl: './header-inbox.component.html',
    styleUrls: ['./header-inbox.component.scss'],
})
export class HeaderInboxComponent implements OnInit, OnDestroy {

    @ViewChild('popover', {read: ViewContainerRef})
    popoverContainer: ViewContainerRef;

    @ViewChild('popoverview')
    popoverview: TemplateRef<any>;

    view: EmbeddedViewRef<any>;

    popover: ComponentRef<PopoverBoxComponent>;

    count = 0;

    threads: Thread[];

    getThreadsSubscription: Subscription;

    messengerModule: MessengerModule;

    me: User;

    private service: MessengerService;
    private backend: MessengerBackend;

    private subscriptions: Subscription = new Subscription();

    constructor(private auth: Auth,
                private resolver: ComponentFactoryResolver,
                private injector: Injector,
                private appRef: ApplicationRef,
                backend: Backend,
                private messengerFront: MessengerFrontService,
                public emojiService: EmojiService) {
        this.auth.me.subscribe(me => this.me = me);
        this.backend = backend.getMessengerBackend();
    }

    ngOnInit() {
        this.subscriptions.add(this.messengerFront.load().subscribe(mod => this.init(mod)));
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
        if (this.getThreadsSubscription) {
            this.getThreadsSubscription.unsubscribe();
        }
    }

    private init(module: MessengerModule): void {
        this.messengerModule = module;
        this.service = this.injector.get(MessengerService);
        this.subscriptions.add(this.service.count.subscribe((n: number) => this.count = n));
    }

    getThreads() {
        this.getThreadsSubscription = this.backend.getThreads().subscribe(threads => {
            this.threads = threads ? threads.map(r => new Thread(r, this.me)) : [];
            this.popover.instance.loading = false;
        }, err => {
            console.error('Failed to retrieve header inbox threads', err);
        });
    }

    showPopover() {
        if (this.popover) {
            return;
        }
        const factory = this.resolver.resolveComponentFactory(PopoverBoxComponent);
        this.popover = this.popoverContainer.createComponent(factory, 0, null, [this.view.rootNodes]);
        this.popover.instance.direction = <PopoverDirection>'bottom';
        this.popover.instance.loading = true;
        this.popover.instance.margin = '0 0 0 10px';
        this.popover.instance.width = 307;
        this.popover.instance.height = 391;

        const subscription = this.popover.instance.onDestroy.subscribe(() => {
            if (this.getThreadsSubscription) {
                this.getThreadsSubscription.unsubscribe();
                this.getThreadsSubscription = null;
            }
            this.popover.destroy();
            this.popover = null;
            subscription.unsubscribe();
        });
        this.getThreads();
    }

    hidePopover() {
        if (this.popover) {
            this.popover.instance.destroy();
        }
    }

    flag(thread, event) {
        event.stopPropagation();
        this.service.flag(thread);
        this.hidePopover();
    }

    click(event) {

        if (this.popover) {
            return this.popover.instance.destroy();
        }

        // Create embedded view with template from this component
        // see header-inbox.component.html
        this.view = this.popoverview.createEmbeddedView(null);

        this.appRef.attachView(this.view);

        // Show dialog in next cycle to avoid hiding
        // when document clicks occurs in popover
        setTimeout(() => this.showPopover());
    }
}
