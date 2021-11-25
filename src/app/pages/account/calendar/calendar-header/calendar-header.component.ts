import {Component, OnInit, Input} from '@angular/core';
import {User} from '../../../../models';
import {Backend} from '../../../../lib/core/auth';

@Component({
    selector: 'learnt-calendar-header',
    templateUrl: './calendar-header.component.html',
    styleUrls: ['./calendar-header.component.scss']
})
export class CalendarHeaderComponent implements OnInit {

    public savingInstantSession: boolean;
    public savingInstantBooking: boolean;

    @Input()
    loading: boolean

    @Input()
    me: User;

    constructor(private backend: Backend) {
    }

    ngOnInit(): void {

    }

    /**
     * Update the instant session option.
     * @param {boolean} state
     */
    public onInstantSessionChange(state: boolean) {
        
        if (this.savingInstantSession) {
            return;
        }

        this.savingInstantSession = true;
        this.backend.setInstantSessionState(state).subscribe(() => {
            this.me.tutoring.instant_session = state;
            this.savingInstantSession = false;
        });
    }

    /**
     * Update the instant session option.
     * @param {boolean} booking
     */
    public onInstantBookingChange(booking: boolean) {
        if (this.savingInstantSession) {
            return;
        }

        this.savingInstantBooking = true;
        this.backend.setInstantBookingState(booking).subscribe(() => {
            this.me.tutoring.instant_booking = booking;
            this.savingInstantBooking = false;
        });
    }
}
