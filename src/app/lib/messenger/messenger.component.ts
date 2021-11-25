import {List} from 'immutable';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {Auth} from '../core/auth';
import {Thread} from '../../messenger-libs/core/models';
import {MessengerService} from '../../messenger-libs/core/messenger.service';
import {ChangeDetectorRef, Component, OnDestroy} from '@angular/core';
import {Media} from '../core/media';
import {Subscription} from 'rxjs/Subscription';
import {User} from '../../models';

@Component({
    selector: 'learnt-messenger',
    templateUrl: './messenger.component.html',
    styleUrls: [
        './messenger.component.scss',
        './messenger.component.desktop.scss',
        './messenger.component.mobile.scss'
    ]
})
export class MessengerComponent implements OnDestroy {

    mobile: boolean;

    thread: Thread;

    subscription: Subscription = new Subscription();

    constructor(private auth: Auth,
                private router: Router,
                private route: ActivatedRoute,
                private service: MessengerService,
                private media: Media,
                // private injector: Injector,
                // private resolver: ComponentFactoryResolver,
                private cd: ChangeDetectorRef) {

        this.mobile = !media.query('gt-sm');

        this.subscription.add(media.watch('gt-sm').subscribe(event => {
            this.mobile = !event.active;
            this.cd.detectChanges();
        }));

        this.onMeReceived();
        this.service.updateThreads();
    }

    onMeReceived() {
        this.subscription.add(this.route.params.subscribe(this.onThreadParamUpdated.bind(this)));
    }

    onThreadParamUpdated(params: Params) {
        this.subscription.add(this.service.threads.subscribe((threads: List<Thread>) => {
            if (!threads || threads.size === 0) {
                return;
            }

            let thread: Thread;

            if (params.thread) {
                thread = threads.find(t => t._id === params.thread);
            } else if (threads.size > 0) {
                thread = threads.get(0);
            }

            if (thread) {
                this.service.thread = thread;
            }
        }));
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
