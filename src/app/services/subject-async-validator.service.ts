import { Injectable } from "@angular/core";
import { AbstractControl, AsyncValidator, ValidationErrors } from "@angular/forms";
import { Observable, of } from "rxjs";
import { Backend } from "../lib/core/auth";
import { debounceTime, map, startWith, switchMap, first } from "rxjs/operators";

@Injectable({
    providedIn: 'root',
})
export class SubjectAsyncValidatorService implements AsyncValidator {
    constructor(private backend: Backend) {
    }

    validate = ((control: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> | ValidationErrors | null => {
        const value = control.value.trim().toLowerCase();
        if (!value) {
            return of(null);
        }
        return control.valueChanges.pipe(
            startWith([value]),
            debounceTime(500),
            switchMap(() => {
                if (!value) {
                    return of(null);
                }
                return this.backend.getSubjects(value, 100).pipe(first(), map(subjects => {
                    for (let subject of subjects) {
                        if (subject.name.toLowerCase() === value) {
                            return {duplicate: 'Subject already exists.'}
                        }
                    }
                    return null;
                }));
            }),
            first(),
        );
    }).bind(this)

}
