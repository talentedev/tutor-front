import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { toQueryString } from "../../lib/core/utils";
import { map } from "rxjs/operators";
import { BehaviorSubject, Observable } from "rxjs/Rx";
import { User } from "../../models";
import { Subscriber } from "rxjs";

interface GetStudentListResponse {
    count: number,
    students: null | any[],
}

interface StudentListData {
    count: number,
    students: User[]
}

@Injectable({
    providedIn: 'root'
})
export class AdminStudentsService {
    list$ = new BehaviorSubject<StudentListData>(null);
    pageIndex: number;
    pageSize: number;
    private prevQuery = "";
    editMode = false;

    constructor(private http: HttpClient) {
        this.pageIndex = 0;
        this.pageSize = 10;
    }

    getStudentList(q: string) {
        if (this.prevQuery != q) {
            this.pageIndex = 0;
        }
        this.prevQuery = q;
        this.http.get(`@api/users/students?${toQueryString({page: this.pageIndex + 1, limit: this.pageSize, q})}`)
            .subscribe((d: GetStudentListResponse) => {
                let res = {...d, students: []}
                if (d.students) {
                    res = {
                        students: d.students.map(s => new User(s)),
                        count: d.count,
                    }
                }
                this.list$.next(res);
            });
    }

    getStudent(id: string): Observable<User> {
        return this.http.get<Observable<User>>(`@api/users/id/${id}/sensitive`).pipe(map(r => new User(r)));
    }

    getStudentData(id: string): Observable<User> {
        return new Observable(
            (subscriber: Subscriber<User>)=> {
                const res = this.list$.getValue()?.students.filter(u => u._id === id);
                if (res && res.length) {
                    subscriber.next(res[0]);
                    subscriber.complete();
                }
                this.getStudent(id).subscribe(user => {
                    subscriber.next(user);
                    subscriber.complete();
                }, (err) => {
                    subscriber.error(err);
                    subscriber.complete();
                });
            }
        );
    }
}
