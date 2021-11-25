import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { AdminFooterLinksComponent } from 'app/admin/admin-footer-links/admin-footer-links.component';
import { CommonComponentsModule } from '../common/common-components.module';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { AdminOnlineComponent } from './admin-online/admin-online.component';
import { AdminPagesComponent } from './admin-pages/admin-pages.component';
import { AdminMetricsComponent } from './admin-metrics/admin-metrics.component';
import { AdminPostsComponent } from './admin-posts/admin-posts.component';
import { AdminReviewsComponent } from './admin-reviews/admin-reviews.component';
import { AdminSettingsComponent } from './admin-settings/admin-settings.component';
import { AdminTutorsPendingDetailsComponent } from './admin-tutors-pending-details/admin-tutors-pending-details.component';
import { AdminTutorsPendingComponent } from './admin-tutors-pending/admin-tutors-pending.component';
import { AdminTutorsVerificationDetailsComponent } from './admin-tutors-verification-details/admin-tutors-verification-details.component';
import { AdminTutorsVerificationComponent } from './admin-tutors-verification/admin-tutors-verification.component';
import { AdminTutorsComponent } from './admin-tutors/admin-tutors.component';
import { AdminLayoutComponent } from './layout/layout';
import { PipeModule } from 'app/lib/core/pipes/pipe.module';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { AdminStudentsComponent } from './admin-students/admin-students.component';
import { StudentProfileComponent } from './admin-students/student-profile/student-profile.component';
import { MatTableModule } from "@angular/material/table";
import { MatPaginatorModule } from "@angular/material/paginator";
import { StudentSearchComponent } from './admin-students/student-search/student-search.component';
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatCardModule } from "@angular/material/card";
import { AdminStudentsService } from "./services/admin-students.service";
import { AdminTransactionsComponent } from "./admin-transactions/admin-transactions.component";
import { AdminTransactionsService } from "./services/admin-transactions.service";
import { AdminCreditService } from "./services/admin-credit.service";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatSelectModule } from "@angular/material/select";
import { AdminUserService } from "./services/admin-user.service";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { AdminSessionsComponent } from "./admin-sessions/admin-sessions.component";
import { AdminGuard } from "../lib/core/guards";
import { TutorSearchComponent } from "./admin-tutors/tutor-search/tutor-search.component";
import { AdminTutorsService } from "./services/admin-tutors.service";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { TutorProfileComponent } from "./admin-tutors/tutor-profile/tutor-profile.component";
import { TutorPendingComponent } from "./admin-tutors/tutor-pending/tutor-pending.component";
import { MatTabsModule } from "@angular/material/tabs";
import { MatBadgeModule } from "@angular/material/badge";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatDividerModule } from "@angular/material/divider";
import { AdminSubjectsComponent } from './admin-subjects/admin-subjects.component';
import { AdminTutoringSessionsComponent } from './admin-tutoring-sessions/admin-tutoring-sessions.component';
import { NgApexchartsModule } from "ng-apexcharts";
import { MatRadioModule } from '@angular/material/radio';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { CreditsGrantComponent } from './admin-credits/credits-grant/credits-grant.component';
import { CreditsSummaryComponent } from './admin-credits/credits-summary/credits-summary.component';

export const ADMIN_ROUTES: Routes = [
    {
        path: '',
        component: AdminLayoutComponent,
        canActivate: [AdminGuard],
        children: [
            { path: '', component: AdminDashboardComponent },
            {
                path: 'tutors',
                children: [
                    { path: '', component: AdminTutorsComponent },
                    { path: ':tutor', component: TutorProfileComponent },
                    { path: 'pending/:tutor', component: TutorPendingComponent },
                ]
            },
            { path: 'tutoring-sessions', component: AdminTutoringSessionsComponent },
            { path: 'settings', component: AdminSettingsComponent },
            { path: 'footer-links', component: AdminFooterLinksComponent },
            { path: 'pages', component: AdminPagesComponent },
            { path: 'posts', component: AdminPostsComponent },
            { path: 'reviews', component: AdminReviewsComponent },
            { path: 'online', component: AdminOnlineComponent },
            { path: 'students', children: [
                    { path: '', component: AdminStudentsComponent },
                    { path: ':id', component: StudentProfileComponent },
              ]
            },
            { path: 'subjects', component: AdminSubjectsComponent },
            { path: 'metrics', component: AdminMetricsComponent },
            { path: 'credits-summary', component: CreditsSummaryComponent },
            { path: '**', redirectTo: '' },
        ]
    },
];


@NgModule({
    declarations: [
        AdminLayoutComponent,
        AdminTutorsComponent,
        AdminSettingsComponent,
        AdminPagesComponent,
        AdminPostsComponent,
        AdminReviewsComponent,
        AdminDashboardComponent,
        AdminFooterLinksComponent,
        AdminTutorsVerificationComponent,
        AdminTutorsPendingComponent,
        AdminTutorsVerificationDetailsComponent,
        AdminTutorsPendingDetailsComponent,
        AdminOnlineComponent,
        AdminStudentsComponent,
        StudentProfileComponent,
        StudentSearchComponent,
        AdminTransactionsComponent,
        AdminSessionsComponent,
        TutorSearchComponent,
        TutorProfileComponent,
        TutorPendingComponent,
        AdminSubjectsComponent,
        AdminTutoringSessionsComponent,
        AdminMetricsComponent,
        CreditsGrantComponent,
        CreditsSummaryComponent
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        DragDropModule,
        CommonComponentsModule,
        MatButtonModule,
        MatExpansionModule,
        PipeModule,
        MatIconModule,
        MatChipsModule,
        MatInputModule,
        MatAutocompleteModule,
        RouterModule.forChild(ADMIN_ROUTES),
        MatTableModule,
        MatPaginatorModule,
        MatTooltipModule,
        MatCardModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatButtonToggleModule,
        MatSelectModule,
        MatCheckboxModule,
        MatSlideToggleModule,
        MatTabsModule,
        MatBadgeModule,
        MatGridListModule,
        MatDividerModule,
        NgApexchartsModule,
        MatRadioModule,
        NgxDaterangepickerMd.forRoot(),
    ],
    providers: [
        AdminStudentsService,
        AdminTutorsService,
        AdminTransactionsService,
        AdminCreditService,
        AdminUserService,
        AdminGuard,
    ],
    schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
})
export class AdminModule {}
