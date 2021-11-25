import { Component, ElementRef, HostBinding, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { ROUTE_ANIMATION_DEFAULT } from '../../app.animation';
import { Backend } from '../../lib/core/auth';
import { User } from '../../models';
import { AlertService } from '../../services/alerts';
import { FacebookShare, SocialSharing } from '../../services/social';
import { ProfileComponent } from '../account/profile/profile.component';
import { ImportContactsProviders, ReferralLink, ReferralUser } from './exports';
import { environment } from 'environments/environment';

@Component({
    selector: 'learnt-referrals-page',
    templateUrl: './referrals-page.component.html',
    styleUrls: ['./referrals-page.component.scss'],
    animations: [ROUTE_ANIMATION_DEFAULT]
})
export class ReferralsPageComponent implements OnInit {

    @HostBinding('class.page-component')
    isPageComponent = true;

    @ViewChild('contacts')
    public contacts: ElementRef;

    public inviteForm: FormGroup;
    public inviteLoading: boolean;
    public importLoading: boolean;

    public referrals: ReferralUser[] = [];
    public referralsLimit = 3;
    public referralsTotal: number;
    public referralsCredit = 0;

    public referralLink: string;
    public referralCode: string;

    public isTutor: boolean;

    public messengerLink: string;
    public facebookLink: string;
    public me: User;

    constructor(private alerts: AlertService,
                private backend: Backend,
                private route: ActivatedRoute,
                private socialShare: SocialSharing) {
        this.me = this.route.parent.snapshot.data.me
        this.inviteForm = new FormGroup({
            email: new FormControl('', Validators.required)
        });
    }

    ngOnInit(): void {
        this.isTutor = this.me.isTutor();
        this.getReferData();
    }

    /**
     * Get the refer links.
     */
    private getReferData(): void {
        this.backend.getRefer().subscribe(res => {
            this.referralCode = res.referral_code;
            this.referralLink = environment.REFERRAL_URL + '/start/promo/' + this.referralCode
            this.buildSocialLinks();
            this.referralsTotal = res.links.total;
            if (this.referralsTotal > 0) {
                this.buildReferrals(res.links.data, this.referralsLimit);
            }
        });
    }

    /**
     * Build the referral users array.
     * @param {ReferralLink[]} referralLinks
     * @param {number} length
     */
    private buildReferrals(referralLinks: ReferralLink[], length: number = 0): void {
        this.referrals = [];
        this.referralsCredit = 0;

        if (length < 1 || length > referralLinks.length) {
            length = referralLinks.length;
        }

        for (const k in referralLinks) {
            if (referralLinks[k]['referral'] === undefined) {
                // don't count sent invitations
                continue;
            }

            if (referralLinks[k]['completed'] === false) {
                // don't count unsatisfied refer links
                continue;
            }

            this.referralsCredit += referralLinks[k].amount;
        }

        for (let k = 0; k < length; k++) {
            const link = referralLinks[k];

            let user: ReferralUser;

            if (link['referral'] === undefined) {
                const d = new Date(link['created_at']);
                user = {
                    email: link['email'],
                    avatar: 'https://s3.amazonaws.com/tutorthepeople/temp/default-avatar.png',
                    amount: 15,
                    status: link.step,
                    date: `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`,
                    type: link['type'],
                    completed: false,
                };

                this.referrals[k] = user;
            } else {
                this.backend.getUser(link.referral).subscribe(user => {
                    const d = new Date(link['created_at']);
                    this.referrals[k] = {
                        email: user.email,
                        firstname: user.profile.first_name,
                        lastname: user.profile.last_name,
                        avatar: (user.profile.avatar ? user.profile.avatar.href : ''),
                        amount: link.amount,
                        status: link.step,
                        date: `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`,
                        type: link['type'],
                        completed: link.completed,
                    };
                });
            }
        }
    }

    todo(msg?: string) {
        this.alerts.alert(msg ? msg : 'Not implemented yet!');
    }

    /**
     * Send manual email invites
     * @param event
     */
    public sendInvites(event): void {
        event.stopPropagation();
        event.preventDefault();

        if (this.inviteLoading) {
            return;
        }

        this.inviteLoading = true;

        const payload = {
            users: [],
        };

        const value: string = this.inviteForm.get('email').value;
        for (let email of value.split(',')) {
            email = email.trim();
            payload.users.push({email});
        }

        this.backend.referInvite(payload).subscribe(res => {
            const invited = res.invited, errors = res.errors;
            var len = 0;
            const alertOpts = {lifetime: 0, buttons: [{label: 'OK', result: true}]};
            if (invited) {
                len = invited.length;
            }
            let alertMessage = `Successfully invited <strong>${len} ${len === 1 ? 'user' : 'users'}.</strong>`;

            if (errors) {
                if (errors.length > 0) {
                    alertMessage += `<br>However, we couldn't send invites to the following accounts:<br>`;
                    for (const err of errors) {
                        alertMessage += `- ${err['email']}: ${err['message']}<br>`;
                    }
                }
            }

            const alert = this.alerts.alert('Invitations sent', alertMessage, alertOpts);
            alert.result.subscribe(() => alert.dispose());
            this.inviteForm.get('email').setValue('');
            this.getReferData();

            this.inviteLoading = false;
        });
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
     * Build social links for sharing.
     */
    private buildSocialLinks(): void {
        this.messengerLink = this.socialShare.MessengerByLink(this.referralLink, window.location.href);
        const facebookShare: FacebookShare = {
            url: this.referralLink,
            quote: `Get $15 off your first lesson. Join ${this.me.name} on Learnt, and learn or teach in your free time.`
        }
        this.facebookLink = this.socialShare.FacebookByLink(facebookShare, window.location.href);
    }

    public scrollToContacts(): void {
        (<HTMLDivElement>this.contacts.nativeElement).scrollIntoView({behavior: 'smooth'});
    }
    
    ngAfterViewInit() {
        const script = document.createElement('script');
        script.src = `https://connect.facebook.net/en_US/sdk.js#version=v9.0&appId=${environment.FacebookAppID}&xfbml=false`;
        document.body.appendChild(script);
    }

    sendMessenger(event: Event) {
        event.preventDefault();
        window['FB'].ui({
            method: 'send',
            link: this.referralLink,
        }, function(response) {
            console.log(response);
        });
    }
}
