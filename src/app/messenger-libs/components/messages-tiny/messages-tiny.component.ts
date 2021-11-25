import {Auth} from '../../../lib/core/auth';
import {MessengerService, OnMessageCreate} from '../../core/messenger.service';
import {MessengerMessagesComponent} from '../messages/messages.component';

import {Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, ElementRef} from '@angular/core';

@Component({
    selector: 'learnt-messages-tiny',
    templateUrl: './messages-tiny.component.html',
    styleUrls: ['./messages-tiny.component.scss']
})
export class MessagesTinyComponent extends MessengerMessagesComponent implements OnInit, OnChanges {

    @Input('thread-id')
    threadId: string;

    constructor(private msgServ: MessengerService,
                private cdRef: ChangeDetectorRef,
                private auth: Auth,
                private elRef: ElementRef) {
        super(msgServ, cdRef);
    }

    ngOnInit() {
        super.ngOnInit();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.threadId.currentValue) {
            this.setupMessages();
        }

        super.ngOnChanges(changes);
    }

    setupMessages() {
        this.msgServ.getThreadById(this.threadId).subscribe(thread => {
            this.msgServ.thread = thread;
            setTimeout(() => this.scrollToLastMessage(), 100);
        });
    }

    private scrollToLastMessage(): void {
        const element: HTMLElement = this.elRef.nativeElement;
        if (element.children.length === 0) {
            return;
        }

        const messages = element.children;
        messages[messages.length - 1].scrollIntoView();
    }

    onMessageCreate(event: OnMessageCreate): void {
        setTimeout(() => this.scrollToLastMessage(), 100);
        return super.onMessageCreate(event);
    }
}
