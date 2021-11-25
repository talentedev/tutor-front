import { Component, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { BookingComponent } from 'app/common/booking/booking.component';
import { SocketService } from 'app/lib/core/socket';
import { Subscription } from 'rxjs/Rx';
import { User } from '../../../models';
import { Lesson } from '../../../models/lesson';
import { PanelData, SidePanel } from '../panel';
import { Backend } from './../../../lib/core/auth/backend';

@Component({
    selector: 'learnt-booking-panel',
    templateUrl: './booking-panel.component.html',
    styleUrls: ['../booking-panel.scss', './booking-panel.component.scss']
})
export class BookingPanelComponent extends SidePanel implements  OnInit, OnDestroy {
    
    @ViewChild('panel', {read: ViewContainerRef})
    public panel: ViewContainerRef;

    @ViewChild('booking')
    public booking: BookingComponent

    public tutor: User;
    public lesson: Lesson;
    
    public editing = false;

    private tutorProfileUpdate: Subscription;

    constructor(private socket: SocketService,
                private backend: Backend) {
        super();
    }

    onData(data: PanelData) {
        data.apply(this, "tutor")
    }

    ngOnInit(): void {
        this.tutorProfileUpdate = this.socket.on('tutor.profile.update').subscribe(
            (event) => {
                this.backend.getUser(this.tutor._id).subscribe(
                    user => {
                        this.tutor = user;
                        this.booking.onTutorUpdate(event.data.what);
                    }
                )
            }
        );
    }

    ngOnDestroy() {
        this.tutorProfileUpdate.unsubscribe();
    }
}
