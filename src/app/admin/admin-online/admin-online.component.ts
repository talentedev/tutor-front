import { User } from '../../models';
import { Backend } from '../../lib/core/auth';
import { Component, OnDestroy, OnInit } from '@angular/core';
import * as UAParser from 'ua-parser-js';
import { map } from 'rxjs/operators';

@Component({
    selector: 'learnt-admin-online',
    templateUrl: './admin-online.component.html',
    styleUrls: ['./admin-online.component.scss']
})
export class AdminOnlineComponent implements OnInit, OnDestroy {

    users: User[];
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
                this.users = (stats.socket.online || []).map(u => new User(u));
            },
            err => {
                this.requesting = false;
            }
        );
    }

    getDeviceInfo(ua: string): string {
        const parser = new UAParser();
        parser.setUA(ua);
        const result = parser.getResult();
        return `${result.os.name} ${result.os.version} ( ${result.browser.name} ${result.browser.version} )`;
    }

    getRoles(user: User): string {

        const roles = [];

        if (user.hasRole(2)) {
            roles.push('Student');
        }

        if (user.hasRole(4)) {
            roles.push('Tutor');
        }

        if (user.hasRole(16)) {
            roles.push('Root');
        } else if (user.hasRole(8)) {
            roles.push('Admin');
        }

        return roles.join(', ');
    }
}
