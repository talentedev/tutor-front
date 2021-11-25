import { Compiler, Inject, Injectable, Injector, NgModuleRef, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs/Rx';
import { TOKEN_STORAGE, TokenStorage } from '../lib/core/auth';
import { MessengerModule } from '../lib/messenger/messenger.module';
import { MessengerService } from '../messenger-libs/core/messenger.service';
import { Message, Thread } from '../messenger-libs/core/models';
import { User } from '../models';
import { AlertService } from './alerts';
import { HttpErrorResponse } from "@angular/common/http";
import { SocketEvent, SocketService } from '../lib/core/socket';

export interface OnMessageCreate {
    message: Message;
    thread: Thread;
}

@Injectable()
export class MessengerFrontService {

    private _me: User;
    private inboxRouteModule: MessengerModule;
    private loadObservable: Observable<NgModuleRef<MessengerModule>>;
    public onMessageCreate: EventEmitter<OnMessageCreate> = new EventEmitter(true);

    constructor(private injector: Injector,
                private router: Router,
                private alerts: AlertService,
                private socket: SocketService,
                @Inject(TOKEN_STORAGE) private tokenProvider: TokenStorage,
                private compiler: Compiler) {
        this.socket.on("message.created").subscribe(event => this.onSocketEvent(event))
    }

    private onSocketEvent(event: SocketEvent): void {
        const message = new Message(event.data.get('message'));
        const thread = new Thread(event.data.get('thread'), this.me);
        this.onMessageCreate.next({ message, thread });
    }

    public get me(): User {
        return this._me;
    }

    /**
     * Lazy load messenger module
     */
    load(): Observable<MessengerModule> {
        const cached = this.inboxRouteModule;

        if (this.loadObservable && !cached) {
            return this.loadObservable;
        }

        if (cached) {
            return new BehaviorSubject<MessengerModule>(cached);
        }

        this.loadObservable = new Observable<NgModuleRef<MessengerModule>>(sub => {
            import('../lib/messenger/messenger.module').then(module => {
                const promise = this.compiler.compileModuleAndAllComponentsAsync(
                    module.MessengerModule
                );
                promise.then(mod => {
                    const modRef = mod.ngModuleFactory.create(this.injector)
                    this.inboxRouteModule = modRef;
                    sub.next(modRef);
                    sub.complete();
                }).catch((err) => {
                    sub.error(err)
                })
            })
        });

        return this.loadObservable;
    }

    /**
     * Create new conversation with user
     * This is the action of ( Message Tutor ) button
     * @param me User
     * @param tutor User
     * @param message string
     */
    createConversationWithTutor(me: User, tutor: User, message?: string) {
        if (tutor === null || tutor === undefined) {
            throw new Error('Received null or undefined user for tutor in createConversationWithTutor');
        }

        if (me === null || me === undefined) {
            const alertRef = this.alerts.alert(
                'Authentication',
                'You need to be logged in in order to create a conversation with this tutor.',
                {
                    backdropClose: false,
                    lifetime: 0,
                    buttons: [
                        {label: 'Login', result: true},
                        {label: 'Cancel', result: false},
                    ]
                }
            );

            alertRef.result.subscribe(login => {
                alertRef.dispose();
                if (login) {
                    const url = '/start/login?redirect=' + encodeURIComponent(location.pathname.toString() + location.search);
                    this.router.navigateByUrl(url);
                }
            });

            return;
        }

        this.load().subscribe((module: NgModuleRef<MessengerModule>) => {
            
            if (message === null || message === undefined && tutor) {
                message = '';
            }

            const service: MessengerService = module.injector.get(MessengerService);
            
            service
                .createThread({type: 'text', body: message}, tutor)
                .subscribe((thread: Thread) => {
                    this.router.navigateByUrl('/main/inbox/' + thread._id).then(() => service.thread = thread);
                }, response => {
                    const alertMessage = `Error while trying to create a conversation with ${tutor.shortName}. Error: ${response.error.message}`;
                    this.alerts.alert('Inbox', alertMessage);
                });
        });
    }

    createConversationWithUser(id: string) {
        this.load().subscribe((module: NgModuleRef<MessengerModule>) => {
            const service: MessengerService = module.injector.get(MessengerService);
            service.getOrCreateThread(id)
                .subscribe((thread: Thread) => {
                    service.thread = thread;
                    this.router.navigateByUrl(`/main/inbox/${thread._id}`);
                }, (err: HttpErrorResponse) => {
                    this.alerts.alert('Inbox', err.error);
                });
        })
    }
}
