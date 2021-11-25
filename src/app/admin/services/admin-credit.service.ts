import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { toQueryString } from "../../lib/core/utils";
import { map } from "rxjs/operators";
import { Credit } from "../../models";
import { Observable } from "rxjs/Rx";

const createType = (t: any) => (v: any) => new t(v);

const mapType = (t: any) => (o: Observable<any>) => {
    return o.map(createType(t))
};

@Injectable()
export class AdminCreditService {
    loading = false;

    constructor(private http: HttpClient) {
    }

    getTotalCreditBalance(id: string): Observable<Credit> {
        return this.http.get(`@api/users/id/${id}/balance`).pipe(mapType(Credit));
    }
}
