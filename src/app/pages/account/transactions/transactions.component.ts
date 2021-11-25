import { Backend, Auth, TokenLocalStorage } from '../../../lib/core/auth';
import { Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import * as moment from 'moment';
import {Transaction, User} from '../../../models';
import { environment } from 'environments/environment';
import { toQueryString } from "../../../lib/core/utils";
import { HttpClient } from "@angular/common/http";
import { fromEvent, Subscription } from "rxjs";
import { debounce, debounceTime, takeUntil, filter } from "rxjs/operators";

@Component({
    selector: 'learnt-transactions',
    templateUrl: './transactions.component.html',
    styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent implements OnInit, OnDestroy {
    from: moment.Moment;
    math = Math;
    transactions: Transaction[] = [];
    working: boolean;
    me: User;
    transactionCount: number;
    page: number;
    private _limit = 50;
    downloading: boolean;
    private _fetchSubs = new Subscription();
    private _fetchEvent: EventEmitter<string>;

    constructor(private backend: Backend,
                private auth: Auth,
                private http: HttpClient,
                private token: TokenLocalStorage) {
        this.transactionCount = 0;
        this.page = 1;
        this.downloading = false;
        this._fetchEvent = new EventEmitter<any>();

        this.auth.me.pipe(filter(Boolean)).subscribe((me: User) => {
            this.me = me;
            this.from = moment.tz(me.timezone).startOf('month');
        });
    }

    ngOnInit(): void {
        this._fetchEvent.pipe(debounceTime(500)).subscribe(this.fetch.bind(this));
        this._fetchEvent.emit();
    }

    ngOnDestroy(): void {
        this._fetchSubs.unsubscribe();
    }

    public navigate(dir: number) {
        this.from = this.from.clone().add(dir, 'month');
        this._fetchEvent.emit();
    }

    private fetch() {
        this.working = true;
        this.transactions = [];
        this.backend.getTransactionsPaged(
            this.from.clone().utc().format(),
            this.from.clone().endOf('month').utc().format(),
            this.page,
            this._limit
        ).pipe(takeUntil(this._fetchEvent)).subscribe(({transactions, count}) => {
            this.transactions = transactions;
            this.transactionCount = count;
            this.working = false;
        });
    }

    public get earnings(): number {
        let sum = 0;
        this.transactions.forEach(t => sum += t.amount);
        if (sum < 0) {
            return 0;
        }
        return sum;
    }

    public async download() {
        const from = moment(this.from).tz(this.me.timezone).startOf('month');
        const to = from.clone().endOf('month');
        const qs = toQueryString({
            from: from.utc().format(),
            to: to.utc().format(),
            download: true,
        });
        const token = await this.token.get();
        this.downloading = true;
        this.http.get(`${environment.API_HOST}/me/transactions?${qs}`, {
            headers: {
                "Authorization": "Bearer " + token,
            },
            responseType: "blob"
        }).subscribe(data => {
            this.downloading = false;
            const file = window.URL.createObjectURL(data);
            const a = document.createElement("a");
            a.href = file;
            a.target = "_blank";
            document.body.appendChild(a);
            a.onclick = () => {
                setTimeout(() => a.remove(), 500);
            }
            a.click();
        }, err => {
            console.error(err);
            this.downloading = false;
        });
    }

    get limit(): number {
        return this._limit;
    }

    navPage(number: number) {
        this.page += number;
        this.fetch();
    }
}
