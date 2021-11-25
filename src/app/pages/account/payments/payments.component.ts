import {Auth, Backend} from '../../../lib/core/auth';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {CreditCard, User} from '../../../models';
import {NotificationsService} from '../../../services/notifications';
import {AlertService} from '../../../services/alerts';
import {IsValidSSN, MutualExclusiveValidator} from '../../../lib/helpers/validators';
import { HttpErrorResponse } from '@angular/common/http';
import { Media } from 'app/lib/core/media';
import _get from 'lodash-es/get';
import { Subscription } from "rxjs";
import { filter } from "rxjs/operators/filter";
import { connectableObservableDescriptor } from "rxjs/internal/observable/ConnectableObservable";

@Component({
    selector: 'learnt-payments',
    templateUrl: './payments.component.html',
    styleUrls: ['./payments.component.scss']
})
export class PaymentsComponent implements OnInit, OnDestroy {

    public me: User;

    public form: FormGroup;

    public bankForm: FormGroup;

    public showTerms: boolean;

    public saving: boolean;
    public defaultingCard: boolean;
    public deletingCard: boolean;

    public footerTop: string;

    private defaultFormData: any;
    private defaultBankFormData: any;
    public mobile: boolean;
    private subs: Subscription;

    constructor(private auth: Auth,
                private backend: Backend,
                private alerts: AlertService,
                private notifications: NotificationsService,
                private media: Media) {
        this.subs = new Subscription();
        this.form = new FormGroup({
            employer_identification_number: new FormControl(''),
            social_security_number: new FormControl('', IsValidSSN),
        }, MutualExclusiveValidator('employer_identification_number', 'social_security_number'));

        this.bankForm = new FormGroup({
            bank_account_name: new FormControl('', Validators.required),
            bank_account_type: new FormControl('', Validators.required),
            bank_account_number: new FormControl('', Validators.compose([Validators.required, Validators.pattern(/^[0-9]{4,17}$/)])),
            bank_account_routing: new FormControl('', Validators.required),
        });

        this.subs.add(this.auth.me.pipe(filter(Boolean)).subscribe((me: User) => {
            console.log(me);
            this.me = me;
            this.showTerms = me.preference('payout_terms_accepted', false) === false;
            if (!me.isTutor()) {
                this.showTerms = false;
            }
            this.updateForm(me);

            // tutor only
            if (!_get(me, 'payments.connect') && _get(me, 'profile.social_security_number') && me.isTutor()) {
                if (!_get(me, 'location.postal_code')) {
                    setTimeout(
                        () => this.notifications.notify("Update your location",
                            "Please update your location before setting up your payment info.",
                            "location",
                            10000
                        ),
                        1000
                    );
                } else {
                    this.subs.add(this.backend.ensureConnect({
                        social_security_number: _get(this.me, 'profile.social_security_number')
                    })
                    .subscribe(
                        val => {
                            console.log(val)
                        },
                        err => {
                            console.error(_get(err, 'error.message'));
                            this.notifications.notify(_get(err, 'error.message'), _get(err, 'error.data'), null, 8000);
                        })
                    );
                }
            }
        }));
        this.mobile = !media.query('gt-sm');

        media.watch('gt-sm').subscribe(event => {
            this.mobile = !event.active;
        });

    }

    ngOnInit(): void {
        window.addEventListener('scroll', this.scroll, true);
    }

    ngOnDestroy(): void {
        this.subs.unsubscribe();
        window.removeEventListener('scroll', this.scroll, true);
    }

    scroll = (): void => {
        const element = document.getElementsByClassName('inner-contents')[0];
        if (element === null || element === undefined) {
            return;
        }
        const rect = element.getBoundingClientRect();
        // from 100 view height, remove 100px (footer height), and distance to top px
        this.footerTop = `calc(100vh - 100px - ${rect.top}px)`;
    }

    trackByCardId(index: number, card: CreditCard) {
        return card.id;
    }

    private setFormData(form: FormGroup, data: {[p: string]: any}): void {
        for (const key in data) {
            if (!_get(data, key)) {
                continue;
            }
            form.get(key).setValue(data[key]);
        }
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
                this.notifications.notify('Payment Preferences', 'Payout terms successfully saved!', 'user');
                this.me = me;
            }, (error: HttpErrorResponse) => {
                this.saving = false;
                this.notifications.notify('Payment Preferences', 'Couldn\'t save payment terms changes!', 'close');
            }
        );
    }

    /**
     * Update payment forms.
     * @param {User} me
     */
    private updateForm(me: User): void {
        this.setFormData(this.form, {
            employer_identification_number: me.profile.employer_identification_number,
            social_security_number: me.profile.social_security_number,
        });

        if (me.payments) {
            this.setFormData(this.bankForm, {
                bank_account_name: me.payments.bank_account_name,
                bank_account_type: me.payments.bank_account_type,
                bank_account_number: (me.payments.bank_account_number ? '####-' : '') + me.payments.bank_account_number,
                bank_account_routing: me.payments.bank_account_routing,
            });
            this.bankForm.valueChanges.subscribe(() => {
                this.bankForm.get('bank_account_number').markAsTouched();
            });
        }

        this.defaultFormData = this.form.getRawValue();
        this.defaultBankFormData = this.bankForm.getRawValue();
    }

    /**
     * Save payment forms.
     */
    public save(): void {
        const handleErr = (err: any) => {
            const fields = _get(err, 'data.fields', {}) as {[p: string]: any};
            if (fields) {
                return;
            }

            for (const key in fields) {
                const formCtrl = this.form.get(key) as FormControl;
                if (formCtrl) {
                    formCtrl.setErrors({apiError: fields[key]});
                    continue;
                }
                const bankFormCtrl = this.bankForm.get(key);
                if (bankFormCtrl) {
                    bankFormCtrl.setErrors({apiError: fields[key]});
                }
            }
        };

        if (this.form.dirty) {
            this.saving = true;
            this.backend.updatePayout(this.form.getRawValue()).subscribe(() => {
                this.saving = false;
                this.notifications.notify('Payment Preferences', 'EIN/SSN fields successfully saved!', 'user');
                this.form.markAsPristine();
                this.form.markAsUntouched();
                this.defaultFormData = this.form.getRawValue();
                const social_security_number = this.form.get('social_security_number').value;
                if (social_security_number) {
                    this.form.get('social_security_number').setValue(
                        '###-##-' + social_security_number.substr(social_security_number.length - 4));
                }
                this.me.profile.hydrate(this.form.getRawValue());
            }, (error: HttpErrorResponse) => {
                this.saving = false;
                this.notifications.notify('Payment Preferences', 'Couldn\'t update EIN/SSN preferences!', 'close');
                console.error(error);
                handleErr(_get(error, 'error'));
            });
        }

        if (this.bankForm.dirty) {
            this.saving = true;
            const body = {payments: this.bankForm.getRawValue()}
            this.backend.updateCurrentUser(body).subscribe(me => {
                this.saving = false;
                this.notifications.notify('Payment Preferences', 'Payout preferences successfully saved!', 'user');
                this.me.payments = me.payments;
                this.updateForm(this.me);
                this.bankForm.markAsPristine();
                this.bankForm.markAsUntouched();
            }, (error: HttpErrorResponse) => {
                this.saving = false;
                this.notifications.notify('Payment Preferences', 'Couldn\'t update payment preferences!', 'close');
                console.error(error)
                handleErr(error.error);
            });
        }

    }

    /**
     * Revert payment forms.
     */
    public revert(): void {
        this.form.reset(this.defaultFormData);
        this.bankForm.reset(this.defaultBankFormData);
        this.bankForm.markAsUntouched();
    }

    /**
     * Get the user's cards.
     * @return {CreditCard[]}
     */
    public get cards(): CreditCard[] {
        return this.me.payments['cards'];
    }

    /**
     * Sets the specified card as default.
     * @param {string} id
     */
    public setDefaultCard(id: string): void {
        console.log(`setting default: ${id}`)
        if (this.defaultingCard) {
            return;
        }

        const card = this.cards.filter(c => c.id === id)[0];
        if (card === null || card === undefined) {
            this.notifications.notify('Couldn\'t set default card', 'Can\'t set default a non-existent card.');
            return;
        }

        const alertOpts = {lifetime: 0, buttons: [{label: 'Yes, I\'m sure', result: true}, {label: 'No, go back', result: false}]};
        let alertMsg = `Are you sure you want to set as default ${card.type} card ending in ${card.number}? `;
        alertMsg += `You can change your default card at any time using this form.`;
        const alert = this.alerts.alert('Set default card', alertMsg, alertOpts);

        alert.result.subscribe(r => {
            if (r === true) {
                this.defaultingCard = true;
                this.backend.setDefaultCreditCard(id).subscribe(
                    (cc) => {
                        console.log(`success - ${JSON.stringify(cc)}`)
                        this.defaultingCard = false;
                        this.cards.forEach(c => c.id === cc.card.id ? c.default = true : c.default = false);
                    }, (error: HttpErrorResponse) => {
                        this.defaultingCard = false;
                        const alertErrMsg = 'An error occurred trying to set the card as default, please try again later.';
                        this.notifications.notify('Couldn\'t set default card', alertErrMsg);
                        console.error(error.message)
                    }
                );
            }
            alert.dispose();
        });
    }

    /**
     * Delete a card from the account.
     * @param {string} id
     */
    public deleteCard(id: string): void {
        if (this.deletingCard) {
            return;
        }

        if (this.cards.length === 1) {
            this.notifications.notify("Couldn't remove card", "Can't remove the only card");
            return;
        }

        const card = this.cards.filter(c => c.id === id)[0];
        if (card === null || card === undefined) {
            this.notifications.notify('Couldn\'t remove card', 'Can\'t remove a non-existent card.');
            return;
        }

        const alertOpts = {lifetime: 0, buttons: [{label: 'Yes, I\'m sure', result: true}, {label: 'No, go back', result: false}]};
        let alertMsg = `Are you sure you want to delete ${card.type} card ending in ${card.number}? `;
        alertMsg += `This can't be undone!`;
        const alert = this.alerts.alert('Deleting card', alertMsg, alertOpts);

        alert.result.subscribe(r => {
            if (r === true) {
                this.deletingCard = true;
                this.backend.deleteCreditCard(id).subscribe(
                    () => {
                        const deletedIndex = this.cards.indexOf(this.cards.filter(c => c.id === id)[0]);
                        this.cards.splice(deletedIndex, 1);
                        this.deletingCard = false;
                    }, (error: HttpErrorResponse) => {
                        const alertErrMsg = 'An error occurred trying to delete the card, please try again later.';
                        this.notifications.notify('Couldn\'t remove card', alertErrMsg);
                        this.deletingCard = false;
                    }
                );
            }
            alert.dispose();
        });
    }
}
