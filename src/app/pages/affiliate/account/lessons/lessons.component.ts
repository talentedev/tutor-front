import {Component, OnInit, ChangeDetectorRef} from '@angular/core';
import * as moment from 'moment';
import {Backend} from '../../../../lib/core/auth';
import {HttpResponse, HttpErrorResponse} from '@angular/common/http';
import {AlertService} from '../../../../services/alerts';
import { Media } from 'app/lib/core/media';

interface User {
    name: string;
    avatar: string;
}

interface Lesson {
    tutor: User;
    student: User;
    date: Date;
    payment: {
        status: number;
        earned: number;
    };
}

@Component({
    selector: 'learnt-affiliate-lessons',
    templateUrl: './lessons.component.html',
    styleUrls: ['../account.scss', './lessons.component.scss']
})
export class AffiliateLessonsComponent implements OnInit {
    /* Sorting type: 1 - completed, 2 - confirmed */
    public sortingType = 1;

    /* Current date */
    public currDate: Date;

    /* Lessons array */
    public lessons: Lesson[] = [];

    /* Loading flag */
    public loading: boolean;

    /* Mobile flag */
    public mobile: boolean;

    constructor(private backend: Backend,
                private alerts: AlertService,
                private media: Media,
                private cd: ChangeDetectorRef) {

        this.mobile = !media.query('gt-sm');
        media.watch('gt-sm').subscribe(event => {
        this.mobile = !event.active;
            if (!this.cd['destroyed']) {
                this.cd.detectChanges();
            }
        });
    }

    ngOnInit(): void {
        this.currDate = new Date();
        this.currDate.setHours(0, 0, 1, 0);

        this.fetch();
    }

    /**
     * Toggle the sorting type.
     */
    public toggleSort(): void {
        this.sortingType = (this.sortingType + 2) % 2 + 1;
        this.fetch();
    }

    /**
     * Sets a month before or after the set date.
     * @param {number} i
     */
    public setMonth(i: number): void {
        if ([-1, 1].indexOf(i) < 0) {
            return;
        }

        const now = moment(new Date());
        const timeSpan = moment(this.currDate).add(i, 'month');

        if (timeSpan.isAfter(now)) {
            return;
        }

        this.currDate = timeSpan.toDate();
        this.fetch();
    }

    /**
     * Fetches the lesson history from the API.
     */
    private fetch(): void {
        this.loading = true;
        this.lessons = [];

        const from = moment.utc(this.currDate).startOf('month').startOf('day')
        const to = moment(from).endOf('month')

        this.backend.getCurrentUserLessons(from, to, this.sortingType).subscribe(res => {
            if (res.data === undefined) {
                this.lessons = [];
            } else {
                const data: any[] = res.data
                this.lessons = data
                    .sort((x, y): number => {
                        // sort by 'ended_at'
                        const xDate = new Date(x.date), yDate = new Date(y.date);
                        if (xDate > yDate) { return -1; }
                        if (xDate < yDate) { return 1; }
                        return 0;
                    });
            }
            this.loading = false;
        }, (error: HttpErrorResponse) => {
            const err = error.error;// TEST
            if (err.message !== undefined) {
                const message = `Couldn't retrieve lessons. Error encountered: ${err.message}.`;
                this.alerts.alert('Error retrieving lessons', message);
            }
        });
    }
}
