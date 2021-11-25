import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { toQueryString } from "../../lib/core/utils";
import { map } from "rxjs/operators";
import { Transaction } from "../../models";
import { Observable } from "rxjs/Rx";

@Injectable()
export class AdminTransactionsService {
    loading = false;

    constructor(private http: HttpClient) {
    }

    getTransactions(id: string, from: Date, to: Date): Observable<Transaction[]> {
        const qs = toQueryString({from: from.toISOString(), to: to.toISOString()});
        return this.http.get(`@api/users/id/${id}/transactions?${qs}`)
            .pipe(map((data: any[]): Transaction[] => {
                const transactions = data.map(r => new Transaction(r));
                if (this.loading) {
                    this.loading = false;
                }
                return transactions;
            }));
    }

    getCreditsSummaryTransactions(from: Date, to: Date) {
        const qs = toQueryString({from: from.toISOString(), to: to.toISOString()});
        return this.http.get(`@api/platform/credits-summary?${qs}`);
    }
}
