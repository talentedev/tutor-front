import {ViewStackChangeEvent, ViewStackComponent} from '../../../common/viewstack/viewstack.component';
import {MESSENGER_SIDE_DETAILS_COMPONENT} from '../../../lib/messenger/messenger';
import {Media} from '../../../lib/core/media';
import {Backend} from '../../../lib/core/auth';
import {MessengerService} from '../../core/messenger.service';
import {
    AfterContentInit,
    AfterViewInit, ChangeDetectorRef,
    Component,
    ComponentFactoryResolver,
    ComponentRef,
    Injector,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';
import {Subscription} from 'rxjs/Subscription';
import {SidePlaceholder, Thread} from '../../core/models';

enum SideIndex {
    // Profile = 0,
    Threads = 0,
    Messages
}

@Component({
    selector: 'learnt-messenger-side',
    templateUrl: './side.component.html',
    styleUrls: ['./side.component.scss']
})
export class MessengerSideComponent implements OnInit, OnDestroy, AfterContentInit {

    @ViewChild(ViewStackComponent)
    sidestack: ViewStackComponent;

    index: SideIndex = SideIndex.Threads;

    mobile: boolean;

    mediaSubscription: Subscription;

    count: number;

    thread: Thread;

    // @ViewChild('more', {read: ViewContainerRef, static: true })
    // more: ViewContainerRef;

    moreComponentRef: ComponentRef<SidePlaceholder>;

    constructor(private service: MessengerService,
                private backend: Backend,
                private media: Media,
                private injector: Injector,
                private resolver: ComponentFactoryResolver,
                private cdRef: ChangeDetectorRef) {
        this.mobile = !media.query('gt-sm');
        this.mediaSubscription = media.watch('gt-sm').subscribe(event => this.setMobileState(!event.active));
    }

    ngAfterContentInit() {
        // const cmp = this.injector.get(MESSENGER_SIDE_DETAILS_COMPONENT);
        // const factory = this.resolver.resolveComponentFactory(cmp);
        // this.moreComponentRef = <ComponentRef<SidePlaceholder>> this.more.createComponent(factory, 0, this.injector);
        // this.updateSideProfile();
    }

    setMobileState(state: boolean) {
        this.mobile = state;
        console.log("setMobileState", state, this.index);

        if (state === false) {
            this.sidestack.setIndex(SideIndex.Threads, false);
            this.index = SideIndex.Threads;
        }

        if (this.thread && state === true && this.index === SideIndex.Threads) {
            this.sidestack.setIndex(SideIndex.Messages, false);
            this.index = SideIndex.Messages;
        }
    }

    onViewStackChange(event: ViewStackChangeEvent) {
         // && event.to === SideIndex.Messages && event.from === SideIndex.Threads
        if (!this.mobile && event.to === SideIndex.Messages && event.from === SideIndex.Threads) {
            event.preventDefault();
        }

        if (this.moreComponentRef && event.to === SideIndex.Messages && event.from === SideIndex.Threads) {
            this.moreComponentRef.instance.onShow();
        }

        if (this.moreComponentRef && event.to === SideIndex.Threads && event.from === SideIndex.Messages) {
            this.moreComponentRef.instance.onShow();
        }
    }

    ngOnDestroy() {
        if (this.mediaSubscription) {
            this.mediaSubscription.unsubscribe();
        }
    }

    // updateSideProfile() {
    //     if (this.moreComponentRef && this.thread) {
    //         this.moreComponentRef.instance.setTutorId(this.thread.other._id);
    //     }
    //     this.cdRef.markForCheck();
    // }

    setThread(thread: Thread) {
        this.thread = thread;

        if (this.mobile) {
            this.index = SideIndex.Messages;
            if(this.sidestack) {
                this.sidestack.setIndex(SideIndex.Messages, false);
            }
        }

        // this.updateSideProfile();
    }

    ngOnInit() {
        if (this.service.thread) {
            this.setThread(this.service.thread);
        }

        this.service.threadChange.subscribe(thread => this.setThread(thread));
    }
}
