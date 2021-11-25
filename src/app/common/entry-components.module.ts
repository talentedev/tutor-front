import { ModalAlertComponent } from './modal-alert/modal-alert.component';
import { NewModalAlertComponent } from './new-modal-alert/new-modal-alert.component';
import { NotificationStackComponent } from './notification/stack';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { HeaderTinyComponent } from './header-tiny/header-tiny.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from "@angular/material/icon";
import { CommonComponentsModule } from "./common-components.module";

@NgModule({
  declarations: [
    HeaderTinyComponent,
    NotificationStackComponent,
    ModalAlertComponent,
    NewModalAlertComponent
  ],
  entryComponents: [
    HeaderTinyComponent,
    NotificationStackComponent,
    ModalAlertComponent,
    NewModalAlertComponent
  ],
  exports: [
    HeaderTinyComponent,
    NotificationStackComponent,
    ModalAlertComponent,
    NewModalAlertComponent
  ],
    imports: [
        CommonModule,
        RouterModule,
        MatButtonModule,
        MatIconModule,
        CommonComponentsModule
    ]
})
export class EntryComponentsModule {

}
