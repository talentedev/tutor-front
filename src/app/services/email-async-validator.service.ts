import { Injectable } from "@angular/core";
import { Backend } from "../lib/core/auth";
import { AbstractControl, AsyncValidator } from "@angular/forms";
import { of } from "rxjs";
import { debounceTime, first, map, startWith, switchMap, tap } from "rxjs/operators";
import _get from "lodash-es/get";

@Injectable({
    providedIn: 'root',
})
export class EmailAsyncValidator implements AsyncValidator {
    constructor(private backend: Backend) {
    }

    validate = ((control: AbstractControl) => {
        if (!control.valueChanges) return of(null);
        return control.valueChanges.pipe(
            startWith([control.value]),
            debounceTime(500),
            switchMap(() => {
                if (!control.value) {
                    return of(null);
                }
                return this.backend.verifyEmailNotTaken(control.value).pipe(
                    first(),
                    map(data => {
                            const errorMessage = _get(data, 'error.fields.email');
                            if (errorMessage) {
                                return {apiError: errorMessage};
                            }
                            return null;
                        },
                    ),
                )
            }),
            first(),
        )
    }).bind(this);
}
