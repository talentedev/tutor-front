import { Component, EventEmitter, Inject, Input, Output } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Backend } from "../../lib/core/auth";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
    selector: 'learnt-add-note',
    templateUrl: './add-note.component.html',
})
export class AddNoteComponent {
    @Output() close = new EventEmitter<void>();
    @Output() failed = new EventEmitter<void>();
    @Input() userId: string;
    form: FormGroup;

    constructor(
        private backend: Backend,
        @Inject(MAT_DIALOG_DATA) private data: {id: string},
    ) {
        this.form = new FormGroup({
            note: new FormControl('', Validators.required),
            type: new FormControl('', Validators.required),
        });
    }

    onSubmit() {
        if (this.form.valid) {
            this.backend.addUserNote(this.data.id, this.form.getRawValue()).subscribe(
                (data) => {
                    console.log(data);
                    this.close.emit();
                },
                (err) => {
                    console.error(err);
                    this.failed.emit();
                }
           );
        }
    }
}
