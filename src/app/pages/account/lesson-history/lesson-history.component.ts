import {Component, OnInit} from '@angular/core';
import {Lesson} from '../../../models/lesson';
import {Auth, Backend} from '../../../lib/core/auth';
import * as moment from 'moment';
import {Timezone, TimezoneService} from '../../../services/timezone';
import {User} from '../../../models';
import { map } from 'rxjs/operators';

@Component({
    selector: 'learnt-lesson-history',
    templateUrl: './lesson-history.component.html',
    styleUrls: ['./lesson-history.component.scss']
})
export class LessonHistoryComponent implements OnInit {

    public working = false;
    public offset: moment.Moment;
    public lessons: Lesson[] = [];
    public other: User;

    private me: User;

    constructor(private auth: Auth,
                private backend: Backend,
                private timezoneService: TimezoneService) {
        this.offset = moment().hour(0).minute(0);
        this.auth.me.subscribe((u: User) => this.me = u);
    }

    ngOnInit(): void {
        this.fetch();
    }

    public withUser(u: User | null): void {
        this.other = u;
        this.fetch();
    }

    public navigate(dir: number) {
        this.offset.add(dir, 'month');
        this.fetch();
    }

    private fetch() {
        this.working = true;
        this.lessons = [];
        this.timezoneService.timezones.subscribe(
            (zones: Timezone[]) => this.getLessons(
                this.offset.clone().startOf('month'),
                this.offset.clone().endOf('month'),
                this.other ? this.other._id : null,
            )
        );
    }

    public getLessons(from: moment.Moment, to: moment.Moment, with_: string, state: string = 'all') {
        this.backend.getLessons(from, to, with_, state).subscribe((paginated: any) => {
            this.lessons = paginated.lessons.map(L => {
                const l: Lesson = new Lesson(L);
                
                // change time according to the user' timezone
                l.starts_at = l.starts_at.utc().tz(this.me.timezone);
                l.ends_at = l.ends_at.utc().tz(this.me.timezone);

                return l;
            });
            this.working = false;
        }, (err: any) => {
            this.working = false;
        });
    }
}
