import {Component} from '@angular/core';
import {Auth} from '../../lib/core/auth';
import {User} from '../../models';

@Component({
    template: `
        <ng-container [ngSwitch]="isAffiliate">
            <learnt-affiliate-lessons *ngSwitchCase="true"></learnt-affiliate-lessons>
            <learnt-lesson-history *ngSwitchDefault></learnt-lesson-history>
        </ng-container>
    `,
})
export class LessonsLazyComponent {
    public isAffiliate = false;

    constructor(private auth: Auth) {
        this.auth.me.subscribe((u: User) => this.isAffiliate = u.isAffiliate());
    }
}
