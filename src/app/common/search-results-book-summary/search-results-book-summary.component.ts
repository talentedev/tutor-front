import { AlertService } from '../../services/alerts';
import { Auth, Backend } from '../../lib/core/auth';
import { Router } from '@angular/router';
import { User } from '../../models';
import { Component, Injector, Input, OnInit } from '@angular/core';
import * as moment from 'moment';
import { map } from 'rxjs/operators';

@Component({
    selector: 'learnt-search-results-book-summary',
    templateUrl: './search-results-book-summary.component.html',
    styleUrls: ['./search-results-book-summary.component.scss']
})
export class SearchResultsBookSummaryComponent implements OnInit {

    @Input()
    tutor: User;

    me: User;

    recurring: string;

    data: any;

    success = false;

    constructor(
        private injector: Injector,
        private router: Router,
        private backend: Backend,
        private alerts: AlertService,
        private auth: Auth
    ) {
        auth.me.subscribe(me => this.me = me);
    }

    ngOnInit() {}

    getMeetTypeLabel() {

        if (parseInt(this.data.meet, 10) === 2) {
            return 'Meet online';
        }

        return 'Meet In Person';
    }

    getTimeLabel() {
        const from = moment(this.data.date);
        const to = from.clone();
        to.add(this.data.duration, 'minute');
        let a = from.format('ha');
        let b = to.format('ha');

        if (from.minutes() !== 0) {
            a = from.format('hh:mm a');
        }

        if (to.minutes() !== 0) {
            b = to.format('hh:mm a');
        }

        return `From ${a} to ${b}`;
    }

    getRecurringLabel() {

        const recurring = this.data.recurring;

        if (recurring === 'weekly') {
            return  'Recurring Weekly';
        }

        if (recurring === 'monthly') {
            return  'Recurring Monthly';
        }

        return 'No recurring';
    }

    getDayLabel() {
        const m = moment(this.data.date);
        if (m.isSame(moment(), 'week')) {
            return m.format('dddd');
        }
        return m.format('dddd MMMM DD');
    }

    getAmount() {
        const hours = this.data.duration / 60;
        return hours * this.tutor.tutoring.rate;
    }

    edit() {
        this.injector.get('results').setExpandView('book', this.data);
    }

    init(data: any) {
        this.data = data;
        this.tutor = data.tutor;
    }

    todo() {
        alert('Not implemented yet!');
    }

    submit() {

        const payload: any = {
            tutor: this.tutor._id,
            student: this.me._id,
            when: moment(this.data.date).toJSON(),
            duration: this.data.duration + 'm',
            subject: this.data.subject_id,
            meet: this.data.meet,
        };

        if (this.data.meet_location) {
            payload.location = this.data.meet_location;
        }

        this.backend.createLesson(payload).subscribe(
            response => {
                this.success = true;
                setTimeout( () => {
                    this.injector.get('results').updateExpandViewHeight();
                }, 500);
            },
            response => {
                //FIXME: Is createLesson return Response?
                this.alerts.alert(response.json().error);
                this.edit();
            }
        );
    }
}
