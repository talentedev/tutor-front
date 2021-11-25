import { Component } from '@angular/core';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { BookingPanelService } from '../../../common/booking-panels/service';
import { Auth, Backend } from '../../../lib/core/auth';
import { User } from '../../../models';
import { NotificationsService } from '../../../services/notifications';
import { SidePlaceholder } from '../../core/models';

@Component({
    selector: 'learnt-messenger-profile',
    templateUrl: './messenger-profile.component.html',
    styleUrls: ['./messenger-profile.component.scss']
})
export class MessengerProfileComponent implements SidePlaceholder {
    public loading = true;

    /* the other participant */
    public user: User;
    private userID: string;

    private me: User;

    constructor(private auth: Auth,
                private backend: Backend,
                private notifications: NotificationsService,
                private panels: BookingPanelService) {
        this.auth.me.subscribe((u: User) => this.me = u);
    }

    public setTutorId(id: string): void {
        this.userID = id;
    }

    public onShow(): void {
        if (!this.userID) {
            throw new Error('User ID is missing from profile side component.');
        }

        this.backend.getUser(this.userID).subscribe(user => {
            this.user = user;
            this.loading = false;
        }, (error: HttpErrorResponse) => {
            this.loading = false;
            this.notifications.notify('Couldn\'t get user', 'We couldn\'t get the user at this time, please try again later.', 'close');
        });
    }

    public onHide(): void {
    }

    public book(instant = false): void {

        if (instant) {
            this.panels.openInstantSessionPanel(this.user)
        } else {
            this.panels.openBookingPanel(this.user)
        }
    }

    public get hasRating(): boolean {

        if (!this.user.isTutor()) {
            return false;
        }

        const hasTutoring = this.user.tutoring !== null && this.user.tutoring !== undefined;
        const hasRating = this.user.tutoring.rating !== null && this.user.tutoring.rating !== undefined;
        return hasTutoring && hasRating;
    }
}
