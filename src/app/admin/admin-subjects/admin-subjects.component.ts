import { Component, OnInit } from '@angular/core';
import { Backend } from "../../lib/core/auth";
import { FormArray, FormControl, Validators } from "@angular/forms";
import { AlertService } from "../../services/alerts";
import { SubjectAsyncValidatorService } from "../../services/subject-async-validator.service";
import { Subject } from "../../models";

@Component({
    selector: 'learnt-admin-subjects',
    templateUrl: './admin-subjects.component.html',
    styleUrls: ['./admin-subjects.component.scss']
})
export class AdminSubjectsComponent implements OnInit {
    subjectsForm: FormArray;
    private subjects_: Subject[] = [];
    displayedColumns = ['subject'];
    subjectFilter = "";
    loading = false;

    constructor(
        private backend: Backend,
        private alerts: AlertService,
        private subjectAsyncValidator: SubjectAsyncValidatorService,
    ) {
        this.reset();
    }

    get subjects() {
        return this.subjects_.filter(s => s.name.toLowerCase().includes(this.subjectFilter.toLowerCase()));
    }

    ngOnInit(): void {
        this.loadSubjects();
    }

    loadSubjects() {
        this.loading = true;
        this.backend.getSubjects().subscribe(subjects => {
            setTimeout(() => {
            this.subjects_ = subjects.sort((s1, s2) => s1.name > s2.name ? 1 : -1)
            this.loading = false;
            }, 5000);
        });
    }

    getSubjectsForm(): FormArray {
        return (this.subjectsForm as FormArray)
    }

    private getNewControl() {
        return new FormControl('', {
            validators: Validators.required,
            asyncValidators: this.subjectAsyncValidator.validate,
            updateOn: "change",
        });
    }
    addSubject() {
        this.subjectsForm.push(this.getNewControl());
    }

    private reset() {
        this.subjectsForm = new FormArray([this.getNewControl()]);
    }

    save(e: Event) {
        e.preventDefault();
        const subjects = this.subjectsForm.getRawValue().map(name => {
            return name.trim().replace(new RegExp('\\s{2,}', 'g'), ' ');
        });
        this.backend.addSubjects(subjects).subscribe(
            () => {
                this.alerts.alert('Success', 'Subject saved successfully.');
                this.reset();
            },
            (err) => {
                console.log(err.error);
                if (err.error) {
                    this.alerts.alert('Error', err.error);
                }
            });
    }

    getIndex(i: number) {
        return i;
    }

    deleteControl(i: number) {
        this.subjectsForm.removeAt(i);
    }
}
