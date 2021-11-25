import { ActivatedRoute } from '@angular/router';
import {Component} from '@angular/core';
import {User} from '../../models';

@Component({
    selector: 'learnt-lazy-dashboard',
    templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
    public user: User;
    constructor(private route: ActivatedRoute) {
        this.user = this.route.parent.snapshot.data.me;
    }
}
