import { Backend } from '../../lib/core/auth';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';
import { User } from '../../models';

@Component({
    selector: 'learnt-admin-tutors-pending',
    templateUrl: './admin-tutors-pending.component.html',
    styleUrls: ['./admin-tutors-pending.component.scss']
})
export class AdminTutorsPendingComponent implements OnInit {

    tutors: User[];

    constructor(private backend: Backend) {}

    ngOnInit() {
        this.backend.getPendingTutors().subscribe(users => this.tutors = users);
    }
}
