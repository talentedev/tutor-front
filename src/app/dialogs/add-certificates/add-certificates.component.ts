import { Backend } from '../../lib/core/auth';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Component, EventEmitter } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'learnt-add-certificates',
    templateUrl: './add-certificates.component.html',
    styleUrls: ['./add-certificates.component.scss']
})
export class AddCertificatesComponent {

    form: FormGroup;

    saving: boolean;
    success: boolean;
    noUpload = false;
    subject: any;

    public readonly done: EventEmitter<boolean> = new EventEmitter<boolean>();

    constructor(private dialog: MatDialogRef<AddCertificatesComponent>,
                private backend: Backend) {

        this.form = new FormGroup({
            certificate: new FormControl('', Validators.required),
        });
    }

    init(subject) {

        this.subject = subject;
    }

    close() {
        this.dialog.close();
    }


    save(event) {
        event.stopPropagation();

        this.saving = true;
        const raw = this.form.getRawValue();
        

        if (raw.certificate) {

            const payload: { [key: string]: any } = {
                _id: this.subject._id,
                subject: this.subject.subject._id,
                certificate: raw.certificate
            };

            this.backend.updateCurrentUserSubject(payload).subscribe(() => {
                this.saving = false;
                this.success = true;
                this.done.next(true);
            }, response => {
                this.saving = false;
                alert(response.error.message || 'Fail to add certificate');
            });
        } 
        else {
            this.saving = false;
            this.success = true;
            this.noUpload = true;
        }  
    }
}
