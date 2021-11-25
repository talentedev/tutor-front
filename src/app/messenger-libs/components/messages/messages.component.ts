import { User } from 'app/models';
import { Subscription } from 'rxjs/Subscription';
import { Message, PaginatedResults, Thread } from '../../core/models';
import { MessengerService, OnMessageCreate } from '../../core/messenger.service';
import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    OnChanges,
    OnDestroy,
    OnInit,
    SimpleChanges,
    ViewChild
} from '@angular/core';

@Component({
    selector: 'learnt-messenger-messages',
    templateUrl: './messages.component.html',
    styleUrls: ['./messages.component.scss'],
})
export class MessengerMessagesComponent implements OnInit, OnDestroy, OnChanges {

    @ViewChild('scroller')
    scroller: ElementRef;

    /**
     * Ensure messages pagination
     */
    pagination: PaginatedResults<Message>;

    newMessages = 0;

    autoscroll = true;

    thread: Thread;

    me: User;

    meWaitCount = 0;

    subscriptions: Subscription = new Subscription();

    fetching: boolean;

    constructor(private service: MessengerService,
                private cd: ChangeDetectorRef) {
        this.pagination = new PaginatedResults([], 0, 0, 10, (): any => { });
    }

    scrollDown() {
        if (!this.scroller) {
            return;
        }
        const element = this.scroller.nativeElement;
        setTimeout(() => element.scrollTop = element.scrollHeight);
    }

    ngOnInit() {
        if (this.service.thread) {
            // TODO: Refactor this
            this.me = this.service.me;
            this.thread = this.service.thread;
            this.getInitialPagination();
        }

        this.subscriptions.add(this.service.threadChange.subscribe(thread => {
            this.me = this.service.me;
            this.thread = thread;
            this.getInitialPagination();
        }));

        this.subscriptions.add(this.service.onMessageCreate.subscribe(this.onMessageCreate.bind(this)));
    }

    onMessageCreate(event: OnMessageCreate) {
        if (!this.thread || event.thread._id !== this.thread._id) {
            return;
        }

        this.pagination.items.push(event.message);
        this.scrollDown();

        this.markAsRead([event.message]);
        this.cd.detectChanges();
    }

    getInitialPagination() {
        this.subscriptions.add(this.service.getMessagePagination(this.thread).subscribe(
            pagination => {
                this.pagination = pagination;
                this.scrollDown();
                this.markAsRead(pagination.items);
            },
            () => {
                this.pagination = null;
            }
        ));
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    ngOnChanges(changes: SimpleChanges) {
        this.scrollDown();
    }

    checkPagination() {
        if (!this.fetching && this.pagination && this.pagination.hasNext()) {
            this.fetching = true;
            this.pagination.next().subscribe((items: Message[]) => {
                this.fetching = false;
                this.markAsRead(items);
            });
        }
    }

    markAsRead(messages: Message[]) {
        const tomark = [];

        if (!this.me && this.meWaitCount < 3) {
            setTimeout(() => this.markAsRead(messages), 1000);
            this.meWaitCount++;
            return;
        }

        messages.map(m => {
            if (!m.seenBy(this.me)) {
                m.seen = m.seen || [];
                m.seen.push(this.me._id);
                tomark.push(m._id);
            }
        });

        if (tomark.length) {
            setTimeout(() => this.service.markAsRead(tomark));
        }

        this.meWaitCount = 0;
    }

    onWheel(event) {
        const element = this.scroller.nativeElement;

        if (!element) {
            return console.warn('Scroller is not defined');
        }

        const delta = event.detail ?
            event.detail * (-120) :
            event.wheelDelta;

        if (delta < 0) {
            // this.autoscroll = false;
            // return;
        }

        // const rect: any = element.getBoundingClientRect();

        if (element.scrollTop < 50) {
            this.checkPagination();
        }
        /*
        if (element && element.scrollTop >= element.scrollHeight - rect.height) {
            this.autoscroll = true;
            this.newMessages = 0;
            this.cd.markForCheck();
        }*/
    }
    
    trackByMessageId(id: number, message: Message): string {
        return message._id;
    }
}
