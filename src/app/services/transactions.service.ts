import { Injectable } from '@angular/core';
import { Backend } from "../lib/core/auth";
import { Transaction } from "../models";
import * as moment from 'moment-timezone';

/**
 * Handles transaction-related operations for currently logged user
 */
@Injectable({
    providedIn: 'root'
})
export class TransactionsService {
    private earnings_ = 0;
    private transactions_: Transaction[] = [];

    constructor(
        private backend: Backend,
    ) {
    }

    getTransactions(from: Date, to: Date): Promise<Transaction[]> {
        return new Promise((resolve, reject) => {
            this.backend.getTransactions(moment(from), moment(to)).subscribe(transactions => {
                this.transactions_ = transactions;
                resolve(transactions);
            }, err => {
                reject(err);
            });
        })
    }

    async getEarnings(from: Date, to: Date): Promise<number> {
        if (!this.transactions_.length) {
            await this.getTransactions(from, to);
        }
        let earnings = 0;
        this.transactions_.forEach(transaction => {
            if (transaction.reference.startsWith('INV')) {
                earnings += transaction.amount;
            }
        });
        this.earnings_ = earnings;
        return this.earnings_;
    }
}
