import { CommonModule } from '@angular/common';
import { ComponentFactory, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Routes } from '@angular/router';
import { CountdownModule } from 'ngx-countdown';
import { JoyrideModule } from 'ngx-joyride';
import { ClassRoomLibsModule } from '../class-room-libs/class-room-libs.module';
import { CommonComponentsModule } from '../common/common-components.module';
import { UserResolver } from '../lib/core/auth';
import { CanDeactivateGuard } from '../lib/core/guards';
import { MessengerLibsModule } from '../messenger-libs/messenger-libs.module';
import { ClassRoomMenuComponent } from './class-room-menu/class-room-menu.component';
import { ClassroomService } from './services/classroom.service';
import { ModuleLoaderService } from './services/module-loader.service';
import { VirtualClassRoomComponent } from './virtual-class-room/virtual-class-room.component';

export const CLASS_ROOM_ROUTES: Routes = [
    {
        path: ':id',
        component: VirtualClassRoomComponent,
        resolve: { me: UserResolver },
        canDeactivate: [CanDeactivateGuard],
    },
];

export interface VCRModule {
    readonly ready: EventEmitter<boolean>

    setup(vcr: VirtualClassRoomComponent): void;
}

export interface VCRNgModule {
    getVCREntryComponentFactory(): ComponentFactory<any>
}

@NgModule({
    imports: [
        CommonModule,
        CommonComponentsModule,
        RouterModule.forChild(CLASS_ROOM_ROUTES),
        MessengerLibsModule,
        ClassRoomLibsModule,
        MatIconModule,
        MatButtonModule,
        JoyrideModule.forRoot(),
        CountdownModule,
    ],
    declarations: [VirtualClassRoomComponent, ClassRoomMenuComponent],
    exports: [VirtualClassRoomComponent],
    providers: [
        ModuleLoaderService,
        ClassroomService,
        CanDeactivateGuard,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ClassRoomModule {
}
