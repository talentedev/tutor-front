import { FullscreenOverlayContainer, OverlayContainer, OverlayModule } from '@angular/cdk/overlay';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MAT_DATE_LOCALE, MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
// import { AgmCoreModule } from '@agm/core';
import { MatGoogleMapsAutocompleteModule } from '@angular-material-extensions/google-maps-autocomplete';
import { RouterModule, Routes } from '@angular/router';
import { NgAddToCalendarModule, NgAddToCalendarService } from '@trademe/ng-add-to-calendar';
import { AddToCalendarService } from 'app/services/add-to-calendar.service';
import { BookingPanelModule } from './common/booking-panels/module';
import { BoxComponent } from './common/box/box.component';
import { CommonComponentsModule } from './common/common-components.module';
import { LayoutComponent } from './common/layout/layout.component';
import { MainMenuComponent } from './common/main-menu/main-menu.component';
import { NotificationsListComponent } from './common/notifications-list/notifications-list.component';
import { ReferralsBoxComponent } from './common/referrals-box/referrals-box.component';
import { DialogsModule } from './dialogs';
import { CancelLessonDialogComponent } from './dialogs/cancel-lesson/cancel-lesson.component';
import { NerdlyCalendarModule } from './lib/calendar/calendar.module';
import { ExpectedAffiliateGuard, ExpectedRegularUserGuard, LoggedUserGuard, UserResolver } from './lib/core/auth';
import { PipeModule } from './lib/core/pipes/pipe.module';
import { PluralizePipe } from './lib/core/pipes/pluralize';
import { TruncatePipe } from './lib/core/pipes/truncate';
import { MinuteSecondsPipe } from './lib/core/pipes/minuteSeconds.pipe';
import { MESSENGER_SIDE_DETAILS_COMPONENT } from './lib/messenger/messenger';
import { FlagMessageComponent } from './messenger-libs/components/flag-message/flag-message.component';
import { MessengerProfileComponent } from './messenger-libs/components/messenger-profile/messenger-profile.component';
import { MessengerService } from './messenger-libs/core/messenger.service';
import { AccountPageComponent } from './pages/account-page/account-page.component';
import { AccountComponent } from './pages/account-page/account.component';
import { AccountVerificationComponent } from './pages/account-verification/account-verification.component';
import { CalendarHeaderComponent } from './pages/account/calendar/calendar-header/calendar-header.component';
import { CalendarLeftSideComponent } from './pages/account/calendar/calendar-left-side/calendar-left-side.component';
import { CalendarPageComponent } from './pages/account/calendar/calendar.component';
import { CalendarMoreDetailsComponent } from './pages/account/calendar/more-details/more-details.component';
import { LessonHistoryComponent } from './pages/account/lesson-history/lesson-history.component';
import { PaymentsComponent } from './pages/account/payments/payments.component';
import { ProfileLazyComponent } from './pages/account/profile/profile-lazy.component';
import { ProfileComponent } from './pages/account/profile/profile.component';
import { SettingsComponent } from './pages/account/settings/settings.component';
import { TransactionsComponent } from './pages/account/transactions/transactions.component';
import { AffiliateLessonsComponent } from './pages/affiliate/account/lessons/lessons.component';
import { AffiliateProfileMenuComponent } from './pages/affiliate/account/menu/menu.component';
import { AffiliatePaymentHistoryComponent } from './pages/affiliate/account/payment-history/payment-history.component';
import { AffiliatePaymentPreferencesComponent } from './pages/affiliate/account/payment-preferences/payment-preferences.component';
import { AffiliateProfileComponent } from './pages/affiliate/account/profile/profile.component';
import { AffiliateDashboardComponent } from './pages/affiliate/dashboard/dashboard.component';
import { AffiliateLandingPageComponent } from './pages/affiliate/landing-page/landing-page.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { DashboardPageComponent } from './pages/dashboard/page/dashboard-page.component';
import { InboxPageComponent } from './pages/inbox-page/inbox-page.component';
import { CancellationPolicyComponent } from './pages/legal/cancellation-policy/cancellation-policy.component';
import { IndependentTutorAgreementComponent } from './pages/legal/independent-tutor-agreement/independent-tutor-agreement.component';
import { LegalComponent } from './pages/legal/legal.component';
import { PrivacyPolicyComponent } from './pages/legal/privacy-policy/privacy-policy.component';
import { TermsOfUseComponent } from './pages/legal/terms-of-use/terms-of-use.component';
import { TutorPaymentPolicyComponent } from './pages/legal/tutor-payment-policy/tutor-payment-policy.component';
import { LessonsLazyComponent } from './pages/lessons/lessons.component';
import { ProfilePageComponent } from './pages/profile-page/profile-page.component';
import { PublicProfileComponent } from './pages/profile/public-profile.component';
import { ImportContactsComponent } from './pages/referrals-page/import/import-contacts.component';
import { ReferralsManagementComponent } from './pages/referrals-page/management/management.component';
import { ReferralsPageComponent } from './pages/referrals-page/referrals-page.component';
import { SearchComponent } from './pages/search/search.component';
import { PriceStringPipe } from './pipes/price-string.pipe';
import { IconRegistryService } from '@services/icons';
import { LayoutService } from '@services/layout';
import { LessonNotificationService } from '@services/lesson.notifications';
import { MessengerFrontService } from '@services/messenger';
import { Platform } from '@services/platform';
import { SearchService } from '@services/search';
import { SocialService } from '@services/social-service';
import { TimezoneService } from '@services/timezone';
import { AvailabilitySettingsComponent } from "./pages/account/profile/availability-settings/availability-settings.component";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { EmojiService } from '@services/emoji';
import { TransactionsService } from '@services/transactions.service';
import { FileLibraryComponent } from "./pages/file-library/file-library.component";
import { MatTableModule } from "@angular/material/table";
import { MatGridListModule } from "@angular/material/grid-list";
import { NgApexchartsModule } from "ng-apexcharts";
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';

const routes: Routes = [
    {
        path: '',
        component: LayoutComponent,
        children: [
            {path: 'tutors', component: SearchComponent, data: {noMenu: true }},
            {path: 'tutor/:id', component: PublicProfileComponent, canActivate: []},
            {
                path: '',
                resolve: {
                    me: UserResolver,
                    platform: Platform,
                },
                canActivate: [LoggedUserGuard],
                children: [
                    /**
                     * Referral main page, contacts import, invites management.
                     */
                    {path: 'referrals', component: ReferralsPageComponent, canActivate: [ExpectedRegularUserGuard], data: {noScroll: true}},
                    {path: 'referrals/management', component: ReferralsManagementComponent},
                    {path: 'import/:provider', component: ImportContactsComponent},
                    {
                        path: 'profile/edit', component: AccountComponent, children: [
                            /* User & affiliate profile page */
                            {path: '', component: ProfileLazyComponent, resolve: { me: UserResolver }},
                        ]
                    },
                    {path: 'inbox', loadChildren: () => import('./lib/messenger/messenger.module').then(m => m.MessengerModule), resolve: {me: UserResolver}},
                    {path: 'dashboard', pathMatch: 'full', component: DashboardComponent},
                    {path: 'profile', component: PublicProfileComponent},
                    {path: 'account', component: AccountComponent, children: [
                            {
                                path: 'calendar', canActivate: [ExpectedRegularUserGuard], children: [
                                    {path: '', component: CalendarPageComponent, resolve: {me: UserResolver}},
                                    {path: 'details/:id', component: CalendarMoreDetailsComponent, data: {mode: 'details'}},
                                    {path: 'details/:id/notes', component: CalendarMoreDetailsComponent, data: {mode: 'notes'}},
                                    {path: 'edit/:id', component: CalendarMoreDetailsComponent, data: {mode: 'edit'}},
                                    {path: 'cancel/:id', component: CalendarMoreDetailsComponent, data: {mode: 'cancel'}},
                                ]
                            },

                            {path: 'payments', component: PaymentsComponent, canActivate: [ExpectedRegularUserGuard]},
                            {path: 'transactions', component: TransactionsComponent, canActivate: [ExpectedRegularUserGuard]},
                            {path: 'settings', component: SettingsComponent, canActivate: [ExpectedRegularUserGuard]},

                            {path: 'lessons', component: LessonsLazyComponent},
                            {path: 'files', component: FileLibraryComponent, canActivate: [ExpectedRegularUserGuard]},

                            /* Affiliate routes */
                            {path: 'payment', component: AffiliatePaymentPreferencesComponent, canActivate: [ExpectedAffiliateGuard]},
                            {path: 'payment', component: AffiliatePaymentHistoryComponent, canActivate: [ExpectedAffiliateGuard]},

                            {path: '', redirectTo: 'calendar'},
                        ]},

                    {path: 'affiliate', component: AffiliateLandingPageComponent, data: {noScroll: true}},
                    {path: 'invites', component: ReferralsManagementComponent, canActivate: [ExpectedAffiliateGuard]},

                    {path: 'privacy-policy', component: LegalComponent, data: {section: 'privacy-policy'}},
                    {path: 'terms-of-use', component: LegalComponent, data: {section: 'terms-of-use'}},
                    {path: 'tutor-payment-policy', component: LegalComponent, data: {section: 'tutor-payment-policy'}},
                    {path: 'independent-tutor-agreement', component: LegalComponent, data: {section: 'independent-tutor-agreement'}},
                    {path: 'cancellation-policy', component: LegalComponent, data: {section: 'cancellation-policy'}},

                    // THIS IS TEMPORARY JUST TO BUILD CHUNKS
                    {path: '___vcr-code-mirror', loadChildren: () => import('./code-mirror/code-mirror.module').then(m => m.CodeMirrorModule)},
                    {path: '___vcr-text-mirror', loadChildren: () => import('./text-editor/text-editor.module').then(m => m.TextEditorModule)},
                    {path: '___vcr-white-board', loadChildren: () => import('./white-board/white-board.module').then(m => m.WhiteBoardModule)},
                    {path: '___vcr-screen-share', loadChildren: () => import('./screen-share/screen-share.module').then(m => m.ScreenShareModule)},
                    {path: '', redirectTo: 'dashboard'},

                ]
            },

        ],
    },
    {
        path: 'class',
        loadChildren: () => import('./class-room/class-room.module').then(m => m.ClassRoomModule),
        canActivate: [LoggedUserGuard],
    },
];

@NgModule({
    declarations: [
        LayoutComponent,
        DashboardPageComponent,
        DashboardComponent,
        InboxPageComponent,
        AccountPageComponent,
        ProfilePageComponent,
        ReferralsPageComponent,
        ReferralsManagementComponent,
        NotificationsListComponent,
        BoxComponent,
        MainMenuComponent,
        SearchComponent,
        CalendarPageComponent,
        CalendarMoreDetailsComponent,
        CalendarLeftSideComponent,
        CalendarHeaderComponent,
        PaymentsComponent,
        LessonHistoryComponent,
        LessonsLazyComponent,
        TransactionsComponent,
        SettingsComponent,
        ProfileComponent,
        FlagMessageComponent,
        ImportContactsComponent,
        AffiliateLandingPageComponent,
        AffiliateDashboardComponent,
        AffiliateProfileComponent,
        AffiliateProfileMenuComponent,
        AffiliatePaymentPreferencesComponent,
        AffiliatePaymentHistoryComponent,
        AffiliateLessonsComponent,
        AccountComponent,
        ProfileLazyComponent,
        ReferralsBoxComponent,
        CancelLessonDialogComponent,
        PublicProfileComponent,
        AccountVerificationComponent,
        PrivacyPolicyComponent,
        TermsOfUseComponent,
        TutorPaymentPolicyComponent,
        IndependentTutorAgreementComponent,
        CancellationPolicyComponent,
        LegalComponent,
        PriceStringPipe,
        AvailabilitySettingsComponent,
        FileLibraryComponent,
    ],
    entryComponents: [
        NotificationsListComponent,
        FlagMessageComponent,
        CancelLessonDialogComponent,
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        HttpClientModule,
        MatTooltipModule,
        MatNativeDateModule,
        MatDatepickerModule,
        MatExpansionModule,
        MatAutocompleteModule,
        MatGoogleMapsAutocompleteModule,
        CommonComponentsModule,
        OverlayModule,
        MatRippleModule,
        MatIconModule,
        MatSelectModule,
        MatSlideToggleModule,
        NerdlyCalendarModule,
        DialogsModule,
        MatButtonModule,
        MatMenuModule,
        RouterModule.forChild(routes),
        PipeModule.forRoot(),
        NgAddToCalendarModule,
        FlexLayoutModule,
        BookingPanelModule,
        MatCheckboxModule,
        MatTableModule,
        MatGridListModule,
        NgApexchartsModule,
        NgxDaterangepickerMd.forRoot(),
    ],
    providers: [
        UserResolver,
        TransactionsService,
        AddToCalendarService,
        NgAddToCalendarService,
        MessengerFrontService,
        MessengerService,
        LessonNotificationService,
        Platform,
        IconRegistryService,
        ExpectedAffiliateGuard,
        ExpectedRegularUserGuard,
        TruncatePipe,
        PluralizePipe,
        MinuteSecondsPipe,
        DatePipe,
        TimezoneService,
        EmojiService,
        LayoutService,
        SearchService,
        SocialService,
        {provide: OverlayContainer, useClass: FullscreenOverlayContainer},
        {provide: MESSENGER_SIDE_DETAILS_COMPONENT, useValue: MessengerProfileComponent},
        {provide: MAT_DATE_LOCALE, useValue: 'en-US'},
    ],
    exports: [
        LayoutComponent
    ],
    schemas: [
        CUSTOM_ELEMENTS_SCHEMA,
        //    NO_ERRORS_SCHEMA
    ]
})
export class AppModule {
}
