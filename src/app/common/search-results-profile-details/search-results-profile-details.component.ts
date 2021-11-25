import { SearchResultsComponent } from '../search-results/search-results.component';
import { MessengerFrontService } from '../../services/messenger';
import { Subscription } from 'rxjs/Subscription';
import { Auth } from '../../lib/core/auth';
import { User } from '../../models';
import { Injector, EventEmitter, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'learnt-search-results-profile-details',
    templateUrl: './search-results-profile-details.component.html',
    styleUrls: ['./search-results-profile-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchResultsProfileDetailsComponent implements OnInit, OnDestroy {

    @Input()
    tutor: User;

    me: User;

    @Input()
    showAvatar = false;

    readonly book: EventEmitter<boolean> = new EventEmitter();

    reqSub: Subscription;

    constructor(
        private auth: Auth,
        private injector: Injector,
        private messenger: MessengerFrontService
    ) {
        auth.me.subscribe(me => this.me = me);
    }

    ngOnInit() {}

    ngOnDestroy() {
        if (this.reqSub) {
            this.reqSub.unsubscribe();
        }
    }

    get results(): SearchResultsComponent {
        return this.injector.get('results');
    }

    message() {

        if (this.auth.isLoggedIn()) {
            return this.messenger.createConversationWithTutor(this.me, this.tutor);
        }

        this.results.expand('login', () => {
            this.auth.me.subscribe(
                me => {
                    this.results.closeExpandView();
                    this.messenger.createConversationWithTutor(me, this.tutor);
                }
            );
        });
    }
}
