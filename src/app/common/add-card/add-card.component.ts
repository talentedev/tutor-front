import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {HttpResponse, HttpErrorResponse} from '@angular/common/http';
import {Auth, Backend} from '../../lib/core/auth';
import {isNullOrUndefined, isUndefined} from 'util';
import {User} from '../../models';
import {NotificationsService} from '../../services/notifications';
import { filter } from "rxjs/operators";

export enum CardResponseError {
    InvalidFields = 1,
    InvalidResponse,
    CardAlreadyExists = 1
}

@Component({
    selector: 'learnt-add-card',
    templateUrl: './add-card.component.html',
    styleUrls: ['./add-card.component.scss']
})
export class AddCardComponent implements OnInit {
    @Output()
    public added: EventEmitter<any> = new EventEmitter();

    public cardProvider: {
        visa: boolean,
        mastercard: boolean,
        discover: boolean,
        amex: boolean,
    };

    public me: User;
    public cardForm: FormGroup;

    public loading: boolean;

    constructor(private auth: Auth,
                private backend: Backend,
                private formBuilder: FormBuilder,
                private notifications: NotificationsService) {
        this.cardForm = this.formBuilder.group({
            name: [''],
            number: ['', Validators.required],
            exp: ['', Validators.required],
            cvc: ['', Validators.required]
        });

        this.auth.me.pipe(filter(Boolean)).subscribe((user: User) => {
            this.me = user;
            this.cardForm.get('name').setValue(`${user.profile.first_name} ${user.profile.last_name}`);
        });
    }

    ngOnInit(): void {
        this.clearProviderAndSet();
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
        payload.month = payload.exp.substring(0, 2);
        payload.year = '20' + payload.exp.substring(2, 4);
        // todo: remove this mock and fix currency error
        payload.currency = 'USD';
        console.log(payload);

        this.backend.createCreditCard(payload).subscribe(
            () => {
                this.me.cc = true;
                this.loading = false;

                this.auth.me.subscribe(user => this.me.payments = user.payments);
                this.notifications.notify('Card added', 'The payment method was successfully added!');

                this.resetForm();
                this.added.next();
            },
            (error: HttpErrorResponse) => {
                this.loading = false;

                const res = error.error;
                const err = <{ type: number; message: string; stripe: any; raw: string; }>res.error;

                if (isNullOrUndefined(err.type)) {
                    this.notifications.notify('Unknown error', 'An unknown error has occurred, please try again later.', 'close');
                    return;
                }

                if (err.type === CardResponseError.CardAlreadyExists && err.raw.endsWith('card already exists')) {
                    this.cardForm.get('number').setErrors({cardAlreadyExists: true});
                } else if (err.raw.endsWith('expiration month is invalid.')){
                    this.cardForm.get('exp').setErrors({invalidDate: true})
                } else if (err.type === CardResponseError.InvalidFields) {
                    if (!isNullOrUndefined(err.message)) {
                        this.cardForm.get('number').setErrors({invalidFields: true});
                    }
                }  else if (err.type === CardResponseError.InvalidResponse) {
                    if (isNullOrUndefined(err.stripe)) {
                        const message = 'Your credit card was declined. Please try again using another payment method.';
                        this.notifications.notify('Couldn\'t add card', message, 'security');
                        return;
                    }

                    let field: string;
                    switch (err.stripe.code) {
                        case 'invalid_number':
                        case 'incorrect_number':
                        case 'expired_card':
                        case 'card_declined':
                            field = 'number';
                            break;
                        case 'invalid_expiry_month':
                            field = 'exp';
                            break;
                        case 'invalid_expiry_year':
                            field = 'exp';
                            break;
                        case 'invalid_cvc':
                        case 'incorrect_cvc':
                            field = 'cvc';
                            break;
                        default:
                            field = 'number';
                    }

                    this.cardForm.get(field).setErrors({stripe: err.stripe.message});
                    this.notifications.notify('Couldn\'t add card', err.stripe.message);
                }
            }
        );
    }

    /**
     * Reset the form.
     */
    private resetForm(): void {
        this.cardForm.markAsPristine();
        this.cardForm.markAsUntouched();
        this.cardForm.reset();

        this.cardForm.get('name').setValue(`${this.me.profile.first_name} ${this.me.profile.last_name}`);

        for (const k of ['number', 'exp', 'cvc']) {
            this.cardForm.get(k).setErrors(null);
        }
    }

    /**
     * Clear the card providers' logo, and optionally set one.
     * @param {string} set
     */
    private clearProviderAndSet(set?: string): void {
        this.cardProvider = {visa: false, mastercard: false, discover: false, amex: false};
        if (!isUndefined(set)) {
            this.cardProvider[set] = true;
        }
    }
}
