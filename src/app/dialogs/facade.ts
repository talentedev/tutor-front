import { Injectable, Inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { User, Subject } from 'app/models';
import { AddDegreeDialogComponent } from './add-degree/add-degree';
import { AddSubjectsComponent } from './add-subjects/add-subjects.component';
import { AddPhoneComponent } from './add-phone/add-phone.component';
import { AddCertificatesComponent } from './add-certificates/add-certificates.component';
import { UserWaitingDialogComponent } from './user-waiting/user-waiting.component';
import { UserWaitedDialogComponent } from './user-waited/user-waited.component';
import { MicroEvents } from 'app/lib/core/common/events';
import { SendMessageComponent } from './send-message/send-message.component';

@Injectable()
export class DialogsFacade {
    
    constructor(private dialog: MatDialog, @Inject('bus') private bus: MicroEvents) {}

    showUserWaiting(user: User, duration: number): ()=>void {
        const mdr = this.dialog.open(UserWaitingDialogComponent, {
            disableClose: true,
        })
        mdr.componentInstance.init(user, duration);
        mdr.componentInstance.complete.subscribe(() => mdr.close());
        mdr.componentInstance.end.subscribe(() => {
            mdr.close()
            this.bus.emit('vcr.end');
        });

        return ():void => {mdr.close()}
    }

    showUserWaited(user: User, duration: number): ()=>void {
        const mdr = this.dialog.open(UserWaitedDialogComponent, {
            disableClose: true,
        })
        mdr.componentInstance.init(user, duration);
        mdr.componentInstance.complete.subscribe(() => this.bus.emit('vcr.wait'));
        mdr.componentInstance.end.subscribe(() => {
            mdr.close()
            this.bus.emit('vcr.wait.cancel');
        });

        return ():void => {mdr.close()}
    }

    showAddDegree(): MatDialogRef<AddDegreeDialogComponent> {
        return this.dialog.open(AddDegreeDialogComponent, {width: '825px'});
    }

    showAddSubjects(): MatDialogRef<AddSubjectsComponent> {
        return this.dialog.open(AddSubjectsComponent, {width: '825px'});
    }

    showAddPhone(): MatDialogRef<AddPhoneComponent> {
        return this.dialog.open(AddPhoneComponent, {width: '825px'});
    }

    showAddCertificates(subject): MatDialogRef<AddCertificatesComponent> {
        const mdr = this.dialog.open(AddCertificatesComponent, {width: '825px'})
        mdr.componentInstance.init(subject);

        return mdr;
    }

    showSendMessage(me: User, tutor: User): MatDialogRef<SendMessageComponent> {
        const mdr = this.dialog.open(SendMessageComponent, {width: '825px'})
        mdr.componentInstance.init(me, tutor);

        return mdr;
    }
}
