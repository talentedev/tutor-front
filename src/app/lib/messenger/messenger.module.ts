import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonComponentsModule } from '../../common/common-components.module';
import { MessengerLibsModule } from '../../messenger-libs/messenger-libs.module';
import { MessengerComponent } from './messenger.component';

export const MESSENGER_ROUTES: Routes = [
    {path: '', component: MessengerComponent},
    {path: ':thread', component: MessengerComponent},
];

@NgModule({
    id: 'MessengerModule',
    declarations: [
        MessengerComponent,
    ],
    imports: [
        CommonModule,
        CommonComponentsModule,
        MessengerLibsModule,
        RouterModule.forChild(MESSENGER_ROUTES)
    ],
    schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
})
export class MessengerModule {
}
