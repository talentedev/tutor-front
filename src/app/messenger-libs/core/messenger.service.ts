import { MessengerBackend, Auth, Backend } from '../../lib/core/auth';
import { User } from 'app/models';
import { EventEmitter, Injectable, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SocketEvent, SocketService } from 'app/lib/core/socket';
import { List } from 'immutable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Logger } from '../../lib/core/common/logger';
import { FlagMessageComponent } from '../components/flag-message/flag-message.component';
import { Message, MessageInterface, PaginatedResults, Thread } from './models';
import { HttpClient } from "@angular/common/http";
import { map } from "rxjs/operators";

export interface OnMessageCreate {
    message: Message;
    thread: Thread;
}

@Injectable({providedIn: 'root'})
export class MessengerService {

    private _me: User;

    private _thread: Thread;

    @Output()
    public readonly threadChange: EventEmitter<Thread> = new EventEmitter();

    private _threads: BehaviorSubject<List<Thread>> = new BehaviorSubject(null);
    public readonly threads: Observable<List<Thread>> = this._threads.asObservable();

    public onMessageCreate: EventEmitter<OnMessageCreate> = new EventEmitter(true);


    private _count: BehaviorSubject<number> = new BehaviorSubject(0);
    public readonly count: Observable<number> = this._count.asObservable();

    private backend: MessengerBackend;

    constructor(private logger: Logger,
                private dialog: MatDialog,
                private socket: SocketService,
                private auth: Auth,
                private http: HttpClient,
                backend: Backend) {
        this.backend = backend.getMessengerBackend();
        this.logger = logger.context('Messenger Service');
        this.socket.on("message.created").subscribe(event => this.onSocketEvent(event));
        this.auth.me.subscribe(me => {
            this._me = me;
            this.updateCounts();
        });
    }

    public get me(): User {
        return this._me;
    }

    public get thread(): Thread {
        return this._thread;
    }

    public set thread(thread: Thread) {
        if (thread === null || thread === undefined) {
            return;
        }

        if (this._thread !== null && this._thread !== undefined && this._thread._id === thread._id) {
            return;
        }

        this._thread = thread;
        this.threadChange.next(thread);
    }

    public updateThreads(): void {
        this.backend.getThreads().subscribe(threads => {
            const value = List((threads || []).map(t => new Thread(t, this.me)));
            this._threads.next(value);
        }, err => {
            this.logger.error('Failed to retrieve threads from service', this.logger.data('error', err));
        });
    }

    private onSocketEvent(event: SocketEvent): void {
        const message = new Message(event.data.get('message'));
        const thread = new Thread(event.data.get('thread'), this.me);
        this.onMessageCreate.next({ message, thread });
        this.sortThreads();
    }

    public getThreadById(id: string): Observable<Thread> {
        return this.backend.getThread(id, this._me);
    }

    public getMessagePagination(thread: Thread, initialLimit = 15): Observable<PaginatedResults<Message>> {
        const request = (offset: number, limit: number): Observable<Message> => {
            return new Observable(subscriber => {
                this.backend.getThreadMessages(thread, offset, limit).subscribe(
                    response => {
                        subscriber.next(response.items);
                        subscriber.complete();
                    },
                    (err) => {
                        subscriber.error(err);
                    }
                );
            });
        };

        return new Observable(subscriber => {
            if (!thread) {
                return subscriber.complete();
            }
            this.backend.getThreadMessages(thread, 0, initialLimit).subscribe(response => {
                subscriber.next(new PaginatedResults(
                    response.items,
                    response.total,
                    0,
                    initialLimit,
                    request,
                ));

                subscriber.complete();
            });
        });
    }

    public createThread(message: MessageInterface, tutor: User): Observable<Thread> {
        return new Observable<Thread>(sub => {
            this.backend.createThread(message, tutor).subscribe(thread => {
                const t = new Thread(thread, this.me);
                this.logger.info('Threads updated after create thread call');
                this.updateThreads();
                sub.next(t);
                sub.complete();
            }, err => {
                sub.error(err);
            });
        });
    }

    public getOrCreateThread(receiver: string): Observable<Thread> {
        return this.http.post(`@api/messenger/thread`, {receiver})
            .pipe(map((data) => {
                return new Thread(data, this.me);
            }));
    }

    public send(thread: Thread, message: MessageInterface): Observable<Message> {
        return this.backend.send(thread, message);
    }

    public upload(thread: Thread, file: File): Observable<Message> {
        return this.backend.upload(thread, file);
    }

    public markAsRead(messages: string[]): Promise<boolean> {
        return new Promise<boolean>(next => {
            this.backend.markAsRead(messages).subscribe(() => {
                this.updateCounts();
                next();
            });
        });
    }

    public updateCounts(): void {
        this.backend.getNewMessageCount().then((n: number) => this._count.next(n));
    }

    public flag(thread: Thread): void {
        this.dialog.open(FlagMessageComponent, {width: '880px', height: '510px', data: thread});
    }

    private sortThreads(): void {
        const threads = this._threads.getValue();

        if (!threads) {
            return;
        }

        const sorted = <any>threads.sort((a, b) => a.message_time.isAfter(b.message_time) ? -1 : 1);
        this.updateCounts();

        this._threads.next(sorted);

        this.logger.info('Messenger service threads updated after sort');
    }
}
