import {
    Component,
    ComponentRef,
    ElementRef,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    QueryList,
    SimpleChanges,
    ViewChildren
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { List } from 'immutable';
import * as moment from 'moment';
import { Subscription } from 'rxjs/Subscription';
import { CancelLessonDialogComponent } from '../../dialogs/cancel-lesson/cancel-lesson.component';
import { Auth, Backend } from '../../lib/core/auth';
import { Notification, User } from '../../models';
import { Lesson } from '../../models/lesson';
import { NotificationsService } from '../../services/notifications';
import { Timezone, TimezoneService } from '../../services/timezone';
import { BookingPanelComponent } from '../booking-panels/booking/booking-panel.component';
import { BookingPanelService } from '../booking-panels/service';

@Component({
    selector: 'learnt-lesson-listing',
    templateUrl: './lesson-listing.component.html',
    styleUrls: ['./lesson-listing.component.scss']
})
export class LessonListingComponent implements OnChanges, OnInit, OnDestroy {
    @Input()
    other: User;

    @Input()
    perMonth = false;

    @Input()
    paginated = false;

    @Input()
    interactive: boolean;

    @Input()
    limit = 10;

    @ViewChildren('lessonMenuElem')
    lessonMenuElems: QueryList<ElementRef>;

    public pageNum = 0;

    public count = 0;

    public date = moment();

    public lessons: Lesson[] = [];

    public lessonMenu = -1;

    public working: boolean;

    private me: User;

    private subscriptions: Subscription = new Subscription();

    constructor(
        private backend: Backend,
        private auth: Auth,
        private timezoneService: TimezoneService,
        private notificationsService: NotificationsService,
        private panels: BookingPanelService,
        private dialog: MatDialog
    ) {
        this.subscriptions.add(
            this.notificationsService.notifications.subscribe((newNotif: List<Notification>) => {
                this.checkNotification(newNotif);
            })
        );

        this.subscriptions.add(this.auth.me.subscribe((u: User) => (this.me = u)));
    }

    ngOnInit(): void {
        this.fetch();
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.user) {
            this.fetch();
        }
    }

    private checkNotification(newNotif: List<Notification>) {
        const lastNotification = newNotif.get(0);
        if (!lastNotification) {
            return;
        }

        // need update if:
        switch (lastNotification.type) {
            // LessonBooked
            case 1:
            // LessonAccepted
            case 2:
            // LessonChangeRequestAccepted
            case 14:
                this.fetch();
                break;
            default:
                break;
        }
    }

    public getPage(p: number): void {
        const offset = p * this.limit;
        this.pageNum = p;
        this.fetch(offset);
    }

    public get pages(): number {
        return Math.ceil(this.count / this.limit);
    }

    public navigate(dir: number): void {
        this.date.add(dir, 'month');
        this.fetch();
    }

    private fetch(offset = 0): void {
        this.lessonMenu = -1;
        this.working = true;

        this.timezoneService.timezones.subscribe(() => {
            this.backend.getLessons(
                this.date.clone().startOf('month'), 
                this.date.clone().endOf('month'), 
                this.other ? this.other._id : null,
                'all',
                offset,
                5,
            ).subscribe(
                (data: {lessons: Lesson[], length: number}) => {
                    // account timezone changes 
                    
                    this.lessons = data.lessons.map(lesson => { 
                        lesson.starts_at = lesson.starts_at.utc().tz(this.me.timezone);
                        lesson.ends_at = lesson.ends_at.utc().tz(this.me.timezone);
                        return lesson;
                    });
                    this.count = data.length;
                    this.working = false;
                },
                () => {
                    this.working = false;
                }
            );
        });
    }

    public onLessonClick(index: number): void {
        if (index < 0 || index > this.lessons.length) {
            return;
        }

        const lesson = this.lessons[index];

        if (!this.interactive) {
            if (lesson.state === 2) {
                const url = `//${window.location.host}/main/class/${lesson.room}`;
                const features = `location=no,height=${screen.height},width=${screen.width},scrollbars=yes,status=no`;
                const w = window.open(url, '_blank', features);
                w.moveTo(0, 0);
            }
            return;
        }

        if (this.lessonMenu === index) {
            this.lessonMenu = -1;
        } else {
            this.lessonMenu = index;
        }

        const menuElem: HTMLElement = this.lessonMenuElems.toArray()[index].nativeElement;
        const windowBot = window.document.documentElement.getBoundingClientRect().bottom;
        const menuElemSize = menuElem.getBoundingClientRect();

        // menu's height is 96px
        if (menuElemSize.height === 0 && menuElemSize.top >= windowBot - 100) {
            menuElem.scrollIntoView({ inline: 'end' });
        }
    }

    public canBeModified(l: Lesson): boolean {
        const hasChangeRequests = l.change_proposals !== null && l.change_proposals !== undefined && l.change_proposals.length > 0;
        const isNotAccepted = l.accepted.length !== l.students.length + 1;
        if (hasChangeRequests && isNotAccepted) {
            return false;
        }

        switch (l.state) {
            case Lesson.State.Progress:
            case Lesson.State.Completed:
            case Lesson.State.Cancelled:
                return false;
            default:
                return true;
        }
    }

    public canBeCancelled(l: Lesson): boolean {
        switch (l.state) {
            case Lesson.State.Cancelled:
                return false;
            default:
                return true;
        }
    }

    public cancelLesson(l: Lesson): void {
        if (!this.canBeCancelled(l)) {
            return;
        }

        const ref: MatDialogRef<CancelLessonDialogComponent> = this.dialog.open(CancelLessonDialogComponent);
        const comp: CancelLessonDialogComponent = ref.componentInstance;

        comp.Lesson = l;
        comp.done.subscribe(cancelled => this.fetch());
    }

    public editLesson(lesson: Lesson): void {

        if (!this.canBeModified(lesson)) {
            return;
        }

        this.panels.openBookingPanel(lesson.tutor, lesson).then(
            () => this.fetch()
        )
    }
}
