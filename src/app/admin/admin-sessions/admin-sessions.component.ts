import { Component, Input, OnInit } from "@angular/core";
import { AdminUserService } from "../services/admin-user.service";
import startOfMonth from "date-fns/startOfMonth";
import endOfDay from "date-fns/endOfDay";
import _isArray from 'lodash-es/isArray';
import { Lesson } from "../../models/lesson";
import isAfter from "date-fns/isAfter";
import isBefore from "date-fns/isBefore";
import startOfDay from "date-fns/startOfDay";
import format from 'date-fns/format';
import formatISO from 'date-fns/formatISO';
import subMinutes from 'date-fns/subMinutes';
import { Subscription } from "rxjs/Rx";
import { HttpErrorResponse } from "@angular/common/http";

@Component({
    selector: ".learnt-admin-sessions",
    templateUrl: "./admin-sessions.component.html",
    styleUrls: ['./admin-sessions.component.scss'],
})
export class AdminSessionsComponent implements OnInit {
    @Input() userId: string;
    @Input() role: string;
    from: Date;
    to: Date;
    sessions: Lesson[] = [];
    displayedColumns: string[] = [];
    displayedFooter: string[] = [];
    maxDate: Date;
    private subs = new Subscription();
    loading = false;
    error: string;

    constructor(
        private userService: AdminUserService,
    ) {
        const now = new Date();
        this.from = startOfMonth(now);
        this.to = endOfDay(now);
        this.maxDate = endOfDay(now);
    }

    ngOnInit() {
        this.fetch();
        this.displayedColumns = ['id', 'subject', this.role === 'tutor'? 'student' : 'tutor', 'type', 'duration', 'start', 'end'];
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

    fetch() {
        this.loading = true;
        this.displayedFooter = ['loading'];
        const fromDate = new Date(this.from.getFullYear(), this.from.getMonth(), this.from.getDate());
        const toDate = new Date(this.to.getFullYear(), this.to.getMonth(), this.to.getDate());
        const from = formatISO(startOfDay(subMinutes(fromDate, fromDate.getTimezoneOffset())));
        const to = formatISO(endOfDay(subMinutes(toDate, toDate.getTimezoneOffset())));
        this.subs.add(this.userService.getUserSessions(this.userId, from, to)
            .subscribe(d => {
                if (d && _isArray(d) && d.length) {
                    this.sessions = (d as Array<any>).map(r => new Lesson(r));
                    this.displayedFooter = [];
                } else {
                    this.displayedFooter = ['no_sessions'];
                    this.sessions = [];
                }
                this.loading = false;
            }, (err: HttpErrorResponse) => {
                this.error = err.error;
                this.displayedFooter = ['error'];
                this.loading = false;
            }));
    }
}
