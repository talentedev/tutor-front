import { Backend } from '../../lib/core/auth';
import { TutoringDegree, TutoringSubject, User } from '../../models';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AdminUserService } from "../services/admin-user.service";
import { Subscription } from "rxjs/Rx";

@Component({
    selector: 'learnt-admin-tutors-verification-details',
    templateUrl: './admin-tutors-verification-details.component.html',
    styleUrls: ['./admin-tutors-verification-details.component.scss']
})
export class AdminTutorsVerificationDetailsComponent implements OnInit {

    tutor: User;
    tutorId: string;
    subs = new Subscription();

    constructor(
        private backend: Backend,
        private router: ActivatedRoute,
        private userService: AdminUserService,
    ) {
        router.params.subscribe(
            params => {
                this.tutorId = params.tutor;
                this.fetch();
            }
        );
    }

    ngOnInit() {

    }

    fetch() {
        this.subs.add(this.userService.getUser(this.tutorId).subscribe(user => this.tutor = user));
    }

    verify(item) {

        let type, id;

        if (item instanceof TutoringSubject) {
            type = 'subject';
            id = item._id;
        }

        if (item instanceof TutoringDegree) {
            type = 'degree';
            id = item._id;
        }

        this.backend.verifyTutorResource(this.tutorId, type, id).subscribe(
            response => {
                this.fetch();
            }
        );
    }
}
