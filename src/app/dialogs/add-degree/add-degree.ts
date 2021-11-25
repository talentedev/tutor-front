import { Component, EventEmitter, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { University } from 'app/models';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { timer } from 'rxjs/internal/observable/timer';
import { Backend } from '../../lib/core/auth';

@Component({
    selector: 'learnt-add-degree-dialog',
    templateUrl: './add-degree.component.html',
    styleUrls: ['./add-degree.component.scss'],
})
export class AddDegreeDialogComponent implements OnInit {

    form: FormGroup;
    universities: BehaviorSubject<University[]> = new BehaviorSubject(null);
    saving: boolean;
    success: boolean;

    public readonly done: EventEmitter<boolean> = new EventEmitter<boolean>();

    constructor(private dialog: MatDialogRef<AddDegreeDialogComponent>,
                private backend: Backend) {

        this.form = new FormGroup({
            university: new FormControl('', Validators.required),
            course: new FormControl('', Validators.required),
            degree: new FormControl('', Validators.required),
            certificate: new FormControl(''),
        });
    }

    ngOnInit(): void {
        this.form.get('university').valueChanges
            .debounce(() => timer(400))
            .subscribe(this.getUniversities.bind(this));
    }

    close(): void {
        this.dialog.close();
    }

    save(event: Event): void {
        event.stopPropagation();

        this.saving = true;

        const raw = this.form.getRawValue();
        const payload: { [key: string]: any } = {
            course: raw.course,
            degree: raw.degree,
            university: raw.university,
        };

        if (raw.certificate) {
            payload.certificate = raw.certificate;
        }

        this.backend.saveCurrentUserDegrees(payload).subscribe(() => {
            this.saving = false;
            this.success = true;
            this.done.next(true);
        }, () => {
            this.saving = false;
        });
    }

    universityName(university: University): string {
        return university ? university.name : '';
    }

    getUniversities(): void {

        const name = this.form.get('university').value;

        if (typeof name !== 'string') {
            return;
        }

        if (name.trim() === '') {
            return;
        }

        this.backend.getUniversities(name).subscribe(r => {
            this.universities.next(r);
        });
    }
}
