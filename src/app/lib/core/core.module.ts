import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ComponentFactoryResolver, ComponentRef, CUSTOM_ELEMENTS_SCHEMA, ErrorHandler, Injectable, ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { HammerGestureConfig, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { NotificationComponent } from 'app/common/notification/notification.component';
import { User } from 'app/models';
import { AccountService } from 'app/services/account';
import { MessengerFrontService } from 'app/services/messenger';
import { environment } from 'environments/environment';
import { UserAvatarComponent } from './../../common/user-avatar/user-avatar.component';
import { AlertService } from './../../services/alerts';
import { NewAlertService } from './../../services/new-alert';
import { NerdlyErrorHandler } from './../../services/errors';
import { NotificationsService } from './../../services/notifications';
import { AVATAR_FACTORY, AVATAR_FACTORY_CONFIG_FN } from './../calendar/components/class/class.component';
import { Auth, Backend, CookieTokenStorage, LoggedUserGuard } from './auth';
import { TOKEN_STORAGE } from './auth/auth';
import { BACKEND_HOST } from './auth/backend';
import { HttpAuthorizationInterceptor } from './auth/interceptor';
import { TokenLocalStorage } from './auth/storage';
import { MicroEvents } from './common/events';
import { Logger } from './common/logger';
import { InnerRemoteDirective } from './directives/inner-remote';
import { IfRoleDirective } from './directives/role';
import { SocialLoginDirective } from './directives/social-login';
import { SocialLogoutDirective } from './directives/social-logout';
import { Bus } from './eventbus';
import { Media } from './media';
import { SocketService } from './socket';
import { API_SOCKET_URL } from './socket/socket';
import { UserPresence } from './userpresence';
import { MAT_RIPPLE_GLOBAL_OPTIONS } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import {MatIconModule} from "@angular/material/icon";
import { LocationService } from "../../services/location.service";

export function NERDLY_CALENDAR_AVATAR_FACTORY(resolver: ComponentFactoryResolver) {
    return resolver.resolveComponentFactory(UserAvatarComponent);
}

export function NERDLY_CALENDAR_AVATAR_CONFIG(componentRef: ComponentRef<UserAvatarComponent>) {
    componentRef.instance.size = 24;
}


@Injectable()
export class HammerConfig extends HammerGestureConfig {
    overrides = <any>{
        pan: {direction: 6},
        pinch: {enable: false},
        rotate: {enable: false},
    };
}

@NgModule({
    id: 'core',
    declarations: [
        InnerRemoteDirective,
        IfRoleDirective,
        SocialLoginDirective,
        SocialLogoutDirective,
        NotificationComponent
    ],
    entryComponents: [
        NotificationComponent,
    ],
    imports: [
        HttpClientModule,
        MatDialogModule,
        MatIconModule,
    ],
    exports: [
        InnerRemoteDirective,
        IfRoleDirective,
        SocialLoginDirective,
        SocialLogoutDirective,
    ],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CoreModule {

    static forRoot(): ModuleWithProviders {
        return {
            ngModule: CoreModule,
            providers: [
                LoggedUserGuard,
                CookieTokenStorage,
                TokenLocalStorage,
                Backend,
                Auth,
                SocketService,
                Media,
                Bus,
                AccountService,
                MessengerFrontService,
                NotificationsService,
                AlertService,
                NewAlertService,
                UserPresence,
                LocationService,
                { provide: 'bus', useFactory: MicroEvents.single  },
                { provide: Logger, useClass: Logger, deps: [] },
                { provide: HTTP_INTERCEPTORS, useClass: HttpAuthorizationInterceptor, multi: true },
                { provide: HAMMER_GESTURE_CONFIG, useClass: HammerConfig },
                { provide: BACKEND_HOST, useValue: environment.API_HOST },
                { provide: TOKEN_STORAGE, useClass: TokenLocalStorage },
                { provide: API_SOCKET_URL, useValue: environment.API_SOCKET_URL },
                { provide: AVATAR_FACTORY, useFactory: NERDLY_CALENDAR_AVATAR_FACTORY, deps: [ComponentFactoryResolver] },
                { provide: AVATAR_FACTORY_CONFIG_FN, useValue: NERDLY_CALENDAR_AVATAR_CONFIG },
                { provide: MAT_RIPPLE_GLOBAL_OPTIONS, useValue: {disabled: false} },
                { provide: ErrorHandler, useClass: NerdlyErrorHandler },
            ]
        };
    }

    constructor(@Optional() @SkipSelf() parentModule?: CoreModule) {
        if (parentModule) {
            throw new Error('Core Module already loaded');
        }
    }
}
