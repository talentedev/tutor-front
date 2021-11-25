import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AgmCoreModule } from '@agm/core';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PipeModule } from '../lib/core/pipes/pipe.module';
import { MessengerProfileComponent } from '../messenger-libs/components/messenger-profile/messenger-profile.component';
import { AccountBoxComponent } from './account-box/account-box.component';
import { AddCardComponent } from './add-card/add-card.component';
import { AutocompleteInputComponent } from './autocomplete-input/autocomplete-input.component';
import { BookingCalendarComponent } from './booking-calendar/booking-calendar.component';
import { AddCardPanelComponent } from './booking-panels/add-card/add-card-panel.component';
import { BookingPanelComponent } from './booking-panels/booking/booking-panel.component';
import { InstantBookingPanelComponent } from './booking-panels/instant-booking/instant-booking-panel.component';
import { LoginPanelComponent } from './booking-panels/login/login-panel.component';
import { LessonChangeNotificationPanelComponent } from './booking-panels/notification/lesson-change-notification-panel.component';
import { RecoverPasswordPanelComponent } from './booking-panels/recover-password/recover-password-panel.component';
import { ReschedulePanelComponent } from './booking-panels/reschedule/reschedule-panel.component';
import { SignUpPanelComponent } from './booking-panels/sign-up/sign-up-panel.component';
import { BookingComponent } from './booking/booking.component';
import { CheckboxComponent } from './checkbox/checkbox.component';
import { ContextMenuComponent, ContextMenuDirective } from './context-menu/context-menu.component';
import { CreditCardIconMatcherComponent } from './credit-card-icon-matcher/credit-card-icon-matcher.component';
import { PopoverTooltipDirective } from './directives/popover-tooltip';
import { FooterComponent } from './footer/footer.component';
import { GeneralAvailabilityComponent } from './general-availability/general-availability.component';
import { HeaderInboxComponent } from './header-inbox/header-inbox.component';
import { HeaderNotificationsComponent } from './header-notifications/header-notifications.component';
import { HeaderComponent } from './header/header.component';
import { LessonListingComponent } from './lesson-listing/lesson-listing.component';
import { MapComponent } from './map/map.component';
import { NavigationDotsComponent } from './navigation-dots/navigation-dots.component';
import { OverlayLoadingComponent } from './overlay-loading/overlay-loading.component';
import { PaginationComponent } from './pagination/pagination.component';
import { PopoverBoxComponent } from './popover-box/popover-box.component';
import { PriceIntervalComponent } from './price-interval/price-interval.component';
import { RatingComponent } from './rating/rating.component';
import { SearchFiltersComponent } from './search-filters/search-filters.component';
import { SearchResultTutorComponent } from './search-result-tutor/search-result.component';
import { SearchResultComponent } from './search-result/search-result.component';
import { SearchResultsBookSummaryComponent } from './search-results-book-summary/search-results-book-summary.component';
import { SearchResultsBookComponent } from './search-results-book/search-results-book.component';
import { SearchResultsCreditCardComponent } from './search-results-credit-card/search-results-credit-card.component';
import { SearchResultsLoginComponent } from './search-results-login/search-results-login.component';
import { SearchResultsProfileDetailsComponent } from './search-results-profile-details/search-results-profile-details.component';
import { SearchResultsRecoverPasswordComponent } from './search-results-recover-password/search-results-recover-password.component';
import { SearchResultsRegisterComponent } from './search-results-register/search-results-register.component';
import { SearchResultsComponent } from './search-results/search-results.component';
import { SocialLoginComponent } from './social-login/social-login.component';
import { SpecificAvailabilityComponent } from './specific-availability/specific-availability.component';
import { SpinnerComponent } from './spinner/spinner.component';
import { SSNInputComponent } from './ssninput/ssninput.component';
import { TagComponent } from './tag/tag.component';
import { TimeIntervalComponent } from './time-interval/time-interval.component';
import { TimezoneSidePopupComponent } from './timezone-side-popup/timezone-side-popup.component';
import { ToggleButtonComponent } from './toggle-button/toggle-button.component';
import { TutorRateComponent, TutorRateDialog } from './tutor-rate/tutor-rate.component';
import { VerifiedComponent } from './verified/verified.component'
import { UploadButtonComponent } from './upload-button/upload-button.component';
import { UserAvatarComponent } from './user-avatar/user-avatar.component';
import { VideoRecordingComponent } from './video-recording/video-recording.component';
import { ViewStackComponent } from './viewstack/viewstack.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatGridListModule } from '@angular/material/grid-list';
import { IconRegistryService } from "../services/icons";
import { UserNotesComponent } from "./user-notes/user-notes.component";
import { FacebookComponent } from './social-login-facebook/social-login-facebook.component';
import { TooltipDirective } from "./tooltip/tooltip.directive";
import { TooltipComponent } from "./tooltip/tooltip.component";
import { ButtonDirective } from "./button/button.directive";
import { MenuComponent } from './menu/menu.component';
import { PopupMenuComponent } from './popup-menu/popup-menu.component';
import { InputDirective } from "./directives/input.directive";
import { SocialButtonComponent } from './social-button/social-button.component';
import { FlexLayoutModule } from "@angular/flex-layout";
import {MatAutocompleteModule} from "@angular/material/autocomplete";
import { ButtonSelectComponent } from './button-select/button-select.component';
import { ButtonOptionComponent } from './button-option/button-option.component';
import { FormFieldComponent } from './form-field/form-field.component';
import { ErrorComponent } from './error/error.component';
import { NgxMaskModule, IConfig } from 'ngx-mask';

@NgModule({
    declarations: [
        UserAvatarComponent,
        ViewStackComponent,
        SpinnerComponent,
        PopoverBoxComponent,
        HeaderComponent,
        OverlayLoadingComponent,
        SearchFiltersComponent,
        MapComponent,
        TimezoneSidePopupComponent,
        CheckboxComponent,
        PriceIntervalComponent,
        ToggleButtonComponent,
        ContextMenuDirective,
        ContextMenuComponent,
        GeneralAvailabilityComponent,
        SpecificAvailabilityComponent,
        HeaderNotificationsComponent,
        HeaderInboxComponent,
        PopoverTooltipDirective,
        UploadButtonComponent,
        RatingComponent,
        TutorRateComponent,
        VerifiedComponent,
        AutocompleteInputComponent,
        VideoRecordingComponent,
        AccountBoxComponent,
        SocialLoginComponent,
        CreditCardIconMatcherComponent,
        TagComponent,
        MessengerProfileComponent,
        LessonListingComponent,
        NavigationDotsComponent,
        AddCardComponent,
        FooterComponent,
        UserNotesComponent,
        FacebookComponent,
        ButtonDirective,

        // Right side panels
        LoginPanelComponent,
        RecoverPasswordPanelComponent,
        SignUpPanelComponent,
        AddCardPanelComponent,
        BookingPanelComponent,
        InstantBookingPanelComponent,
        ReschedulePanelComponent,
        LessonChangeNotificationPanelComponent,

        // ----------------------
        // --- SEARCH RESULTS ---
        // ----------------------

        // Overall search results ( ROOT )
        SearchResultsComponent,

        // A tutor box from search results
        SearchResultComponent,
        SearchResultTutorComponent,

        // Expand Views
        SearchResultsProfileDetailsComponent,
        SearchResultsLoginComponent,
        SearchResultsCreditCardComponent,
        SearchResultsBookComponent,
        SearchResultsBookSummaryComponent,
        SearchResultsRecoverPasswordComponent,
        SearchResultsRegisterComponent,
        TimeIntervalComponent,

        PaginationComponent,
        BookingComponent,
        SSNInputComponent,

        BookingCalendarComponent,
        TooltipDirective,
        TooltipComponent,
        InputDirective,
        MenuComponent,
        PopupMenuComponent,
        SocialButtonComponent,
        ButtonSelectComponent,
        ButtonOptionComponent,
        FormFieldComponent,
        ErrorComponent,
    ],
    exports: [
        UserAvatarComponent,
        ViewStackComponent,
        SpinnerComponent,
        PopoverBoxComponent,
        HeaderComponent,
        OverlayLoadingComponent,
        SearchFiltersComponent,
        MapComponent,
        TimezoneSidePopupComponent,
        CheckboxComponent,
        PriceIntervalComponent,
        ToggleButtonComponent,
        ContextMenuDirective,
        ContextMenuComponent,
        GeneralAvailabilityComponent,
        SpecificAvailabilityComponent,
        HeaderNotificationsComponent,
        HeaderInboxComponent,
        PopoverTooltipDirective,
        UploadButtonComponent,
        RatingComponent,
        TutorRateComponent,
        VerifiedComponent,
        AutocompleteInputComponent,
        VideoRecordingComponent,
        AccountBoxComponent,
        SocialLoginComponent,
        CreditCardIconMatcherComponent,
        TagComponent,
        MessengerProfileComponent,
        LessonListingComponent,
        NavigationDotsComponent,
        AddCardComponent,
        FooterComponent,
        UserNotesComponent,
        ButtonDirective,

        // Right side panels
        LoginPanelComponent,
        RecoverPasswordPanelComponent,
        SignUpPanelComponent,
        AddCardPanelComponent,
        BookingPanelComponent,
        InstantBookingPanelComponent,
        ReschedulePanelComponent,
        LessonChangeNotificationPanelComponent,

        // ----------------------
        // --- SEARCH RESULTS ---
        // ----------------------

        // Overall search results ( ROOT )
        SearchResultsComponent,

        // A tutor box from search results
        SearchResultComponent,
        SearchResultTutorComponent,

        // Expand Views
        SearchResultsProfileDetailsComponent,
        SearchResultsLoginComponent,
        SearchResultsCreditCardComponent,
        SearchResultsBookComponent,
        SearchResultsBookSummaryComponent,
        SearchResultsRecoverPasswordComponent,
        SearchResultsRegisterComponent,
        TimeIntervalComponent,

        PaginationComponent,
        BookingComponent,
        SSNInputComponent,

        BookingCalendarComponent,
        TooltipDirective,
        TooltipComponent,
        MenuComponent,
        InputDirective,
        SocialButtonComponent,
        ButtonSelectComponent,
        ButtonOptionComponent,
        FormFieldComponent,
        ErrorComponent,
    ],
    entryComponents: [
        PopoverBoxComponent,
        OverlayLoadingComponent,
        TimezoneSidePopupComponent,
        UserAvatarComponent,
        TutorRateComponent,
        VerifiedComponent,
        SearchResultTutorComponent,
        SearchResultsProfileDetailsComponent,
        SearchResultsLoginComponent,
        SearchResultsCreditCardComponent,
        SearchResultsBookComponent,
        SearchResultsBookSummaryComponent,
        SearchResultsRecoverPasswordComponent,
        MessengerProfileComponent,
        SearchResultsRegisterComponent,

        LoginPanelComponent,
        RecoverPasswordPanelComponent,
        SignUpPanelComponent,
        AddCardPanelComponent,
        BookingPanelComponent,
        InstantBookingPanelComponent,
        ReschedulePanelComponent,

        LessonChangeNotificationPanelComponent,
    ],
    imports: [
        AgmCoreModule.forRoot({
            apiKey: 'AIzaSyA3c50qvfZ98V8kGNWwwm1My42SitWfYT8',
            libraries: ['places']
        }),
        CommonModule,
        RouterModule,
        MatTooltipModule,
        MatRippleModule,
        MatSelectModule,
        MatInputModule,
        MatSlideToggleModule,
        FormsModule,
        MatDialogModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatGridListModule,
        PipeModule.forRoot(),
        FlexLayoutModule,
        MatAutocompleteModule,
        NgxMaskModule.forRoot(),
    ],
    providers: [
        TutorRateDialog,
        IconRegistryService,
    ],
    schemas: [
        NO_ERRORS_SCHEMA,
        CUSTOM_ELEMENTS_SCHEMA
    ]
})
export class CommonComponentsModule {
}
