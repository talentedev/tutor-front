import { CommonModule } from '@angular/common';
import { CommonComponentsModule } from '../common/common-components.module';
import { DialogsFacade } from './facade';
import { NgModule } from '@angular/core';
import { AddSubjectsComponent } from './add-subjects/add-subjects.component';
import { AddPhoneComponent } from './add-phone/add-phone.component';
import { AddDegreeDialogComponent } from './add-degree/add-degree';
import { ReactiveFormsModule } from '@angular/forms';
import { UserWaitingDialogComponent } from './user-waiting/user-waiting.component';
import { UserWaitedDialogComponent } from './user-waited/user-waited.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { AddCertificatesComponent } from './add-certificates/add-certificates.component';
import { SendMessageComponent } from './send-message/send-message.component';
import { RejectTutorComponent } from "./reject-tutor/reject-tutor.component";
import { MatSelectModule } from "@angular/material/select";
import { AddNoteComponent } from "./add-note/add-note.component";

@NgModule({
    declarations: [
        AddDegreeDialogComponent,
        AddSubjectsComponent,
        AddPhoneComponent,
        UserWaitingDialogComponent,
        UserWaitedDialogComponent,
        AddCertificatesComponent,
        SendMessageComponent,
        RejectTutorComponent,
        AddNoteComponent,
    ],
    exports: [
        MatDialogModule,
        MatInputModule,
        RejectTutorComponent,
        AddNoteComponent,
    ],
    entryComponents: [
        UserWaitingDialogComponent,
        UserWaitedDialogComponent,
        AddDegreeDialogComponent,
        AddSubjectsComponent,
        AddPhoneComponent,
        AddCertificatesComponent,
        SendMessageComponent
    ],
    imports: [
        MatDialogModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatAutocompleteModule,
        ReactiveFormsModule,
        CommonModule,
        CommonComponentsModule,
        MatSelectModule,
    ],
    providers: [
        DialogsFacade,
    ]
})
export class DialogsModule {
}
