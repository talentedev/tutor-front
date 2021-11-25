import {Component, ElementRef, EventEmitter, Output, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Lesson} from '../../models/lesson';
import {HttpResponse, HttpErrorResponse} from '@angular/common/http';
import {Backend} from '../../lib/core/auth';
import {NotificationsService} from '../../services/notifications';
import * as moment from 'moment';

@Component({
    selector: 'learnt-cancel-lesson-dialog',
    templateUrl: './cancel-lesson.component.html',
    styleUrls: ['./cancel-lesson.component.scss'],
})
export class CancelLessonDialogComponent {
    public understood = true;
    public loading = false;
    public pristine = true;

    @Output()
    done: EventEmitter<boolean> = new EventEmitter<boolean>();

    @ViewChild('reason')
    reason: ElementRef;
    public lesson: Lesson;

    constructor(private dialog: MatDialog,
                private backend: Backend,
                private notifications: NotificationsService) {
    }

    public set Lesson(l: Lesson) {
        this.lesson = l;
        const diff = this.lesson.starts_at.diff(moment(), 'hours');
        if (diff >= 0 && diff <= 24) {
            this.understood = false;
        }
    }

    public close(): void {
        this.dialog.closeAll();
    }

    public cancel(): void {
        if (this.reason === undefined) {
            return;
        }
        const element = <HTMLElement>this.reason.nativeElement;
        const reason = element.innerText.trim();
        if (reason === '') {
            return;
        }

        this.loading = true;

        this.backend.cancelLesson(this.lesson._id, reason).subscribe(() => {
            this.loading = false;
            this.done.next(true);
            this.notifications.notify('Lesson Cancelled', 'We will notify the other participant you cancelled your class.');
            this.close();
        }, (error: HttpErrorResponse) => {
            this.loading = false;
            this.notifications.notify('Couldn\'t cancel lesson', 'Couldn\'t cancel the lesson, please try again later.', 'close');
        });
    }
}
