import { Subject, Tutoring, User } from '../../models';
import { Auth, Backend } from '../../lib/core/auth';
import { FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Component, EventEmitter, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { timer } from 'rxjs/internal/observable/timer';

function hasObject(control: FormControl): ValidationErrors | null {
    if (!control.value) {
        return { required: true };
    }

    if (!control.value._id) {
        return { required: true };
    }

    return null;
}


@Component({
    selector: 'learnt-add-subjects',
    templateUrl: './add-subjects.component.html',
    styleUrls: ['./add-subjects.component.scss'],
})
export class AddSubjectsComponent implements OnInit {

    form: FormGroup;

    saving: boolean;
    success: boolean;

    subjects: BehaviorSubject<Subject[]> = new BehaviorSubject([]);

    exclude: string[] = [];

    public readonly done: EventEmitter<boolean> = new EventEmitter<boolean>();

    constructor(public dialog: MatDialogRef<AddSubjectsComponent>,
                private backend: Backend,
                private auth: Auth) {

        this.form = new FormGroup({
            subject: new FormControl(null, hasObject),
            certificate: new FormControl('', Validators.required),
        });

        this.auth.me.subscribe((me: User) => {
            if (me.tutoring === undefined) {
                me.tutoring = new Tutoring();
            }

            if (me.tutoring.subjects === undefined) {
                me.tutoring.subjects = [];
            }

            this.exclude = me.tutoring.subjects.map(s => s.subject._id);
        });
    }

    ngOnInit(): void {
        this.form.get('subject').valueChanges
            .debounce(() => timer(400))
            .subscribe(this.getSubjects.bind(this));
    }

    getSubjects(): void {
        const name = this.form.get('subject').value;

        if (typeof name !== 'string') {
            // a subject was selected
            return;
        }

        if (name.trim() === '') {
            return;
        }

        this.backend.getSubjects(name).subscribe(subjects => {
            this.subjects.next(subjects.filter(s => this.exclude.indexOf(s._id) === -1));
        });
    }

    subjectName(subject: Subject | null): string {
        return subject ? subject.name : '';
    }

    save(event: Event): void {
        event.stopPropagation();

        this.saving = true;

        const raw = this.form.getRawValue();
        const payload: { [key: string]: any } = {
            subject: raw.subject._id,
        };

        if (raw.certificate) {
            payload.certificate = raw.certificate;
        }

        this.backend.saveCurrentUserSubjects(payload).subscribe(() => {
            this.saving = false;
            this.success = true;
            this.done.next(true);
        }, response => {
            this.saving = false;
            alert(response.json().error || 'Fail to add subject');
        });
    }
}
