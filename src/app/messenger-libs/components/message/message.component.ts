import { User } from 'app/models';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding, Input, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { BookingPanelService } from '../../../common/booking-panels/service';
import { Backend } from '../../../lib/core/auth';
import { Lesson } from '../../../models/lesson';
import { EmojiService } from '../../../services/emoji';
import { MessengerService } from '../../core/messenger.service';
import { File, Message, Thread } from '../../core/models';
import { NotificationsService } from "../../../services/notifications";
import _get from 'lodash-es/get';
import { getFileUrl } from "../../../lib/core/utils";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import isBefore from 'date-fns/isBefore';

@Component({
    selector: 'learnt-messenger-message',
    templateUrl: './message.component.html',
    styleUrls: ['./message.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessengerMessageComponent implements OnInit {

    @Input()
    message: Message;

    @Input()
    me: User;

    @Input()
    @HostBinding('class.tiny')
    tiny: boolean;

    public loading: boolean;
    public thread: Thread;
    private lesson: Lesson;
    savingFile = false;

    get expiry(): string {
        return formatDistanceToNow(new Date(this.message.body.expire), { addSuffix: true });
    }

    get isExpired(): boolean {
        return isBefore(new Date(this.message.body.expire), new Date());
    }

    @HostBinding('class.me')
    public get isMe(): boolean {
        return this.me._id == this.message.sender._id;
    }

    @HostBinding('class.notification')
    public get isNotification(): boolean {
        return this.message.type === 'notification';
    }

    constructor(private service: MessengerService,
                private cdRef: ChangeDetectorRef,
                private backend: Backend,
                private panels: BookingPanelService,
                private emojiService: EmojiService,
                private notifs: NotificationsService) {
    }

    ngOnInit(): void {
        if (['notification'].indexOf(this.message.type) === -1) {
            return;
        }

        this.getThread();
        this.getLesson();
    }

    private getLesson(): void {
        this.loading = true;
        const lessonID = this.message.data.data['lesson_id'];
        if (lessonID !== '') {
            this.backend.getLesson(lessonID, this.me).subscribe(lesson => {
                this.lesson = lesson;
                this.loading = false;
            }, (error: HttpErrorResponse) => console.log('[!] Error getting the lesson by ID', error.error));
        }
    }

    private getThread(): void {
        this.loading = true;
        this.service.getThreadById(this.message.thread).subscribe((t: Thread) => {
            this.thread = t;
            this.cdRef.markForCheck();
            this.loading = false;
        }, (error: HttpErrorResponse) => {
            console.log('[!] Error getting thread by ID', error.error); // TEST ERR
        });
    }

    public get other(): User {
        return this.thread.other;
    }

    public openRescheduler(): void {
        this.panels.openReschedulePanel(this.lesson)
    }

    saveToLibrary(): void {
        this.savingFile = true;
        this.backend.saveAttachmentToLibrary((this.message.body as File)._id).subscribe(data => {
            this.savingFile = false;
            this.notifs.notify('File saved', 'The file has been saved to your file library.');1
        }, (err) => {
            this.savingFile = false;
            console.error(err.error);
            const error = _get(err, 'error.message', 'Upload is missing or expired');
            this.notifs.notify('Save failed', error, 'close');
        });
    }

    getFileUrl = getFileUrl;
}
