import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import * as moment from 'moment';
import { Subscription } from 'rxjs/Rx';
import { Auth, Backend } from '../../lib/core/auth';
import { User } from '../../models';
import { AlertService } from '../../services/alerts';
import { getMaximumBirthdate, getMinimumBirthdate } from "../../lib/core/utils";

class MyErrorStateMatcher implements ErrorStateMatcher {
    isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
        return !!(control && control.invalid && (control.dirty || control.touched));
    }
}

@Component({
    selector: 'learnt-account-verification',
    templateUrl: './account-verification.component.html',
    styleUrls: ['./account-verification.component.scss']
})
export class AccountVerificationComponent implements OnInit, OnDestroy {

    @ViewChild('title')
    public titleElement: ElementRef;

    @ViewChild('signature')
    public signatureElement: ElementRef;

    public step = 0;

    public form: FormGroup;
    public ackDisclosure: boolean;

    public working: boolean;

    public minDate: Date;
    public maxDate: Date;

    public matcher: ErrorStateMatcher;

    private token: string;
    private subscriptions: Subscription[] = [];

    constructor(private auth: Auth,
                private alerts: AlertService,
                private backend: Backend,
                private cdRef: ChangeDetectorRef,
                private route: ActivatedRoute,
                private router: Router) {

        this.form = new FormGroup({
            firstName: new FormControl('', Validators.compose([Validators.required, Validators.pattern(/^[a-zA-Z0-9- '.,]+$/)])),
            middleName: new FormControl('', Validators.pattern(/^[a-zA-Z0-9- '.,]+$/)),
            lastName: new FormControl('', Validators.compose([Validators.required, Validators.pattern(/^[a-zA-Z0-9- '.,]+$/)])),
            dob: new FormControl('', Validators.required),
            ssn: new FormControl('', Validators.compose([Validators.required, Validators.pattern(/^\d{3}-\d{2}-\d{4}$/)])),
            zipCode: new FormControl('', Validators.compose([Validators.required, Validators.pattern(/^\d+$/)])),
            ackSummary: new FormControl(false, Validators.requiredTrue),
        });

        this.minDate = getMinimumBirthdate();
        this.maxDate = getMaximumBirthdate();

        this.matcher = new MyErrorStateMatcher();
    }

    private goToDashboard(): Promise<boolean> {
        return this.router.navigate(['/main/dashboard']);
    }

    ngOnInit(): void {
        this.subscriptions.push(this.auth.me.subscribe((u: User | null) => {
            if (u !== null) {
                this.goToDashboard();
                return;
            }
        }));

        this.subscriptions.push(this.route.queryParams.subscribe((p: Params) => {
            if (p.token === null || p.token === undefined || p.token === '') {
                this.goToDashboard();
                return;
            }

            this.token = p.token;
        }));
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
        this.subscriptions = [];
    }

    public nextStepDisabled(): boolean {
        if (this.step > 2 || this.working) {
            return true;
        }

        switch (this.step) {
            case 0:
                return this.form.invalid;
            case 1:
                return !this.ackDisclosure;
            case 2:
                if (this.signatureElement === undefined) {
                    return true;
                }
                const value = (<HTMLDivElement>this.signatureElement.nativeElement).innerText.trim();
                return value === '';
        }

        return true;
    }

    public nextStep(): void {
        this.working = true;

        if (this.step === 2) {
            this.submit();
            return;
        }

        setTimeout(() => {
            this.working = false;
            this.step++;
            this.cdRef.detectChanges();
            (<HTMLDivElement>this.titleElement.nativeElement).scrollIntoView();
        }, 100);
    }

    private submit(): void {
        const value = (<HTMLDivElement>this.signatureElement.nativeElement).innerText.trim();

        if (value === '' || this.ackDisclosure === false) {
            return;
        }

        const form: any = this.form.getRawValue();

        const date = <Date>this.form.get('dob').value;
        const month: string = date.getMonth() < 10 ? '0' + date.getMonth() : '' + date.getMonth();
        const day: string = date.getDate() < 10 ? '0' + date.getDate() : '' + date.getDate();

        const payload: any = {
            first_name: form.firstName,
            last_name: form.lastName,
            ssn: form.ssn,
            zipcode: form.zipCode,
            dob: `${date.getFullYear()}-${month}-${day}`,
        };

        if (form.middleName === '') {
            payload.no_middle_name = true;
        } else {
            payload.middle_name = form.middleName;
        }

        this.backend.verifyAccount(payload, this.token).subscribe(() => {
            this.router.navigate(['/']).then(() => {
                this.alerts.alert('Form sent', 'The form was successfully sent!');
            });
        }, (err: HttpErrorResponse) => {
            const error: any = err.error; // TEST
            console.log({submitAccountVerify: {error}});

            const alert = (message: string = 'unknown error received'): void => {
                let s = `We encountered an error while sending the data, please try again later. `;
                s += `If the error persists, contact us as soon as possible. `;
                this.alerts.alert(`Encountered an error`, s + (message ? `Message received: ` + message : ''));
            };

            if (error.error === undefined) {
                alert();
                return;
            }

            if (error.raw === undefined) {
                alert();
                return;
            }

            if (error.type !== undefined) {
                switch (error.type) {
                    case 2:
                        this.router.navigate(['/']).then(() => this.alerts.alert('The form was already completed.'));
                        break;
                }
            }

            let shownAlert = false;
            if (/dob is invalid/.test(error.raw)) {
                shownAlert = true;
                alert('Date of birth is invalid.');
            }

            if (/zipcode is invalid/.test(error.raw)) {
                shownAlert = true;
                alert('Zip code is invalid.');
            }

            if (!shownAlert) {
                alert('Invalid form sent, please check out the fields and try again.');
            }

            this.reset();
        }, () => this.working = false);
    }

    private reset(): void {
        this.step = 0;
        this.working = false;
        this.form.get('ackSummary').setValue(false);
        this.ackDisclosure = false;
        this.cdRef.detectChanges();
    }
}
