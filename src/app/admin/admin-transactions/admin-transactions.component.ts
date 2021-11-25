import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Transaction, User, Credit } from '../../models';
import { AdminTransactionsService } from "../services/admin-transactions.service";
import { AdminCreditService } from "../services/admin-credit.service";
import startOfMonth from 'date-fns/startOfMonth';
import startOfDay from 'date-fns/startOfDay';
import endOfDay from 'date-fns/endOfDay';
import isAfter from 'date-fns/isAfter';
import isBefore from "date-fns/isBefore";
import { Subscription } from "rxjs/Rx";

@Component({
    selector: ".learnt-admin-transactions",
    templateUrl: './admin-transactions.component.html',
    styleUrls: ['./admin-transactions.component.scss'],
})
export class AdminTransactionsComponent implements OnInit, OnDestroy {
    @Input() user: User;
    @ViewChild('fromInput') fromInput: ElementRef;
    @ViewChild('toInput') toInput: ElementRef;
    from: Date;
    to: Date;
    maxDate: Date;
    minDate: Date;
    columnsToDisplay = ['time', 'reference', 'amount', 'details', 'lesson', 'status', 'state'];
    footerToDisplay: string[] = [];
    transactions: Transaction[] = [];
    public balance: number;
    private subs = new Subscription();

    constructor(
        public creditService: AdminCreditService,
        public transactionService: AdminTransactionsService,
    ) {
        this.from = startOfMonth(new Date());
        this.to = endOfDay(new Date());
        this.maxDate = endOfDay(this.to);
    }

    ngOnInit() {
        this.balance = 0;
        this.fetch();
        
    }

    ngOnDestroy() {
        this.subs.unsubscribe();
    }

    fromChange() {
        if (isAfter(this.from, this.to)) {
            this.to = endOfDay(this.from);
            this.toChange();
        }
    }

    toChange() {
        if (isBefore(this.to, this.from)) {
            this.from = startOfDay(this.to);
            this.fromChange();
        }
    }

    reload() {
        this.fetch();
    }

    fetch(){
        this.transactions = [];
        this.footerToDisplay = ['loading'];
        this.subs.add(this.transactionService.getTransactions(this.user._id, this.from, this.to)
            .subscribe(transactions => {
                this.transactions = transactions;
                if (!transactions.length) {
                    this.footerToDisplay = ['no_transactions'];
                } else {
                    this.footerToDisplay = [];
                }
            }));

        if (this.user.isStudent()) {
            this.subs.add(this.creditService.getTotalCreditBalance(this.user._id)
                .subscribe(credit => {
                    this.balance = Math.abs(credit.balance / 100);
                    console.log(this.balance);
                }));
        }

    }
}
