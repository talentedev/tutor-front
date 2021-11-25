import {User} from '../../models';
import {Auth} from '../../lib/core/auth';
import {Component, ElementRef, HostBinding, ViewChild, HostListener} from '@angular/core';
import {ROUTE_ANIMATION_DEFAULT} from '../../app.animation';
import { ActivatedRoute } from "@angular/router";

@Component({
    selector: 'learnt-account-page',
    templateUrl: './account-page.component.html',
    styleUrls: [
        './account-page.component.scss',
        // './account-page.component.desktop.scss',
        './account-page.component.mobile.scss',
    ],
    animations: [ROUTE_ANIMATION_DEFAULT]
})
export class AccountPageComponent {
    @HostBinding('@routeAnimation')
    routeAnimation = true;

    @HostBinding('attr.layout')
    layoutMobile = 'column';

    @HostBinding('attr.layout-gt-sm')
    layoutDesktop = 'row';

    @ViewChild('items')
    public items: ElementRef;

    public me: User;

    constructor(private auth: Auth, private route: ActivatedRoute) {
        this.me = this.route.parent.snapshot.data.me;
    }
}
