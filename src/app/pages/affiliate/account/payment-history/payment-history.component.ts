import {Component, OnInit} from '@angular/core';
import {Backend} from '../../../../lib/core/auth';
import * as moment from 'moment';
import {HttpResponse, HttpErrorResponse} from '@angular/common/http';
import {NotificationsService} from '../../../../services/notifications';
import {Transaction} from '../../../../models';
import {environment} from '../../../../../environments/environment';

@Component({
    selector: 'learnt-affiliate-payment-history',
    templateUrl: './payment-history.component.html',
    styleUrls: ['../account.scss', './payment-history.component.scss']
})
export class AffiliatePaymentHistoryComponent implements OnInit {
    public currDate: Date;

    public transactions: Transaction[];
    public earnings = 0;

    public fetching: boolean;

    constructor(private backend: Backend,
                private notifications: NotificationsService) {
    }

    ngOnInit(): void {
        this.currDate = new Date();
        this.currDate.setHours(0, 0, 1, 0);

        this.fetch();
    }

    /**
     * Sets a month before or after the set date.
     * @param {number} i
     */
    public setMonth(i: number): void {
        if ([-1, 1].indexOf(i) < 0) {
            return;
        }

        const now = moment(new Date());
        const timeSpan = moment(this.currDate).add(i, 'month');

        if (timeSpan.isAfter(now)) {
            return;
        }

        this.currDate = timeSpan.toDate();
        this.fetch();
    }

    /**
     * Fetches the payment history from the API.
     */
    private fetch(): void {
        if (this.fetching) {
            return;
        }

        this.transactions = [];
        this.earnings = 0;
        this.fetching = true;

        const from = moment.utc(this.currDate).startOf('month').startOf('day');
        const to = moment(from).endOf('month');

        this.backend.getTransactions(from, to).subscribe(
            (transactions) => {
                this.fetching = false;
                transactions.forEach(t => {
                    this.transactions.push(new Transaction(t));
                    this.earnings += t.amount > 0 ? t.amount : 0;
                });
            }, (error: HttpErrorResponse) => {
                this.fetching = false;
                if (!environment.production) {
                    console.log('[!] Couldn\'t get transactions:', error.error);
                }
                this.notifications.notify('Couldn\'t get transactions', 'An error occurred getting transactions.');
            }
        );
    }

    /**
     * Download the payment history in PDF form.
     */
    public downloadAsPDF(): void {
        const from = moment.utc(this.currDate).startOf('month').startOf('day');
        const to = moment(from).endOf('month');
        window.open(`${environment.API_HOST}/me/transactions?from=${from.toJSON()}&to=${to.toJSON()}&download=true`, '_blank');
    }
}
