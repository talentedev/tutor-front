import {Auth, Backend} from '../../lib/core/auth';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Component, EventEmitter, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';

@Component({
    selector: 'learnt-add-phone',
    templateUrl: './add-phone.component.html',
    styleUrls: ['./add-phone.component.scss']
})
export class AddPhoneComponent implements OnInit {

    form: FormGroup;
    saving: boolean;
    success: boolean;

    public readonly done: EventEmitter<boolean> = new EventEmitter<boolean>();

    constructor(private dialog: MatDialogRef<AddPhoneComponent>,
                private backend: Backend) {

        this.form = new FormGroup({
            telephone: new FormControl('', Validators.required),
        });
    }

    ngOnInit() {

    }

    close() {
        this.dialog.close();
    }

    save(event) {
        event.stopPropagation();

        this.saving = true;

        const raw = this.form.getRawValue();
        const payload: { [key: string]: any } = {
            telephone: raw.telephone,
        };

        this.backend.saveCurrentUserTelephone(payload).subscribe(() => {
            this.saving = false;
            this.success = true;
            this.done.next(true);
        }, response => {
            this.saving = false;
            alert('Fail to add phone number');
        });
    }
}
