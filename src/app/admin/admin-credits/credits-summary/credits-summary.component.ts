import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { AdminTransactionsService } from "../../services/admin-transactions.service";
import { MatTableDataSource } from '@angular/material/table';
import { Transaction } from "../../../models";
import startOfMonth from 'date-fns/startOfMonth';
import startOfDay from 'date-fns/startOfDay';
import endOfDay from 'date-fns/endOfDay';
import isAfter from 'date-fns/isAfter';
import isBefore from "date-fns/isBefore";

@Component({
    selector: 'learnt-credits-summary',
    templateUrl: './credits-summary.component.html',
    styleUrls: ['./credits-summary.component.scss']
})
export class CreditsSummaryComponent implements AfterViewInit {

    @ViewChild('matPaginator') paginator: MatPaginator;
    columnsToDisplay = ['date', 'name', 'details', 'state', 'amount'];
    footerToDisplay = [];
    dataSource: any;
    transactions: any;
    pageIndex = 0;
    pageSize = 10;
    from: Date;
    to: Date
    maxDate: Date;
    minDate: Date;
    userFilter = 'all';
    
    constructor(public transactionService: AdminTransactionsService) {
        this.from = startOfMonth(new Date());
        this.to = endOfDay(new Date());
        this.maxDate = endOfDay(this.to);
    }

    ngOnInit() {
        this.getCreditsSummaryTransactions();
    }

    ngAfterViewInit(): void {
        if(this.dataSource) {
            this.dataSource.paginator = this.paginator;
        }  
    }

    onPaginatorChange(event: PageEvent) {
        this.pageSize = event.pageSize;
        this.pageIndex = event.pageIndex;
    }

    fromChange() {
        this.from = startOfDay(this.from);
        if (isAfter(this.from, this.to)) {
            this.to = endOfDay(this.from);
            this.toChange();
        }
    }

    toChange() {
        this.to = endOfDay(this.to);
        if (isBefore(this.to, this.from)) {
            this.from = startOfDay(this.to);
            this.fromChange();
        }
    }

    private getCreditsSummaryTransactions() {
        this.footerToDisplay = ['spinner'];
        
        this.transactionService.getCreditsSummaryTransactions(this.from, this.to).subscribe((response: any) => {
            this.dataSource = new MatTableDataSource<Transaction>([]); 

            if(response && response.length > 0) {

                this.transactions = response.map(t => new Transaction(t));
                this.footerToDisplay = ['date', 'name', 'details', 'state', 'amount'];
                this.filterResults();               
            }
            else {
                this.footerToDisplay = ['noResults'];
            }

            if(this.dataSource) {
                this.dataSource.paginator = this.paginator;
            }  
        })
    }

    refresh() {
        this.getCreditsSummaryTransactions();
    }

    calculateTotal() {
        return this.dataSource.data.reduce((accum, curr) => accum + curr.amount, 0);
    }

    selectOnchange(event) { 
        this.userFilter = event.value; 
        this.filterResults();
    }

    filterResults() { 
        if(this.userFilter == 'all') {
            this.dataSource.data = this.transactions;
        }
        else {
            const filteredTransactions = this.transactions.filter(t => t.user.role == this.userFilter);
            this.dataSource.data = filteredTransactions;
        }   
    }
}
