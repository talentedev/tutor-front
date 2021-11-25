import { ActivatedRoute, Router } from '@angular/router';
import {Subscription} from 'rxjs/Subscription';
import {MessengerService} from '../../core/messenger.service';
import {Message, Thread} from '../../core/models';
import {ChangeDetectorRef, Component, HostBinding, Input, OnDestroy, OnInit} from '@angular/core';
import {List} from 'immutable';
import {Chunk} from '../../../lib/helpers/functions';
import {Emoji, EmojiService} from '../../../services/emoji';
import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import {Auth} from '../../../lib/core/auth';
import {MessengerFrontService} from '../../../services/messenger';
import {User} from '../../../models';
import { filter } from "rxjs/operators";

@Component({
    selector: 'learnt-messenger-threads',
    templateUrl: './threads.component.html',
    styleUrls: ['./threads.component.scss', './threads.component.mobile.scss']
})
export class MessengerThreadsComponent implements OnInit, OnDestroy {

    @HostBinding('class.empty')
    get inboxEmpty() {
        if (this.threads === undefined || this.threads === null) {
            return false;
        }
        return this.threads.size === 0;
    }

    @Input()
    margin = true;

    threads: List<Thread>;

    thread: Thread;

    @Input()
    paginated = false;

    @Input()
    public limit = 10;

    public pageNum = 0;
    public paginatedThreads: Thread[][];

    fetching = true;

    private subscription: Subscription = new Subscription();
    private me: User;

    constructor(private router: Router,
                private route: ActivatedRoute,
                private service: MessengerService,
                private cd: ChangeDetectorRef,
                public emojiService: EmojiService,
                private messengerFront: MessengerFrontService) {
        if (this.service.thread) {
            this.thread = this.service.thread;
        }
        this.me = this.route.parent.snapshot.data.me;
    }


    public onSearchInputKeyUp(event: KeyboardEvent): void {
        // const keyword = (<HTMLInputElement>event.target).value;

        // if (event.keyCode === 27) {
        //     // escape
        //     event.preventDefault();
        //     this.subjects = [];
        //     return;
        // }

        // if (event.keyCode === 13) {
        //     // enter
        //     event.preventDefault();

        //     if (this.hintIndex === -1 || this.subjects == null || this.subjects.length < 1) {
        //         this.subjects = [];
        //         this.searchService.SearchKeyword(keyword);
        //         this.router.navigateByUrl(ROUTE_TUTORS + '?query=' + keyword);
        //         return;
        //     }

        //     this.hintSelect(this.subjects[this.hintIndex]);
        //     return;
        // }

        // if (event.keyCode === 40) {
        //     // arrow down
        //     if (this.hintIndex < (this.subjects.length - 1)) {
        //         this.hintIndex++;
        //     }
        //     event.preventDefault();
        //     return;
        // }

        // if (event.keyCode === 38) {
        //     // arrow up
        //     if (this.hintIndex > -1) {
        //         this.hintIndex--;
        //     }
        //     event.preventDefault();
        //     return;
        // }

        // clearTimeout(this.searchInputTimeout);
        // this.searchInputTimeout = window.setTimeout(() => {
        //     this.searchService.SearchKeyword(keyword);
        //     this.autocompleteSubjects(keyword);
        // }, 200);
    }


    ngOnInit() {
        this.subscription.add(this.service.threads.subscribe((threads: List<Thread>) => {

            this.fetching = false;

            if (threads === null) {
                return;
            }
            this.threads = threads;
            this.paginatedThreads = Chunk(threads.toArray(), this.limit);
            // this.threads.map(function(thread){console.log(thread)});
        }));

        this.subscription.add(this.service.threadChange.subscribe(thread => {
            this.thread = thread;
            this.cd.detectChanges();
        }));
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
        this.thread = null;
    }

    public get pages(): number {
        return this.paginatedThreads.length;
    }

    isSelectedThread(thread: Thread): boolean {
        if (!this.thread || !thread) {
            return false;
        }

        return this.thread._id === thread._id;
    }

    select(thread: Thread, event: MouseEvent) {
        event.stopPropagation();
        // todo: fix viewstack update if mobile
        this.router.navigateByUrl('/main/inbox/' + thread._id).then(() => this.thread = thread);
    }

    // flag(thread: Thread, event: MouseEvent) {
    //     event.stopPropagation();
    //     this.service.flag(thread);
    // }

    public formattedTime(t: Thread): string {
        return t.formattedTime;
    }

    getThreadId(index: number, thread: Thread) {
        return thread._id;
    }
}
