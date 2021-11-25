import { Component, ElementRef, EventEmitter, Inject, Output } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FormControl, Validators } from "@angular/forms";
import { debounceTime } from "rxjs/operators";

@Component({
    selector: 'learnt-reject-tutor',
    templateUrl: './reject-tutor.component.html',
    styles: [`
        :host .mat-form-field {
            width: 100%;
        }
    `],
})
export class RejectTutorComponent {
    reason: FormControl;
    otherReason: FormControl;
    @Output() confirmed: EventEmitter<string>;
    @Output() cancelled: EventEmitter<void>;
    reasons = [
        'Not enough experience',
        'Other',
    ];

    constructor(
        private ref: ElementRef,
        @Inject(MAT_DIALOG_DATA)private data,
    ) {
        this.reason = new FormControl('', Validators.required);
        this.otherReason = new FormControl('', Validators.required);
        this.confirmed = new EventEmitter<string>();
        this.cancelled = new EventEmitter<void>()
    }

    confirm() {
        if (this.reason.value === 'Other' && this.otherReason.valid) {
            this.confirmed.emit(this.otherReason.value.trim());
        } else if (this.reason.value != 'Other' && this.reason.valid) {
            this.confirmed.emit(this.reason.value);
        }
    }

    cancel() {
        this.cancelled.emit();
    }
}
