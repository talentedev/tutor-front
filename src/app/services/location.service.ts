import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { map, take } from "rxjs/operators";
import { State } from "../models/state";
import { Observable } from "rxjs/Observable";
import { City } from "../models/city";
import { toQueryString } from "../lib/core/utils";
import _uniq from 'lodash-es/uniqWith';
import { STATES } from "../lib/helpers/states";

@Injectable({
    providedIn: 'root'
})
export class LocationService {
    states: State[] = [];
    cities: City[] = [];

    constructor(
        private http: HttpClient,
    ) {
        this.states = STATES;
    }

    async getCities(q: string): Promise<void> {
        if (!q) {
            this.cities = [];
            return;
        }
        await this.http.get(`@api/countries/5936ac0bdc27f966e6216971/cities?${toQueryString({q})}`).subscribe((data: {[p:string]: any}[]) => {
            this.cities = _uniq(data.map(raw => new City(raw.name)), (a: City, b: City) => (a.name === b.name));
        });
    }
}
