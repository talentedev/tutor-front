import {Component, Input, OnInit} from '@angular/core';
import { map } from 'rxjs/operators';
import {Auth, Backend} from '../../lib/core/auth';
import {User} from '../../models';


@Component({
    selector: 'learnt-referral-box',
    templateUrl: './referrals-box.component.html',
    styleUrls: ['./referrals-box.component.scss']
})
export class ReferralsBoxComponent implements OnInit {
    @Input()
    public referralLink: string;

    @Input()
    public facebookLink: string;

    @Input()
    public twitterLink: string;

    public balance: number;

    public me: User;

    constructor(private backend: Backend,
                private auth: Auth) {
        this.auth.me.subscribe((u: User) => this.me = u);
    }

    ngOnInit(): void {
        this.balance = 0;
        this.backend.getBalance().subscribe(balance => {
            // we receive the balance in negative cents
            this.balance = Math.abs(balance / 100);
        });
    }
}
