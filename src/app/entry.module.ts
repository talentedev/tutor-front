import { CommonModule } from '@angular/common';
import { APP_INITIALIZER, Component, CUSTOM_ELEMENTS_SCHEMA, Injectable, NgModule, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BrowserModule, HAMMER_GESTURE_CONFIG, HammerGestureConfig, HammerModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NavigationEnd, RouteConfigLoadEnd, RouteConfigLoadStart, Router, RouterModule, Routes } from '@angular/router';
import { IconRegistryService } from '@services/icons';
import { LayoutService } from '@services/layout';
import { SocialSharing } from '@services/social';
import { TimezoneService } from '@services/timezone';
import { Auth, TokenLocalStorage } from 'app/lib/core/auth';
import { NotificationsService } from 'app/services/notifications';
import * as Hammer from 'hammerjs';
import { AppRoutesProvider, ROUTE_LOGIN } from 'routes';
import { filter, take } from 'rxjs/operators';
import { AppInitService } from './app-init.service';
import { CommonComponentsModule } from './common/common-components.module';
import { EntryComponentsModule } from './common/entry-components.module';
import { InstantRequestNotificationComponent } from './common/notification/instant-request/instant-request.component';
import { CoreModule } from './lib/core/core.module';
import { ApplyGuard, HomePageGuard } from './lib/core/guards';
import { User } from './models';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { LegalComponent } from './pages/legal/legal.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

@Injectable()
export class HammerConfig extends HammerGestureConfig {
    overrides = <any>{
        pan: { direction: Hammer.DIRECTION_ALL },
        pinch: { enable: false },
        rotate: { enable: false },
        swipe: { direction: Hammer.DIRECTION_ALL },
    };
}

@Component({
    selector: 'learnt-wrapper',
    styles: [':host { display: block; height: 100%; }'],
    template: `
        <div *ngIf="preloading; else contents" class="startup-screen">
            <div class="center"><div class="spinner"></div><img src="/assets/logo.svg" /></div>
        </div>
        <ng-template #contents><router-outlet></router-outlet></ng-template>
    `,
})
export class EntryComponent implements OnInit {
    preloading = false;
    previousUrl: string;

    constructor(
        private router: Router, 
        private iconRegistry: IconRegistryService, 
        private notifications: NotificationsService, 
        private auth: Auth
    ) { }

    ngOnInit() {
        this.router.events.subscribe(event => {
            if (event instanceof RouteConfigLoadStart) {
                this.preloading = true;
            } else if (event instanceof RouteConfigLoadEnd) {
                this.preloading = false;
            }
        });

        this.router.events.pipe(filter(event => event instanceof NavigationEnd))
            .subscribe((event: NavigationEnd) => {
                console.log(`PREV - ${this.previousUrl}`);
                console.log(`THIS - ${event.url}`);
                if (this.previousUrl == ROUTE_LOGIN) {                   
                    this.auth.me.pipe(filter(Boolean), take(1)).subscribe((user: User) => {                    
                        this.notifications.notifyNewUser(user);
                    });
                }
                this.previousUrl = event.url;
            });
    }
}


const appInitializer = (appInitService: AppInitService, auth: Auth, token: TokenLocalStorage) => (
    () => appInitService.Init(auth, token)
);


const routes: Routes = [
    { path: '', component: HomePageComponent, data: { noMenu: true }, canActivate: [HomePageGuard] },
    { path: 'admin', loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule) },
    {
        path: 'start/apply',
        loadChildren: () => import('./apply.module').then(m => m.ApplyModule),
        canActivate: [ApplyGuard],
    },
    { path: 'main', loadChildren: () => import('./app.module').then(m => m.AppModule) },
    { path: 'start', loadChildren: () => import('./account.module').then(m => m.AccountModule) },
    { path: 'privacy-policy', component: LegalComponent, data: { section: 'privacy-policy' } },
    { path: 'terms-of-use', component: LegalComponent, data: { section: 'terms-of-use' } },
    { path: 'tutor-payment-policy', component: LegalComponent, data: { section: 'tutor-payment-policy' } },
    { path: 'tutor-payment-policy', component: LegalComponent, data: { section: 'tutor-payment-policy' } },
    {
        path: 'independent-tutor-agreement',
        component: LegalComponent,
        data: { section: 'independent-tutor-agreement' },
    },
    { path: 'cancellation-policy', component: LegalComponent, data: { section: 'cancellation-policy' } },
    { path: '**', redirectTo: '/' },
];

const routesMod = RouterModule.forRoot(
    routes,
    { relativeLinkResolution: 'corrected' },
);

@NgModule({
    declarations: [
        HomePageComponent,
        NotFoundComponent,
        EntryComponent,
        InstantRequestNotificationComponent,
    ],
    entryComponents: [
        InstantRequestNotificationComponent,
    ],
    imports: [
        CommonComponentsModule,
        BrowserModule,
        BrowserAnimationsModule,
        CommonModule,
        MatIconModule,
        CoreModule.forRoot(),
        EntryComponentsModule,
        routesMod,
        FormsModule,
        ReactiveFormsModule,
        MatInputModule,
        MatSelectModule,
        MatFormFieldModule,
        MatButtonModule,
        HammerModule,
        MatAutocompleteModule,
    ],
    providers: [
        IconRegistryService,
        LayoutService,
        TimezoneService,
        AppRoutesProvider,
        Auth,
        HomePageGuard,
        ApplyGuard,
        SocialSharing,
        AppInitService,
        { provide: HAMMER_GESTURE_CONFIG, useClass: HammerConfig },
        {
            provide: APP_INITIALIZER,
            useFactory: appInitializer,
            deps: [AppInitService, Auth, TokenLocalStorage],
            multi: true,
        },
    ],
    bootstrap: [EntryComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class EntryModule {
}
