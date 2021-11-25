import { CommonModule } from '@angular/common';
import { Injectable, NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
    ActivatedRouteSnapshot,
    CanActivate,
    Router,
    RouterModule,
    RouterStateSnapshot,
    UrlTree,
} from '@angular/router';
import { MessengerFrontService } from '@services/messenger';
import { NotificationsService } from '@services/notifications';
import { Platform } from '@services/platform';
import { ROUTE_DASHBOARD } from 'routes';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommonComponentsModule } from './common/common-components.module';
import { EntryComponentsModule } from './common/entry-components.module';
import { StudentWaitingPageComponent } from './common/student-waiting-page/student-waiting-page.component';
import { Auth } from './lib/core/auth';
import { PipeModule } from './lib/core/pipes/pipe.module';
import { User } from './models';
import { AccountWrapperComponent } from './pages/account-wrapper/account-wrapper.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';


@Injectable()
export class DashboardRedirect implements CanActivate {

    constructor(private auth: Auth, private router: Router) {
    }


    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        return this.auth.me.pipe(
            map((user: User) => {
                if (user) {
                    return this.router.parseUrl(ROUTE_DASHBOARD);
                }
                return true;
            }),
        );
    }
}

@NgModule({
    declarations: [
        StudentWaitingPageComponent,
        AccountWrapperComponent,
        LoginPageComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatInputModule,
        MatSelectModule,
        MatFormFieldModule,
        EntryComponentsModule,
        MatButtonModule,
        PipeModule,
        RouterModule.forChild([
            {
                path: '', component: AccountWrapperComponent, canActivate: [DashboardRedirect], children: [
                    { path: 'login', component: LoginPageComponent, data: { mode: 'login' } },
                    { path: 'recover-password', component: LoginPageComponent, data: { mode: 'recover-password' } },
                    { path: 'change-password', component: LoginPageComponent, data: { mode: 'change-password' } },
                    { path: 'register', component: LoginPageComponent, data: { mode: 'register' } },
                    {
                        path: 'register/affiliate',
                        component: LoginPageComponent,
                        data: { mode: 'register', affiliate: true },
                    },
                    { path: 'register/welcome', component: StudentWaitingPageComponent },
                    { path: 'promo/:code', component: LoginPageComponent, data: { mode: 'register', referrer: true } },
                ],
            },
        ]),
        CommonComponentsModule,
        MatIconModule,
        FlexLayoutModule,
        MatTooltipModule,
    ],
    providers: [
        MessengerFrontService,
        DashboardRedirect,
        NotificationsService,
        Platform
    ]
})
export class AccountModule {
}
