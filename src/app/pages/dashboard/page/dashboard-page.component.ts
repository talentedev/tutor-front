import { MessengerModule } from './../../../lib/messenger/messenger.module';
import { MessengerThreadsComponent } from '../../../messenger-libs/components/threads/threads.component';
import { MessengerFrontService } from '../../../services/messenger';
import {
    ApplicationRef,
    Component,
    ComponentFactoryResolver,
    HostBinding,
    Injector,
    OnInit,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';
import { ROUTE_ANIMATION_DEFAULT } from '../../../app.animation';
import { Auth, Backend } from '../../../lib/core/auth';
import { MessengerService } from '../../../messenger-libs/core/messenger.service';
import { FacebookShare, SocialSharing } from '../../../services/social';
import { User } from '../../../models';
import { environment } from 'environments/environment';
import { NotificationsService } from 'app/services/notifications';
import { ActivatedRoute } from '@angular/router';
import { TransactionsService } from '../../../services/transactions.service';
import startOfMonth from 'date-fns/startOfMonth';
import endOfMonth from 'date-fns/endOfMonth';
import utcToZonedTime from 'date-fns-tz/esm/utcToZonedTime';

@Component({
    selector: 'learnt-dashboard-page',
    templateUrl: './dashboard-page.component.html',
    styleUrls: [
        './dashboard-page.component.scss',
        './dashboard-page.component.desktop.scss',
    ],
    animations: [ROUTE_ANIMATION_DEFAULT]
})
export class DashboardPageComponent implements OnInit {

    @HostBinding('class.page-component')
    isPageComponent = true;

    @HostBinding('@routeAnimation')
    routeAnimation = true;

    @ViewChild('threads', {read: ViewContainerRef, static: true})
    threads: ViewContainerRef;

    public user: User;

    public threadCount: number;
    public unreadCount = 0;

    public referralLink: string;
    public referralCode: string;

    public facebookLink: string;
    public twitterLink: string;

    public earnings = 0;

    constructor(private backend: Backend,
                private injector: Injector,
                private auth: Auth,
                private appRef: ApplicationRef,
                private messenger: MessengerFrontService,
                private componentFactoryResolver: ComponentFactoryResolver,
                private notifications: NotificationsService,
                private socialShare: SocialSharing,
                private route: ActivatedRoute,
                private transactionsService: TransactionsService) {
        this.user = this.route.parent.snapshot.data.me;

        // Set Google Tag Manager data to be passed to Intercom
        window['dataLayer'] = window['dataLayer'] || [];
        window['dataLayer'].push({
            'event': 'sendUserData',
            'user_id': this.user._id,
            'email': this.user.email,
            'name': this.user.profile.first_name + ' ' + this.user.profile.last_name,
            'phone': this.user.profile.telephone,
            'avatar': this.user.profile.avatar ? 'https://s3.amazonaws.com/learnt/' + this.user.profile.avatar.url : ''
        });
    }

    ngOnInit(): void {

        const from = startOfMonth(utcToZonedTime(new Date(), this.user.timezone));
        const to = endOfMonth(from);
        this.transactionsService.getEarnings(from, to)
            .then(earnings => {
                this.earnings = earnings;
            })

        this.backend.getRefer().subscribe(response => {
            this.referralLink = environment.REFERRAL_URL + '/start/promo/' + response.referral_code;
            this.buildSocialLinks();
        });

        this.messenger.load().subscribe((module:MessengerModule) => {

            const thread = this.componentFactoryResolver.resolveComponentFactory(MessengerThreadsComponent);
            const service: MessengerService = this.injector.get(MessengerService);

            const cmpRef = thread.create(this.injector, null, this.threads.element.nativeElement);
            cmpRef.instance.margin = false;
            cmpRef.instance.paginated = true;
            cmpRef.instance.limit = 5;
            cmpRef.changeDetectorRef.detectChanges();
            this.appRef.attachView(cmpRef.hostView);
            service.threads.subscribe(threads => {
                if (threads) {
                    this.threadCount = threads.size;
                }
            });
            service.updateThreads();

            service.count.subscribe((n: number) => this.unreadCount = n);
        });
    }

    /**
     * Build social links for sharing.
     */
    private buildSocialLinks(): void {
        this.getFacebookShareLink();
        this.getTwitterShareLink();
    }

    public getFacebookShareLink(): void {
        const facebookShare: FacebookShare = {
            url: this.referralLink,
            quote: `Get $15 off your first lesson. Join ${this.user.name} on Learnt, and learn or teach in your free time.`
        }
        this.facebookLink = this.socialShare.FacebookByLink(facebookShare);
    }

    public getTwitterShareLink(): void {
        const shareData = ` Get $15 off your first lesson. Join ${this.user.name} on Learnt, and learn or teach in your free time.`;
        this.twitterLink = this.socialShare.TwitterByText(this.referralLink + shareData);
    }
}
