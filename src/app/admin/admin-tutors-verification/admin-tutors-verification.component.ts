import { Backend } from '../../lib/core/auth';
import { User } from '../../models';

import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

@Component({
    selector: 'learnt-admin-tutors-verification',
    templateUrl: './admin-tutors-verification.component.html',
    styleUrls: ['./admin-tutors-verification.component.scss']
})
export class AdminTutorsVerificationComponent implements OnInit {

    tutors: User[];

    constructor(private backend: Backend) { }

    ngOnInit() {
        this.backend.getUnverifiedTutors().subscribe(r => this.tutors = r);
    }

}
