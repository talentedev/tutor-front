import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Auth, Backend } from '../../../../lib/core/auth';
import { IsValidSSN, MutualExclusiveValidator } from '../../../../lib/helpers/validators';
import { User } from '../../../../models';
import { AccountService } from '../../../../services/account';
import { AlertService } from '../../../../services/alerts';
import { NotificationsService } from '../../../../services/notifications';

@Component({
    selector: 'learnt-affiliate-payment-preferences',
    templateUrl: './payment-preferences.component.html',
    styleUrls: ['../account.scss', './payment-preferences.component.scss']
})
export class AffiliatePaymentPreferencesComponent implements OnInit {
    /* Current user */
    public me: User;

    /* Payout preferences & bank details forms */
    public paymentForm: FormGroup;
    public bankDetailsForm: FormGroup;

    /* Showing terms flag */
    public showTerms: boolean;

    /* Pristine forms for reverting the changes */
    private pristinePayoutForm: any;
    private pristineBankDetailsForm: any;

    /* Saving flag */
    public saving: boolean;

    constructor(private auth: Auth,
                private account: AccountService,
                private notifications: NotificationsService,
                private alerts: AlertService,
                private backend: Backend) {

        this.paymentForm = new FormGroup({
            employer_identification_number: new FormControl('', Validators.pattern(/^[0-9]{9}$/)),
            social_security_number: new FormControl('', IsValidSSN),
        }, MutualExclusiveValidator('employer_identification_number', 'social_security_number'));

        this.bankDetailsForm = new FormGroup({
            bank_account_name: new FormControl('', Validators.required),
            bank_account_type: new FormControl('', Validators.required),
            bank_account_number: new FormControl('', Validators.compose([Validators.required, Validators.pattern(/^[0-9]{4,17}$/)])),
            bank_account_routing: new FormControl('', Validators.compose([Validators.required])),
        });
    }

    ngOnInit(): void {
        this.auth.me.subscribe((user: User) => {
            this.me = user;

            if (this.me.preferences === undefined) {
                this.me.preferences = {};
            }

            this.me.preferences.payment_terms_accepted = this.me.preferences.payment_terms_accepted || false;
            this.showTerms = !this.me.preferences.payment_terms_accepted;

            if (this.me.payments === undefined) {
                this.me.payments = {};
            }

            this.fillForms();
        });
    }

    /**
     * Accepting the payment terms.
     * @param event
     */
    public checkTerms(event: any): void {
        if (this.saving) {
            return;
        }
        this.saving = true;

        const payload = {preferences: {payout_terms_accepted: event}};
        this.backend.updateCurrentUser(payload).subscribe(
            me => {
                this.saving = false;
                this.showTerms = !me.preferences.payout_terms_accepted;
                this.notifications.notify('Payout Preferences', 'Payout terms successfully saved!', 'user');
                this.me=me
            }, (error: HttpErrorResponse) => {
                this.saving = false;
                this.notifications.notify('Payment Preferences', 'Couldn\'t save payment terms changes!', 'close');
            }
        );
    }

    public todo(s: string): void {
        this.alerts.alert('Todo', s);
    }

    /**
     * Fill the payments & bank details forms.
     */
    private fillForms(): void {
        this.paymentForm.get('employer_identification_number').setValue(this.me.profile.employer_identification_number || '');
        this.paymentForm.get('social_security_number').setValue(this.me.profile.social_security_number || '');

        this.bankDetailsForm.get('bank_account_name').setValue(this.me.payments.bank_account_name);
        this.bankDetailsForm.get('bank_account_type').setValue(this.me.payments.bank_account_type);
        this.bankDetailsForm.get('bank_account_number').setValue(
            (this.me.payments.bank_account_number ? '####-' : '') + this.me.payments.bank_account_number);
        this.bankDetailsForm.get('bank_account_routing').setValue(this.me.payments.bank_account_routing);

        this.bankDetailsForm.valueChanges.subscribe(() => {
            this.bankDetailsForm.get('bank_account_number').markAsTouched();
        });

        this.pristinePayoutForm = this.paymentForm.getRawValue();
        this.pristineBankDetailsForm = this.bankDetailsForm.getRawValue();
    }

    /**
     * Save the forms.
     */
    public saveChanges(): void {
        const handleErr = (err: any) => {
            if (err.data === undefined) {
                return;
            }

            if (err.data.fields === undefined) {
                return;
            }

            for (const key in err.data.fields) {
                if (this.paymentForm.get(key) !== null && this.paymentForm.get(key) !== undefined) {
                    this.paymentForm.get(key).setErrors({apiError: err.data.fields[key]});
                    continue;
                }
                if (this.bankDetailsForm.get(key) !== null && this.bankDetailsForm.get(key) !== undefined) {
                    this.bankDetailsForm.get(key).setErrors({apiError: err.data.fields[key]});
                }
            }
        };

        if (this.paymentForm.dirty) {
            this.saving = true;
            this.backend.updatePayout(this.paymentForm.getRawValue()).subscribe(() => {
                this.saving = false;
                this.notifications.notify('Payment Preferences', 'EIN/SSN fields successfully saved!', 'user');

                this.paymentForm.markAsPristine();
                this.paymentForm.markAsUntouched();
                this.pristinePayoutForm = this.paymentForm.getRawValue();
                const social_security_number = this.paymentForm.get('social_security_number').value;
                if (social_security_number) {
                    this.paymentForm.get('social_security_number').setValue(
                        '###-##-' + social_security_number.substr(social_security_number.length - 4));
                }
                this.me.profile.hydrate(this.paymentForm.getRawValue());
            }, (error: HttpErrorResponse) => {
                this.saving = false;
                this.notifications.notify('Payment Preferences', 'Couldn\'t update EIN/SSN preferences!', 'close');

                handleErr(error.error);
            });
        }

        if (this.bankDetailsForm.dirty) {
            this.saving = true;
            const body = {payments: this.bankDetailsForm.getRawValue()}
            this.backend.updateCurrentUser(body).subscribe(me => {
                this.saving = false;
                this.notifications.notify('Payment Preferences', 'Payout preferences successfully saved!', 'user');
                this.me.payments = me.payments;
                this.fillForms();
                this.bankDetailsForm.markAsPristine();
                this.bankDetailsForm.markAsUntouched();
                this.pristineBankDetailsForm = this.bankDetailsForm.getRawValue();
            }, (error: HttpErrorResponse) => {
                this.saving = false;
                this.notifications.notify('Payment Preferences', 'Couldn\'t update payment preferences!', 'close');

                handleErr(error.error);
            });
        }

    }

    /**
     * Discard changes made to the forms.
     */
    public revert(): void {
        this.paymentForm.reset(this.pristinePayoutForm);
        this.bankDetailsForm.reset(this.pristineBankDetailsForm);
        this.bankDetailsForm.markAsUntouched();
    }
}
