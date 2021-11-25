import { AddCardPanelComponent } from "./add-card/add-card-panel.component";
import { BookingPanelComponent } from "./booking/booking-panel.component";
import { InstantBookingPanelComponent } from "./instant-booking/instant-booking-panel.component";
import { LoginPanelComponent } from "./login/login-panel.component";
import { LessonChangeNotificationPanelComponent } from "./notification/lesson-change-notification-panel.component";
import { RecoverPasswordPanelComponent } from "./recover-password/recover-password-panel.component";
import { ReschedulePanelComponent } from "./reschedule/reschedule-panel.component";
import { SignUpPanelComponent } from "./sign-up/sign-up-panel.component";

export type PanelNavigation = 
'login' | 
'booking' | 
'recover_password' | 
'signup' | 
'lesson_change_notification' | 
'reschedule' | 
'add_card' | 
'instant_booking';


export const PANELS_MAP: {[key in PanelNavigation]: any} = {
    'login': LoginPanelComponent,
    'booking': BookingPanelComponent,
    'recover_password': RecoverPasswordPanelComponent,
    'signup': SignUpPanelComponent,
    'lesson_change_notification': LessonChangeNotificationPanelComponent,
    'reschedule': ReschedulePanelComponent,
    'add_card': AddCardPanelComponent,
    'instant_booking': InstantBookingPanelComponent,
};
