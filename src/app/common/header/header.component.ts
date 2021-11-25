import { ROUTE_TUTORS } from './../../../routes';
import {
    animate, state,
    style,

    transition, trigger
} from '@angular/animations';
import {
    AfterViewInit, ChangeDetectorRef, Component, ElementRef,
    OnDestroy, OnInit, QueryList, ViewChild, ViewChildren
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Params, Router, UrlSegment, RouterLinkActive } from '@angular/router';
import { ROUTE_DASHBOARD, ROUTE_HOME } from 'routes';
import { Subscription } from 'rxjs/Subscription';
import { Auth, Backend } from '../../lib/core/auth';
import { Media } from '../../lib/core/media';
import { SocketService } from '../../lib/core/socket';
import { UserPresence } from '../../lib/core/userpresence';
import { Subject, User } from '../../models';
import { SearchService } from '../../services/search';
import { MainMenuComponent } from '../main-menu/main-menu.component';
import { Platform } from './../../services/platform';

interface MenuItem {
    class: string;
    link: string;
    title: string;
    options?: any;
}

const STATE_ANIMATION = animate(
    '0.3s cubic-bezier(0, 0, 0, 1)'
);



@Component({
    selector: 'learnt-header',
    templateUrl: './header.component.html',
    styleUrls: [
        './header.component.scss',
        './header.component.responsive.scss',
    ],
    animations: [

        trigger('logo', [
            state('search', style({left: '10px'})),
            state('account', style({})),
            transition('search => account', [style({left: '-100px'}), STATE_ANIMATION]),
            transition('account => search', [style({}), STATE_ANIMATION]),
        ]),

        trigger('search', [
            state('search', style({left: '0'})),
            state('account', style({left: ''})),
            transition('search => account', [style({left: '0px'}), STATE_ANIMATION]),
            transition('account => search', [style({}), STATE_ANIMATION]),
        ])

    ]
})
export class HeaderComponent implements OnInit, OnDestroy, AfterViewInit {

    @ViewChildren('mainmenu', {read: MainMenuComponent})
    mainMenuQuery: QueryList<MainMenuComponent>;

    @ViewChild('searchInput')
    searchInput: ElementRef;

    state = 'account';
    mainMenu: MainMenuComponent;
    searchWorking: boolean;
    me: User;
    mobile: boolean;

    // subjects matching actual search keyword
    subjects: Subject[];

    // interval to throttle request
    autocompleteTimeout: any;

    // http request subscription used to cancel previous request
    autocompleteSub: Subscription;

    // Current chosen subject of autocomplete
    subject: Subject;

    // Actual hint index
    hintIndex = -1;

    /**
     * Menu items which'll be shown in the menu.
     * @type {MenuItem[]}
     */
    public menuItems: MenuItem[];

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

    public filtersVisibility = true;
    public headless = false;
    private searchInputTimeout: number;
    public isHomepage = false;
    searchQueryParams: any;
    private subs = new Subscription();

    constructor(private backend: Backend,
                private media: Media,
                private auth: Auth,
                private router: Router,
                private platform: Platform,
                private route: ActivatedRoute,
                private SocketService: SocketService,
                private userPresence: UserPresence,
                private cd: ChangeDetectorRef,
                private searchService: SearchService) {
        
        this.menuItems = this.affiliateItems;

        this.subs.add(this.auth.me.subscribe((me: User | null) => {
            this.me = me;
            this.menuItems = this.userItems;
            if(this.me) {
                if (this.me.isAffiliate()) {
                    this.menuItems = this.affiliateItems;
                } else {
                    this.menuItems = this.userItems;
                    if (!this.me.isTutor()) {
                        this.menuItems = this.userItems.filter(i => i.class !== 'profile');
                    }
                }
            }
            
        }));

        this.subs.add(this.router.events.subscribe(event => {
            if (event instanceof NavigationEnd) {
                this.updateState();
            }
        }));

         // if we're here from search, hide the menu
        this.subs.add(this.route.queryParams.subscribe(p => {
            if (p.headless !== null && p.headless !== undefined) {
                this.headless = true;
            }
        }));

        this.mobile = !media.query('gt-sm');
        this.subs.add(media.watch('gt-sm').subscribe(event => {
            this.mobile = !event.active;
            if (!this.cd['destroyed']) {
                this.cd.detectChanges();
            }
        }));
    }

    ngOnInit(): void {
        this.searchSubscriptions();
        this.updateState();
    }

    isActive(rla: RouterLinkActive, item: MenuItem) {
        return rla.isActive
    }

    private updateState(): void {
        this.isHomepage = location.pathname === '/';

        if (location.pathname.indexOf(ROUTE_TUTORS) === 0) {
            this.state = 'search';

            // reset filters visibility to visible
            this.searchService.filterVisibility.next(true);
        } else {
            this.state = 'account';
        }
    }

    private searchSubscriptions(): void {
        this.searchService.filterVisibility.subscribe((visible: boolean) => this.filtersVisibility = visible);
        this.searchService.working.subscribe((working: boolean) => this.onSearchingWorking(working));
    }

    ngOnDestroy(): void {
        this.cd.detach();
        this.subs.unsubscribe();
    }

    logout(event: MouseEvent) {
        // event.stopPropagation();
        this.auth.logout();
        this.SocketService.disconnect();
    }

    public admin(event: any): void {
        event.stopPropagation();
        this.router.navigateByUrl('/admin');
    }

    ngAfterViewInit() {
        this.subs.add(this.mainMenuQuery.changes.subscribe(m => this.mainMenu = m.first));

        this.subs.add(this.route.queryParams.subscribe((p: Params) => {
            this.searchQueryParams = p;
            if (p.query === null || p.query === undefined) {
                return;
            }

            if (p.query !== '') {
                (<HTMLInputElement>this.searchInput.nativeElement).value = p.query;
            }
        }));
    }

    showSearch() {
        const showSearchQueryParams = Object.assign( {}, this.searchQueryParams);
        delete showSearchQueryParams.query;
        (<HTMLInputElement>this.searchInput.nativeElement).value = '';
        this.state = 'search';
        this.searchInput.nativeElement.focus();

        setTimeout(() => {
            if (this.router.routerState.snapshot.url !== ROUTE_TUTORS) {
                this.router.navigateByUrl(ROUTE_TUTORS);
            } else {
                this.router.navigate([], {queryParams: showSearchQueryParams});
            }
            this.searchInput.nativeElement.focus();
        }, 200);
    }

    onInputBlur(event) {
        event.stopPropagation();
        setTimeout(() => {
            this.subjects = [];
        }, 400);
    }

    closeSearch() {
        let url = ROUTE_HOME;

        if (this.auth.isLoggedIn()) {
            url = ROUTE_DASHBOARD;
        }

        this.state = 'account';

        setTimeout(() => {
            this.router.navigateByUrl(url);
            this.searchInput.nativeElement.blur();
            this.searchInput.nativeElement.value = '';
        }, 200);
    }

    toggleFilters() {
        this.filtersVisibility = !this.filtersVisibility;
        this.searchService.filterVisibility.next(this.filtersVisibility);
        if (this.filtersVisibility) {
            this.subjects = [];
        }
    }

    toggleMainMenu() {
        if (this.mainMenu) {
            this.mainMenu.toggle();
        }
    }

    hintSelect(subject: Subject) {
        this.subject = subject;
        this.searchService.SearchSubject(subject);
        this.subjects = null;
        this.searchInput.nativeElement.value = subject.name;
    }

    public onSearchInputKeyUp(event: KeyboardEvent): void {
        const keyword = (<HTMLInputElement>event.target).value;

        if (event.keyCode === 27) {
            // escape
            event.preventDefault();
            this.subjects = [];
            return;
        }

        if (event.keyCode === 13) {
            // enter
            event.preventDefault();

            if (this.hintIndex === -1 || this.subjects == null || this.subjects.length < 1) {
                this.subjects = [];
                this.searchService.SearchKeyword(keyword);
                this.router.navigateByUrl(ROUTE_TUTORS + '?query=' + keyword);
                return;
            }

            this.hintSelect(this.subjects[this.hintIndex]);
            return;
        }

        if (event.keyCode === 40) {
            // arrow down
            if (this.hintIndex < (this.subjects.length - 1)) {
                this.hintIndex++;
            }
            event.preventDefault();
            return;
        }

        if (event.keyCode === 38) {
            // arrow up
            if (this.hintIndex > -1) {
                this.hintIndex--;
            }
            event.preventDefault();
            return;
        }

        clearTimeout(this.searchInputTimeout);
        this.searchInputTimeout = window.setTimeout(() => {
            this.searchService.SearchKeyword(keyword);
            this.autocompleteSubjects(keyword);
        }, 200);
    }

    private autocompleteSubjects(keyword: string): void {
        clearTimeout(this.autocompleteTimeout);
        this.searchWorking = true;

        this.autocompleteTimeout = window.setTimeout(() => {
            if (this.autocompleteSub) {
                this.autocompleteSub.unsubscribe();
            }
            this.autocompleteSub = this.backend.getSubjects(keyword, 10).subscribe(subjects => {
                this.subjects = subjects;
                this.searchWorking = false;
            });
        }, 100);
    }

    showLinks() {
        return !this.me || (!this.me.hasRole('tutor') && !this.me.isAffiliate())
    }

    onSearchingWorking(s: boolean) {
        this.searchWorking = s;
        if (!this.cd['destroyed']) {
            this.cd.detectChanges();
        }
    }

    searchIsVisible(): boolean {
        return !this.isHomepage;
    }

    loginButtonIsVisible(): boolean {
        return !this.me && !this.platform.setting('pre-beta', false)
    }
}
