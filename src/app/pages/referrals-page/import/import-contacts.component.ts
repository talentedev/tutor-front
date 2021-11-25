import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ROUTE_REFERRALS } from 'routes';
import { Backend } from '../../../lib/core/auth';
import { IsEmail } from '../../../lib/helpers/functions';
import { User } from '../../../models';
import { AlertService } from '../../../services/alerts';
import { ImportContactProvider, ImportContactsProviders, Person } from '../exports';
import { HttpResponse } from '@angular/common/http';

@Component({
    templateUrl: './import-contacts.component.html',
    styleUrls: ['../referrals-page.component.scss', './import-contacts.component.scss']
})
export class ImportContactsComponent implements OnInit {
    public form: FormGroup;
    public loading: boolean;

    /**
     * States:
     * mustLogin - user must follow the provider link in order to get the state & code
     * inviteDone - user invited contacts
     */
    public mustLogin: boolean;
    public inviteDone: boolean;

    /**
     * People array.
     * @type {Person[]}
     */
    public people: Person[] = [];
    public peopleLength: number;

    /**
     * How many people were imported in the end.
     */
    public imported: number;

    public me: User;

    /**
     * OAuth2 provider set from route data.
     */
    private provider: ImportContactProvider;

    private inviteErrors: { [email: string]: { type: number, error: string } } = {};

    constructor(private route: ActivatedRoute,
                private router: Router,
                private backend: Backend,
                private formBuilder: FormBuilder,
                private alerts: AlertService,
                private cdRef: ChangeDetectorRef) {
        this.form = formBuilder.group({check: []});
        this.me = this.route.parent.snapshot.data.me

        this.route.params.subscribe(params => {
            if (params.provider === null || params.provider === undefined || ImportContactsProviders[params.provider] === undefined) {
                this.router.navigateByUrl(ROUTE_REFERRALS);
                return;
            }
            this.provider = ImportContactsProviders[params.provider];
            
        });
    }

    ngOnInit(): void {
        this.loading = true;
        this.mustLogin = true;
        this.route.queryParams.subscribe(params => {
            console.log(params);
            
            if (params.state === undefined || params.code === undefined) {
                this.router.navigateByUrl(ROUTE_REFERRALS);
                return;
            }

            if (params.state !== '' && params.code !== '') {
                this.mustLogin = false;
                this.getPeople(params);
            } else {
                this.router.navigateByUrl(ROUTE_REFERRALS);
                return;
            }
        });
    }

    /**
     * Get the people by sending the state & code to the API, which creates an OAuth client and sends the response.
     * @param params
     */
    private getPeople(params: any): void {
        this.people = [];
        this.backend.post('@api'+this.provider.StateURL, params).subscribe((res: HttpResponse<any>) => {
            const people: any = res.body; // TEST

            this.peopleLength = people.total;

            const checkPayload = {users: []};
            for (const p of people.people) {
                checkPayload.users.push({email: p.email});
            }

            this.backend.referCheck(checkPayload).subscribe(re => {

                for (const v of re.error) {
                    this.inviteErrors[v.email] = {type: v.error, error: v.message};
                }

                for (const p of people.people) {
                    this.people.push({
                        email: p.email,
                        name: p.name,
                        avatar: p.avatar || 'https://s3.amazonaws.com/tutorthepeople/temp/default-avatar.png',
                        check: this.inviteErrors[p.email] === undefined,
                    });
                }
                this.loading = false;
                this.cdRef.detectChanges();
            });
        }, err => {
            this.mustLogin = true;
            this.router.navigateByUrl(ROUTE_REFERRALS).then(t => this.alerts.alert('Couldn\'t receive data, please try again.'));
        });
    }

    /**
     * Toggle the check on a user.
     * @param {number} i
     */
    public toggleCheck(i: number) {
        const person = this.people[i];
        const inviteError = this.inviteErrors[person.email];

        if (person.check === true || inviteError === undefined) {
            person.check = !person.check;
            person.force = false;
            return;
        }

        let alert;
        const alertOpts = {lifetime: 0, buttons: [{label: 'OK', result: true}]};
        switch (inviteError.type) {
            case 1: // invalid email address
                alert = this.alerts.alert('Can\'t invite user', 'User has an invalid email address.', alertOpts);
                alert.result.subscribe(r => alert.dispose());
                break;
            case 2: // user already registered
                alert = this.alerts.alert('Can\'t invite user', 'User already has a registered account.', alertOpts);
                alert.result.subscribe(r => alert.dispose());
                break;
            case 3: // user already invited
                alertOpts.buttons = [{label: 'Yes', result: true}, {label: 'No', result: false}];
                const alertMessage = 'User was already invited in the last 7 days, are you sure you want to resend an invitation?';
                alert = this.alerts.alert('User already invited', alertMessage, alertOpts);

                alert.result.subscribe(r => {
                    if (r === true) {
                        this.people[i].check = !this.people[i].check;
                        this.people[i].force = true;
                    }
                    alert.dispose();
                });
                break;
        }
    }

    /**
     * Triggered by pressing the invite button after receiving the contacts from the provider.
     */
    public importContacts(): void {
        const payload = {
            users: [],
        };

        this.people.filter(person => person.check).forEach(person => {
            const email = person.email.trim();
            switch (true) {
                case email.indexOf('@') < 0:
                case !IsEmail(email):
                    return;
            }
            const referral = {email: email, name: person.name};
            if (person.force === true) {
                referral['force'] = true;
            }
            payload.users.push(referral);
        });

        this.imported = payload.users.length;

        this.backend.referInvite(payload).subscribe(res => {
            this.inviteDone = true;
        });
    }

    /**
     * Returns the number of checked contacts.
     * @return {number}
     */
    public getChecked(): number {
        let num = 0;
        for (const person of this.people) {
            if (person.check === true) {
                num++;
            }
        }
        return num;
    }

    /**
     * Deselects all contacts' checkboxes.
     */
    public deselectAll(): void {
        for (const person of this.people) {
            person.check = false;
        }
    }
}
