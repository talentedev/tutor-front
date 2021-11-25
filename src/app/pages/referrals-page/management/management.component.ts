import { ChangeDetectorRef, Component, ElementRef, HostBinding, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Media } from 'app/lib/core/media';
import { map } from 'rxjs/operators';
import { ROUTE_ANIMATION_DEFAULT } from '../../../app.animation';
import { Backend } from '../../../lib/core/auth';
import { User } from '../../../models';
import { AlertService } from '../../../services/alerts';
import { ProfileComponent } from '../../account/profile/profile.component';
import { ReferralLink, ReferralUser } from '../exports';
import { environment } from 'environments/environment';

@Component({
    selector: 'learnt-referrals-management',
    templateUrl: './management.component.html',
    styleUrls: ['./management.component.scss', '../referrals-page.component.scss'],
    animations: [ROUTE_ANIMATION_DEFAULT]
})
export class ReferralsManagementComponent implements OnInit {
    @HostBinding('class.page-component')
    isPageComponent = true;

    @HostBinding('@routeAnimation')
    routeAnimation = true;

    @ViewChild('menu')
    public menu: ElementRef;

    public menuExpanded: boolean;
    public mobile: boolean;

    public inviteForm: FormGroup;
    public loading: boolean;

    public referrals: ReferralUser[] = [];
    public referralLink: string;
    public referralCode: string;

    /**
     * How many pages for pagination.
     */
    public pages: number;

    /**
     * Current pagination index.
     * @type {number}
     */
    public currentPage = 1;

    /**
     * Filter to apply to the query. String in order to be more readable.
     * @type {string}
     */
    public filterType = 'active';

    public overQuota: boolean;

    /**
     * Current user.
     */
    private me: User;

    /**
     * How many users per page.
     * @type {number}
     */
    private limit = 10;

    /**
     * DB type of the referral link.
     * type=1 -> invited
     * type=2 -> signed up & completed
     * anything else -> mix
     * @type {number}
     */
    private type = 2;

    /**
     * CSS can't target previous selectors, so we must toggle the status-wrapper state manually.
     * @type {any[]}
     */
    private statusHiddenData: boolean[] = [];

    constructor(private alerts: AlertService,
                private backend: Backend,
                private media: Media,
                private route: ActivatedRoute,
                private cd: ChangeDetectorRef) {
        this.me = this.route.parent.snapshot.data.me;
        this.inviteForm = new FormGroup({
            email: new FormControl('', Validators.compose([Validators.required, Validators.email])),
        });

        this.mobile = !media.query('gt-sm');
        media.watch('gt-sm').subscribe(event => {
            this.mobile = !event.active;
            if (!this.cd['destroyed']) {
                this.cd.detectChanges();
            }
        });
    }

    ngOnInit(): void {
        this.getReferData();
    }

    /**
     * Get first page of refer data, store referral code, build referrals, and check for affiliate user's quota.
     */
    private getReferData(): void {

        this.backend.getRefer(1, this.limit, this.type).subscribe(res => {
            this.pages = Math.ceil(res.links.total / this.limit);

            this.referralCode = res.referral_code;
            this.referralLink = environment.HOST + '/start/promo/' + this.referralCode

            this.buildReferrals(res.links.data);

            if (!this.me.isAffiliate() || res.affiliate === undefined) {
                return;
            }

            this.overQuota = res.affiliate.quota < 1;
            this.overQuota = true;
        });
    }

    /**
     * Filter by the referral link state.
     * @param {string} type
     */
    public filterBy(type: string): void {
        if (this.filterType === type) {
            return;
        }

        switch (type) {
            case 'active':
                this.type = 2;
                break;
            case 'pending':
                this.type = 1;
                break;
            default:
                return;
        }

        this.filterType = type;
        this.getReferPage(1);
    }

    /**
     * Get the nth page for pagination.
     * @param {number} n
     */
    public getReferPage(n: number) {
        this.loading = true;
        this.currentPage = n;
        this.backend.getRefer(n, this.limit, this.type).subscribe(response => {
            this.pages = Math.ceil(response.links.total / this.limit);
            this.buildReferrals(response.links.data);
        });
    }

    /**
     * Build the referral users array.
     * @param {ReferralLink[]} referralLinks
     */
    private buildReferrals(referralLinks: ReferralLink[]): void {
        this.referrals = [];
        for (const key in referralLinks) {
            this.statusHiddenData[key] = false;
            const link = referralLinks[key];

            let user: ReferralUser;

            if (link.referral === undefined) {
                const d = new Date(link['created_at']);
                user = {
                    email: link['email'],
                    avatar: 'https://s3.amazonaws.com/tutorthepeople/temp/default-avatar.png',
                    amount: 15,
                    status: link.step,
                    date: `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`,
                    type: link['type'],
                };

                this.referrals[key] = user;
            } else {
                this.backend.getUser(link.referral).subscribe(user => {
                    const d = new Date(link['created_at']);
                    this.referrals[key] = {
                        email: user.email,
                        firstname: user.profile.first_name,
                        lastname: user.profile.last_name,
                        avatar: ProfileComponent.avatarUrl(user.profile.avatar),
                        amount: link.amount,
                        status: link.step,
                        date: `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`,
                        type: link['type'],
                    }
                });
            }
        }

        this.loading = false;
    }

    /**
     * Resend an invitation mail.
     * @param {string} email
     * @param {boolean} force
     */
    public resendInvitation(email: string, force: boolean = false): void {
        if (this.overQuota) {
            return;
        }

        const payload = {
            users: [{email, force}]
        };

        this.backend.referInvite(payload).subscribe(res => {

            if (res['invited'].length > 0 && res['invited'][0].email === email) {
                this.alerts.alert('We just sent an invitation link to ' + email);
                return;
            }

            let alert;
            if (res['errors'].length > 0) {
                const message = res['errors'][0].message;
                if (/already invited/.test(message)) {
                    const alertMessage = `Are you sure you want to resend the invitation? You already invited ${email} once this week.`;
                    const alertOpts = {lifetime: 0, buttons: [{label: 'Yes', result: true}, {label: 'No', result: false}]};

                    alert = this.alerts.alert('Resend invitation', alertMessage, alertOpts);
                    alert.result.subscribe(result => {
                        if (result === true) {
                            this.resendInvitation(email, true);
                        }
                        alert.dispose();
                    });
                } else {
                    const alertMessage = `We received the following error: ${message}`;
                    const alertOpts = {lifetime: 0, buttons: [{label: 'OK', result: true}]};

                    alert = this.alerts.alert('Couldn\'t resend invitation', alertMessage, alertOpts);
                    alert.result.subscribe(result => {
                        if (result === true) {
                            alert.dispose();
                        }
                    });
                }
                return;
            }
        });
    }

    /**
     * Generate an array of numbers for pagination.
     * @return {Array<number>}
     */
    public pagesArray(): Array<number> {
        const arr = [];
        for (let j = 1; j <= this.pages; j++) {
            arr.push(j);
        }
        return arr;
    }

    /**
     * Return the nth state for status-wrapper.
     * @param {number} n
     * @return {boolean}
     */
    public statusIsHidden(n: number): boolean {
        return this.statusHiddenData[n];
    }

    /**
     * Hide the nth status-wrapper.
     * @param {number} n
     */
    public hideStatus(n: number): void {
        this.statusHiddenData[n] = true;
    }

    /**
     * Show the nth status-wrapper.
     * @param {number} n
     */
    public showStatus(n: number): void {
        this.statusHiddenData[n] = false;
    }

    /**
     * Expand menu.
     * @param {MouseEvent} event
     */
    expand(event: MouseEvent) {
        if (!this.mobile) {
            return;
        }

        if (!this.menuExpanded) {
            event.stopImmediatePropagation();
        }
        this.menuExpanded = !this.menuExpanded;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        if (!this.menu.nativeElement.contains(<Node>event.target) && this.menuExpanded) {
            this.menuExpanded = false;
        }
    }
}
