import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, ResolveStart, Router } from '@angular/router';
import { AccountService } from 'app/services/account';
import { Platform } from 'app/services/platform';
import 'rxjs-compat/add/operator/filter';
import 'rxjs-compat/add/operator/map';
import { Subscription } from 'rxjs/Subscription';
import { environment } from '../../../environments/environment';
import { Auth, Backend } from '../../lib/core/auth';
import { Media } from '../../lib/core/media';
import { User } from '../../models';
import { LayoutService } from '../../services/layout';
import { LessonNotificationService } from '../../services/lesson.notifications';
import { Timezone, TimezoneService } from '../../services/timezone';
import { filter } from 'rxjs/operators';

const WITH_FOOTER = ['/', '/account/register', '/account/login', '/account/recover-password', '/main/dashboard'];

@Component({
    selector: 'learnt-layout',
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit, OnDestroy {
    public APIDomain: string;
    public previousUrl: string;
    public noMenu = false;
    public noScroll = false;

    private me: User;

    private subscriptions: Subscription = new Subscription();

    showFooterLinks = false;

    constructor(
        private media: Media,
        private auth: Auth,
        private router: Router,
        private route: ActivatedRoute,
        private _: LessonNotificationService,
        private activatedRoute: ActivatedRoute,
        private service: LayoutService,
        private cdRef: ChangeDetectorRef,
        private account: AccountService,
        private platform: Platform,
        private backend: Backend,
        private timezoneService: TimezoneService
    ) {
        this.APIDomain = environment.API_HOST;
        const res = WITH_FOOTER.find((url) => this.router.url === url);
        if (res) this.showFooterLinks = true;
    }

    ngOnInit(): void {
        this.subscriptions.add(
            this.auth.me.pipe(filter(Boolean)).subscribe((me: User) => {
                this.me = me;

                if (this.me.timezone !== undefined && this.me.timezone !== '') {
                    return;
                }

                // no timezone set, update from browser
                this.timezoneService.USTimezones.subscribe((tzs: Timezone[]) => {
                    const timezone = this.timezoneService.zone(TimezoneService.BrowserTimezone, true);
                    this.backend.updateCurrentUser({ timezone: timezone.zone }).subscribe(
                        () => (this.me.timezone = timezone.zone),
                        () => false
                    ); // TEST
                });
            })
        );

        this.handleMenuShow();

        // refreshing the page does not trigger a NavigationEnd event
        // in order to rely on this.getRouteData, therefore we need to
        // manually check if noMenu is set for the current route
        const firstChild = this.activatedRoute.firstChild;
        if (firstChild) {
            const snapshot = firstChild.snapshot;
            if (snapshot !== undefined) {
                const initData = snapshot.data;
                if (initData && !initData.noMenu) {
                    this.service.ShowMenu();
                }
            }
        }

        this.getRouteData();
        this.checkFooterIsVisible();
        this.account.init();
    }

    /**
     * Display footer on certain pages only
     */
    checkFooterIsVisible() {
        this.router.events.subscribe((event) => {
            if (event instanceof ResolveStart) {
                this.showFooterLinks = false;
                WITH_FOOTER.forEach((allow) => {
                    if (allow === event.url) {
                        this.showFooterLinks = true;
                        return;
                    }
                });
            }
        });
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
        this.account.unsubscribe();
        this.cdRef.detach();
    }

    /**
     * Get route changes.
     */
    private getRouteData(): void {
        this.subscriptions.add(
            this.router.events
                .filter((e) => e instanceof NavigationEnd)
                .map(() => {
                    let child = this.activatedRoute.firstChild;
                    const data = child.snapshot.data;

                    while (child) {
                        if (child.firstChild) {
                            child = child.firstChild;
                        } else if (data && (data['noMenu'] || data['noScroll'])) {
                            return data;
                        } else {
                            return null;
                        }
                    }
                    return null;
                })
                .subscribe((data: any) => {
                    this.checkRouteData(data);
                })
        );
    }

    private checkRouteData(data: any): void {
        if (data === null) {
            this.service.ShowMenu();
            return;
        }

        if (data.noMenu) {
            this.service.HideMenu();
        }

        this.noScroll = data.noScroll || false;
    }

    /**
     * Handle the menu showing dynamically by listening for events.
     */
    private handleMenuShow(): void {
        this.subscriptions.add(
            this.service.showMenu.subscribe((v: boolean) => {
                this.noMenu = !v;
                if (!this.cdRef['destroyed']) {
                    this.cdRef.detectChanges();
                }
            })
        );
    }

    public hasUser(): boolean {
        return this.me !== null && this.me !== undefined;
    }
}
