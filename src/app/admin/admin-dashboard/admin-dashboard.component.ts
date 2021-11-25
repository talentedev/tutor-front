import { Backend } from '../../lib/core/auth';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';

@Component({
    selector: 'learnt-admin-dashboard',
    templateUrl: './admin-dashboard.component.html',
    styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {

    stats: any;
    intv: any;
    requesting: boolean;

    constructor(
        private backend: Backend
    ) { }

    ngOnInit() {
        this.update();
        this.intv = setInterval(() => this.update(), 5000);
    }

    ngOnDestroy() {
        if (this.intv) {
            clearInterval(this.intv);
            this.intv = null;
        }
    }

    update() {
        this.requesting = true;
        this.backend.getPlatformStats().subscribe(
            stats => {
                this.requesting = false;
                this.stats = stats;
            },
            err => {
                this.requesting = false;
            }
        );
    }

    get onlineUsers() {
        return this.stats.socket.online.length;
    }

    get onlineTutors() {
        return this.onlineWithRole(4);
    }

    get onlineStudents() {
        return this.onlineWithRole(2);
    }

    get onlineAdmins() {
        return this.onlineWithRole(24);
    }

    onlineWithRole(role: number): number {
        let online = 0;
        for (let i = 0; i < this.stats.socket.online.length; i++) {
            if ((this.stats.socket.online[i].role & role) !== 0) {
                online++;
            }
        }
        return online;
    }
}
