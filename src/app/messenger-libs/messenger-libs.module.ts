import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { CommonComponentsModule } from '../common/common-components.module';
import { MessengerCreateComponent } from './components/create/create.component';
import { MessengerEmoticonsComponent } from './components/emoticons/emoticons.component';
import { MessengerMessageComponent } from './components/message/message.component';
import { MessengerHeaderComponent } from './components/message-header/msgheader.component';
import { MessagesTinyComponent } from './components/messages-tiny/messages-tiny.component';
import { MessengerMessagesComponent } from './components/messages/messages.component';
import { MessengerSettingsComponent } from './components/settings/settings.component';
import { MessengerSideComponent } from './components/side/side.component';
import { MessengerThreadsComponent } from './components/threads/threads.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

@NgModule({
    id: 'MessengerLibsModule',
    declarations: [
        MessengerSideComponent,
        MessengerThreadsComponent,
        MessengerMessagesComponent,
        MessengerMessageComponent,
        MessengerHeaderComponent,
        MessengerCreateComponent,
        MessengerEmoticonsComponent,
        MessengerSettingsComponent,
        MessagesTinyComponent,
    ],
    entryComponents: [
        MessengerThreadsComponent,
    ],
    exports: [
        MessengerHeaderComponent,
        MessengerMessagesComponent,
        MessengerCreateComponent,
        MessengerThreadsComponent,
        MessagesTinyComponent,
        MessengerSideComponent,
    ],
    imports: [
        CommonModule,
        CommonComponentsModule,
        MatButtonModule,
        MatIconModule,
        RouterModule,
        MatTooltipModule,
        MatSelectModule,
        MatInputModule
    ],
    schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
})
export class MessengerLibsModule {
}
