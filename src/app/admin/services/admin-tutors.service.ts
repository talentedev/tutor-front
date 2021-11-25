import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { toQueryString } from "../../lib/core/utils";
import { Observable } from "rxjs/Rx";
import { Subject, User } from "../../models";

@Injectable()
export class AdminTutorsService {
    editMode = false;  // set to true to open tutor profile in edit mode by default
    private _user: User;
    get selectedUser() {
        return this._user;
    }
    set selectedUser(user: User) {
        this._user = user;
    }

    constructor(
        private http: HttpClient,
    ) {
    }

    getTutors(pageIndex: number, pageSize: number, q?: string, approvedOnly = true, subject: Subject = null): Observable<any> {
        const params: {[k: string]: any} = {
            q,
            page: pageIndex + 1,
            limit: pageSize,
            approvedOnly,
        };
        if (subject instanceof Subject) {
            params.subject = subject._id;
        }
        return this.http.get(`@api/users/tutors?${toQueryString(params)}`);
    }
}
