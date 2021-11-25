import {Component} from '@angular/core';
import {Auth} from '../../../lib/core/auth';
import {User} from '../../../models';
import {ActivatedRoute} from "@angular/router";

@Component({
    selector: 'learnt-lazy-profile',
    template: `
        <div [ngSwitch]="me.isAffiliate()" style="height:100%">
            <learnt-profile *ngSwitchCase="false"></learnt-profile>
            <learnt-affiliate-profile *ngSwitchCase="true"></learnt-affiliate-profile>
        </div>
    `
})
export class ProfileLazyComponent {
    public me: User;

    constructor(
        private route: ActivatedRoute,
    ) {
        this.me = route.snapshot.data.me;
    }
}
