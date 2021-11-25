import {Lesson} from '../../models/lesson';
import {TimeRange, Time} from '../../lib/calendar/services/models';
import {PopoverTooltipDirective} from '../directives/popover-tooltip';
import {AccountService} from '../../services/account';
import {User} from '../../models';
import {Backend} from '../../lib/core/auth';
import {Router} from '@angular/router';
import {Auth} from '../../lib/core/auth/auth';
import {ChangeDetectorRef, Component, Injector, Input, OnInit, ViewChild} from '@angular/core';
import * as moment from 'moment';
import { map } from 'rxjs/operators';

@Component({
    selector: 'learnt-search-results-book',
    templateUrl: './search-results-book.component.html',
    styleUrls: ['./search-results-book.component.scss'],
})
export class SearchResultsBookComponent implements OnInit {

    @ViewChild('tooltipSubjects', {read: PopoverTooltipDirective})
    tooltipSubjects: PopoverTooltipDirective;

    @ViewChild('tooltipOnline', {read: PopoverTooltipDirective})
    tooltipOnline: PopoverTooltipDirective;

    @Input()
    tutor: User;

    timezone: any;

    subjects: any[];

    lessons: Lesson[];

    subject: any;

    meet = 2;

    data: any;

    meetLocation = '';

    meetLocationEditing: boolean;

    date = moment().add(1, 'day');

    offset = moment();

    recurring: boolean;

    time: TimeRange = new TimeRange(
        new Time(9, 0),
        new Time(10, 0)
    );

    days: Date[] = [];

    constructor(
        private auth: Auth,
        private router: Router,
        public account: AccountService,
        private injector: Injector,
        private backend: Backend,
        private cRef: ChangeDetectorRef
    ) {
        auth.me.subscribe(
            me => this.timezone = me ? me.timezone : null
        );
    }

    init(data: any) {

        this.data = data;

        const results = this.injector.get('results');

        if (!this.auth.isLoggedIn()) {
            results.setExpandView('login', data);
            return;
        }

        this.auth.me.subscribe(me => {
            if (!me.cc) {
                results.setExpandView('cc', data);
            }
        });

        this.tutor = data.tutor;

        this.backend.getUserLessons(this.tutor._id).subscribe(
            lessons => this.lessons = lessons
        );

        if (!this.tutor || !this.tutor.tutoring.subjects) {
            return;
        }

        this.subjects = this.tutor.tutoring.subjects.slice(0);

        if (this.subjects.length && !this.subject) {
            this.subject = this.subjects[0].subject;
            this.subjects[0].selected = true;
        }

        if (data.date) {
            this.date = moment.utc(data.date);
            this.offset = this.date.clone().add(-3, 'day');
        }

        if (data.recurring) {
            this.recurring = data.recurring;
        }

        if (data.duration) {
            this.time = TimeRange.from(this.date.toDate(), data.duration);
        }

        if (data.meet) {
            this.meet = parseInt(data.meet, 10);
        }

        if (data.meet_location) {
            this.meetLocation = data.meet_location;
        }

        if (data.subject_id && data.subject_name) {
            this.subject = {
                _id: data.subject_id,
                name: data.subject_name,
            };
        }

        this.days = this.getDays();
    }

    ngOnInit() {
    }

    changeSubject(item: any) {
        this.subjects.forEach(s => s.selected = false);
        item.selected = true;
        this.tooltipSubjects.detectChanges();
        this.subject = item.subject;
        this.tooltipSubjects.hide();
    }

    changeMeetType(meet: any) {
        this.meet = meet;
        this.tooltipOnline.detectChanges();
    }

    editMeetLocation() {
        this.meetLocationEditing = true;
        this.tooltipOnline.detectChanges();
    }

    changeTimezone() {
        this.account.changeTimezone().subscribe(timezone => {
            this.timezone = timezone;
            this.cRef.detectChanges();
        });
    }

    changeDay(date: moment.Moment) {
        this.date = date;
    }

    dayIsDisabled(day: moment.Moment) {
        return day.isBefore(new Date());
    }

    navDay(delta: number) {

        if (delta === -1 && moment().add(-2, 'day').isAfter(this.offset)) {
            return;
        }

        this.offset.add(delta, 'day');
        this.days = this.getDays();
    }

    getDays(): Date[] {
        const x = this.offset.clone();
        const days = [];
        for (let i = 0; i < 8; i++) {
            days.push(x.clone());
            x.add(1, 'day');
        }
        return days;
    }

    isDaySelected(date: moment.Moment) {
        return this.date.isSame(date, 'day');
    }

    cancel() {
        this.injector.get('results').closeExpandView();
    }

    cancelMeetLocation() {
        this.meetLocationEditing = false;
        this.tooltipOnline.detectChanges();
    }

    saveMeetLocation(value: any) {
        this.meetLocation = value;
        this.cancelMeetLocation();
    }

    save() {

        const date = this.date.clone().toDate();
        this.time.min.updateDate(date);

        const data = {
            date: date,
            duration: this.time.duration,
            subject_name: this.subject.name,
            subject_id: this.subject._id,
            meet: this.meet,
            meet_location: this.meetLocation,
            recurring: this.recurring,
            tutor: this.tutor,
        };

        this.injector.get('results').setExpandView('book-summary', data);
    }
}
