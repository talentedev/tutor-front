import { Component } from "@angular/core";
import { Location } from '@angular/common';

@Component({
    selector: 'learnt-admin-tutor-pending',
    template: `
        <a mat-stroked-button color="accent" (click)="back($event)">Back <mat-icon>chevron_left</mat-icon></a>
        <mat-tab-group>
            <mat-tab label="Pending">
                <learnt-admin-tutors-pending-details></learnt-admin-tutors-pending-details>
            </mat-tab>

            <mat-tab label="Verification">
                <learnt-admin-tutors-verification-details></learnt-admin-tutors-verification-details>
            </mat-tab>
        </mat-tab-group>
    `,
    styles: [`
        :host {
            display: block;
            background-color: #fff;
            padding: 1rem;
            border-radius: 6px;
        }
    `]
})
export class TutorPendingComponent {
    constructor(private location: Location) {
    }

    back(e: Event) {
        e.preventDefault();
        this.location.back();
    }
}
