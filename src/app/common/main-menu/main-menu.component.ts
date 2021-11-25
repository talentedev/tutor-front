import {User} from '../../models';
import {Component, HostListener, ChangeDetectorRef, ElementRef, OnInit} from '@angular/core';
import {Media} from '../../lib/core/media';
import {Auth} from '../../lib/core/auth';
import { Router, NavigationEnd, Event, RouterLinkActive } from '@angular/router';
import { filter } from "rxjs/operators";

interface MenuItem {
    class: string;
    link: string;
    title: string;
    options?: any;
}

@Component({
    selector: 'learnt-main-menu',
    templateUrl: './main-menu.component.html',
    styleUrls: [
        './main-menu.component.scss',
        './main-menu.component.desktop.scss',
        './main-menu.component.mobile.scss'
    ]
})
export class MainMenuComponent implements OnInit {

    public menuExpanded: boolean;

    public skipDocumentClick: boolean;

    public isSplit: boolean;

    public routerUrl: string;

    /**
     * Menu items which'll be shown in the menu.
     * @type {MenuItem[]}
     */
    public menuItems: MenuItem[];

    /**
     * The logged in user;
     */
    private me: User;

    /**
     * Menu items visible to a regular (non-affiliate) users.
     * @type {MenuItem[]}
     */
    private userItems: MenuItem[] = [
        {class: 'dashboard', link: '/main/dashboard', title: 'Dashboard', options: {exact: true}},
        {class: 'inbox', link: '/main/inbox', title: 'Inbox'},
        {class: 'refer-tutors', link: '/main/referrals', title: 'Refer Users'},
        {class: 'profile', link: '/main/profile', title: 'Profile'},
        {class: 'account', link: '/main/account', title: 'Your Account', options: {exact: false}},
    ];

    /**
     * Menu items visible to affiliate users.
     * @type {MenuItem[]}
     */
    private affiliateItems: MenuItem[] = [
        {class: 'dashboard', link: '/main/dashboard', title: 'Dashboard'},
        {class: 'invites', link: '/main/invites', title: 'Invites'},
        {class: 'account', link: '/main/account/payment', title: 'Account'},
    ];

    constructor(private ref: ElementRef,
                private cd: ChangeDetectorRef,
                private media: Media,
                private auth: Auth,
                private router: Router) {

        this.router.events.subscribe((event: Event) => {
            if (event instanceof NavigationEnd) {
                this.setRouterUrl(event.url);
            }
        });

        this.auth.me.pipe(filter(Boolean)).subscribe((me: User) => {
            this.me = me;
            this.menuItems = this.userItems;

            if (this.me.isAffiliate()) {
                this.menuItems = this.affiliateItems;
            } else {
                this.menuItems = this.userItems;
                if (!this.me.isTutor()) {
                    this.menuItems = this.userItems.filter(i => i.class !== 'profile');
                }
            }
        });
    }

    ngOnInit() {
       this.setRouterUrl(this.router.url);
    }

    isActive(rla: RouterLinkActive, item: MenuItem) {
        return rla.isActive
    }

    setRouterUrl(url: string) {
        this.routerUrl = url;
        this.isSplit = url.startsWith('/account') || url === '/main/profile/edit' || url === '/main/invites' || url === '/main/referrals/management';
    }

    toggle() {
        this.skipDocumentClick = true;
        setTimeout(() => {
            this.menuExpanded = !this.menuExpanded;
            this.skipDocumentClick = false;
        });
    }

    expand(event: MouseEvent) {
        if (this.media.query('gt-sm')) {
            return;
        }

        if (!this.menuExpanded && !this.isSplit) {
            event.stopImmediatePropagation();
        }
        this.menuExpanded = !this.menuExpanded;
    }


    @HostListener('document:click', ['$event'])
    @HostListener('document:touchstart', ['$event'])
    onDocumentClick(event) {
        if (this.skipDocumentClick) {
            return;
        }
        const e: HTMLElement = this.ref.nativeElement;
        if (!e.contains(<Node>event.target) && this.menuExpanded) {
            this.menuExpanded = false;
        }
    }
}
