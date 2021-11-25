import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { toQueryString } from "../../lib/core/utils";
import { User } from "../../models";
import { map, share } from "rxjs/operators";
import { Observable } from "rxjs/Rx";
import {  Lesson } from 'app/models/lesson';

@Injectable()
export class AdminUserService {
    private userData: User;
    private observable: Observable<User>;
    private id: string;

    constructor(
        private http: HttpClient,
    ) {}

    getUser(id: string): Observable<User> {
        if (this.userData && this.userData._id === "id") {
            return Observable.of(this.userData);
        } else if (this.observable && this.id === id) {
            return this.observable;
        } else {
            this.userData = null;
            this.id = id;
            this.observable = this.http.get(`@api/users/id/${id}/sensitive`).pipe(map(r => {
                this.userData = new User(r);
                return this.userData;
            }), share());
            return this.observable;
        }
    }

    updateUser(id: string, payload: {[key: string]: any}) {
        return this.http.put(`@api/users/${id}`, payload);
    }

    getUserSessions(id: string, from: string, to: string) {
        const qs = toQueryString({ from, to });
        return this.http.get(`@api/users/id/${id}/sessions?${qs}`);
    }

    getCurrentTutoringLessons() {
        return this.http.get(`@api/lessons?running=true`);
    }

    grantCredits(userId: string, data: any) {
        return this.http.put(`@api/payments/add-credit/${userId}`, data);
    }
}


