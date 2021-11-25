import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import { map } from 'rxjs/operators';
import {ImportContactsProviders, ReferralLink, ReferralUser} from '../../referrals-page/exports';
import {Backend} from '../../../lib/core/auth';
import {SocialSharing, FacebookShare} from '../../../services/social';
import {isUndefined} from 'util';
import {ProfileComponent} from '../../account/profile/profile.component';
import {AlertService} from '../../../services/alerts';
import {HttpResponse, HttpErrorResponse} from '@angular/common/http';
import {NotificationsService} from '../../../services/notifications';
import {Transaction} from '../../../models';
import {environment} from '../../../../environments/environment';

@Component({
    selector: 'learnt-affiliate-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
})
export class AffiliateDashboardComponent implements OnInit {
    public inviteForm: FormGroup;

    /**
     * Social sharing links.
     */
    public referralLink: string;
    public facebookLink: string;
    public messengerLink: string;

    public referrals: ReferralUser[] = [];
    public referralsTotal: number;
    public referralsCredit = 0;

    public transactions: Transaction[];

    public importLoading: boolean;

    private referralCode: string;

    constructor(private backend: Backend,
                private formBuilder: FormBuilder,
                private socialShare: SocialSharing,
                private alerts: AlertService,
                private notifications: NotificationsService) {
        this.inviteForm = formBuilder.group({email: ['', Validators.required]});
    }

    ngOnInit(): void {
        this.getReferData();
        this.getTransactions();
    }

    public import(service: string): void {
        if (this.importLoading) {
            return;
        }

        this.importLoading = true;
        this.backend.getContactsImportURL(service).subscribe(url => {
            window.location.href = url
            this.importLoading = false;
        })
    }

    /**
     * Send manual email invites
     * @param event
     */
    public sendInvites(event): void {
        event.stopPropagation();
        event.preventDefault();

        const payload = {
            users: [],
        };

        for (let email of this.inviteForm.get('email').value.split(',')) {
            email = email.trim();
            payload.users.push({email});
        }

        this.backend.referInvite(payload).subscribe(res => {
            const invited = res['invited'], errors = res['errors'];

            const alertOpts = {lifetime: 0, buttons: [{label: 'OK', result: true}]};
            let alertMessage = `Successfully invited <strong>${invited.length} ${invited.length === 1 ? 'user' : 'users'}.</strong>`;

            if (errors.length > 0) {
                alertMessage += `<br>However, we couldn't send invites to the following accounts:<br>`;
                for (const err of errors) {
                    alertMessage += `- ${err['email']}: ${err['message']}<br>`;
                }
            } else {
                this.inviteForm.get('email').setValue('');
            }

            const alert = this.alerts.alert('Invitations sent', alertMessage, alertOpts);
            alert.result.subscribe(r => alert.dispose());
            this.getReferData();
        });
    }

    /**
     * Get the refer links for invite link & invite status.
     */
    private getReferData(): void {
        this.backend.getRefer(1,3).subscribe(res => {
            this.referralLink = environment.HOST + '/start/promo/' + res.referral_code;
            this.buildSocialLinks();
            this.referralsTotal = res.links.total;
            if (this.referralsTotal > 0) {
                this.buildReferrals(res.links.data);
            }
        });
    }

    private getTransactions(): void {
        this.transactions = [];
        this.backend.getTransactions().subscribe(
            (transactions) => {
                transactions.forEach(t => this.referralsCredit += t.amount > 0 ? t.amount : 0);
                if (transactions.length > 3) {
                    transactions = transactions.splice(0, 3);
                }
                transactions.forEach(t => this.transactions.push(new Transaction(t)));
            }, (error: HttpErrorResponse) => {
                if (!environment.production) {
                    console.log('[!] Couldn\'t get transactions:', error.error);
                }
                this.notifications.notify('Couldn\'t get transactions', 'An error occurred getting transactions.');
                this.referralsCredit = 0;
            }
        );
    }

    /**
     * Build the referral users array.
     * @param {ReferralLink[]} referralLinks
     * @param {number} limit
     */
    private buildReferrals(referralLinks: ReferralLink[], limit: number = 0): void {
        this.referrals = [];
        for (const key in referralLinks) {
            const link = referralLinks[key];

            let user: ReferralUser;

            if (isUndefined(link.referral)) {
                const d = new Date(link['created_at']);
                user = {
                    email: link['email'],
                    avatar: 'https://s3.amazonaws.com/tutorthepeople/temp/default-avatar.png',
                    amount: 10,
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
    }

    /**
     * Build social links for sharing.
     */
    private buildSocialLinks(): void {
        let facebookShare: FacebookShare;
        facebookShare = {
            url: this.referralLink,
            quote: ''
        }
        this.facebookLink = this.socialShare.FacebookByLink(facebookShare, window.location.href);
        this.messengerLink = this.socialShare.MessengerByLink(this.referralLink, window.location.href);
    }
}
