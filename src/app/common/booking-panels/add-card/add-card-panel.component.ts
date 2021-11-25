import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Auth, Backend } from '../../../lib/core/auth';
import { User } from '../../../models';
import { NotificationsService } from '../../../services/notifications';
import { CardResponseError } from '../../add-card/add-card.component';
import { PanelData, SidePanel } from '../panel';
import { PanelNavigation } from '../panels';
import { filter } from "rxjs/operators";

@Component({
    templateUrl: './add-card-panel.component.html',
    styleUrls: ['./add-card-panel.component.scss', '../booking-panel.scss']
})
export class AddCardPanelComponent extends SidePanel implements OnInit {
    
    @ViewChild('panel', {read: ViewContainerRef})
    panel: ViewContainerRef;

    public months: string[];
    public years: number[];

    public cardForm: FormGroup;
    public cardProvider: {
        visa: boolean,
        mastercard: boolean,
        discover: boolean,
        amex: boolean,
    };

    public state: 'add' | 'success' | 'failed' = 'add';
    public loading: boolean;
    public instantSession: boolean;

    public payload: any;
    public tutor: User;

    public declineMessage: string;

    private me: User;

    private onClosePanel: PanelNavigation;

    constructor(private auth: Auth,
                private backend: Backend,
                private formBuilder: FormBuilder,
                private notifications: NotificationsService) {
        super()
        this.cardForm = this.formBuilder.group({
            name: [''],
            number: ['', Validators.required],
            month: ['', Validators.required],
            year: ['', Validators.required],
            cvc: ['', Validators.required]
        });

        this.auth.me.pipe(filter(Boolean)).subscribe((me: User) => {
            this.me = me;
            this.cardForm.get('name').setValue(`${me.profile.first_name} ${me.profile.last_name}`);
        });
    }

    onData(data: PanelData) {
        data.apply(this, "tutor", "payload", "onClosePanel?")
    }

    ngOnInit(): void {
        this.years = [];
        const currentYear = (new Date()).getUTCFullYear();
        for (let year = currentYear; year < currentYear + 10; year++) {
            this.years.push(year);
        }

        this.months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        this.clearProviderAndSet();
    }

    /**
     * Get the duration for the success panel.
     * @return {number}
     */
    public getDuration(): number {
        return parseInt(this.payload['duration'].replace('m', ''), 10) / 60;
    }

    /**
     * Get the sum for success panel.
     * @return {number}
     */
    public getSum(): number {
        return this.getDuration() * this.tutor.tutoring.rate;
    }

    /**
     * Set the provider based on input value.
     * @param {string} value
     */
    public updateProvider(value: string): void {
        switch (true) {
            case value.startsWith('4'):
            case /^4[0-9]{12}(?:[0-9]{3})?$/.test(value):
                this.clearProviderAndSet('visa');
                break;
            case /^(?:5[1-5][0-9]{2}|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12}$/.test(value):
                this.clearProviderAndSet('mastercard');
                break;
            case value.startsWith('6'):
            case /^6(?:011|5[0-9]{2})[0-9]{12}$/.test(value):
                this.clearProviderAndSet('discover');
                break;
            case value.startsWith('34'):
            case value.startsWith('37'):
            case /^3[47][0-9]{13}$/.test(value):
                this.clearProviderAndSet('amex');
                break;
            default:
                this.clearProviderAndSet();
        }
    }

    /**
     * Add a credit card to the account.
     * @param event
     */
    public addCard(event: any): void {
        event.preventDefault();
        event.stopPropagation();

        this.loading = true;

        const payload = this.cardForm.getRawValue();
        payload.month = '' + payload.month;
        payload.year = '' + payload.year;
        // todo: remove this mock and fix currency error
        payload.currency = 'USD';

        this.backend.createCreditCard(payload).subscribe(
            (response: HttpResponse<any>) => {

                this.me.cc = true;

                this.auth.me.subscribe(user => this.me.payments = user.payments);

                // FIXME
                // this.instantSession = onCloseData['data']['instant'] === true;
                
                this.state = 'success';
            },
            (error: HttpErrorResponse) => {
                this.loading = false;

                const res = error.error;
                const err = <{ type: number; message: string; stripe: any; raw: string; }>res.error;

                if (err === undefined || err.type === undefined || err.message === undefined) {
                    this.notifications.notify(
                        'Couldn\'t add card',
                        'An error has occurred, please try again later.',
                        'security',
                        10 * 1000
                    );
                    return;
                }

                if (err.type !== undefined) {
                    switch (err.type) {
                        case CardResponseError.InvalidFields: // if API can't bind to struct, probably missing fields
                            if (err.message !== undefined) {
                                this.cardForm.get('number').setErrors({invalidFields: true});
                            }
                            break;
                        case CardResponseError.InvalidResponse: // card declined, or API failed
                            if (err.stripe !== undefined) {
                                this.declineMessage = err.stripe.message;
                            } else {
                                this.declineMessage = 'Your credit card was declined. Please try again using another payment method.';
                            }
                            this.state = 'failed';
                            break;
                    }
                }
            }
        );
    }

    /**
     * Switch back to the booking panel after adding the card.
     */
    public toBooking(): void {

        if (this.onClosePanel) {
            this.navigate(this.onClosePanel);
            return
        }

        this.navigate('booking')
    }

    /**
     * Clear the card providers' logo, and optionally set one.
     * @param {string} set
     */
    private clearProviderAndSet(set?: string): void {
        this.cardProvider = {visa: false, mastercard: false, discover: false, amex: false};
        if (set !== undefined) {
            this.cardProvider[set] = true;
        }
    }
}
