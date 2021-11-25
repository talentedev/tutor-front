import { AgmCoreModule } from '@agm/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA, ApplicationRef, DoBootstrap } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ApplyPageComponent } from 'app/pages/apply-page/apply-page.component';
import { CommonComponentsModule } from './common/common-components.module';
import { EntryComponentsModule } from './common/entry-components.module';
import { PipeModule } from './lib/core/pipes/pipe.module';
import { Platform } from './services/platform';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { EmailAsyncValidator } from "./services/email-async-validator.service";
import { Backend } from "./lib/core/auth";
import {FlexLayoutModule} from "@angular/flex-layout";
import {MatChipsModule} from "@angular/material/chips";
import {MatButtonToggleModule} from "@angular/material/button-toggle";

@NgModule({
  declarations: [
    ApplyPageComponent,
  ],
    imports: [
        CommonModule,
        OverlayModule,
        PipeModule,
        EntryComponentsModule,
        CommonComponentsModule,
        MatIconModule,
        // Forms
        FormsModule,
        ReactiveFormsModule,
        MatInputModule,
        MatSelectModule,
        MatFormFieldModule,
        MatButtonModule,
        AgmCoreModule.forRoot({
            apiKey: 'AIzaSyA3c50qvfZ98V8kGNWwwm1My42SitWfYT8',
            libraries: ['places']
        }),
        RouterModule.forChild([
            {path: '', component: ApplyPageComponent, data: {noMenu: true}}
        ]),
        // Material
        MatMenuModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatAutocompleteModule,
        FlexLayoutModule,
        MatChipsModule,
        MatButtonToggleModule,
    ],

  providers: [
    Platform,
    { provide: MAT_DATE_LOCALE, useValue: 'en-US'},
    EmailAsyncValidator,
    Backend,
  ],

  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class ApplyModule implements DoBootstrap {
  constructor(private router: Router) { }
  ngDoBootstrap(appRef: ApplicationRef) {
    console.log(this.router);
  }
}
