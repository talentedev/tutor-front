import {Component} from '@angular/core';
import {Auth} from '../../lib/core/auth';
import {User} from '../../models';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'learnt-lazy-account',
    template: `
        <div class="account-page-wrapper" [ngSwitch]="route.parent.snapshot.data.me.isAffiliate()">
            <learnt-account-page *ngSwitchCase="false"></learnt-account-page>
            <learnt-affiliate-profile-menu *ngSwitchCase="true"></learnt-affiliate-profile-menu>
        </div>
    `,
    styleUrls: [
        './account.component.scss',
    ],
})
export class AccountComponent {
    constructor(public route: ActivatedRoute) {}
}
