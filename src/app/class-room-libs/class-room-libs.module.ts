import { FlexLayoutModule } from '@angular/flex-layout';
import { VideoAdminComponent } from './components/video-admin/video-admin.component';
import { VideoButtonComponent } from './components/video-toggle-button/video-toggle-button.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ClassRoomVideoComponent } from './components/class-room-video/class-room-video.component';

const EXPORTS = [
    ClassRoomVideoComponent,
    VideoButtonComponent,
    VideoAdminComponent,
];

@NgModule({
    imports: [
        CommonModule,
        MatIconModule,
        FlexLayoutModule,
    ],
    declarations: [
        ...EXPORTS,
    ],
    exports: EXPORTS,
    providers: []
})
export class ClassRoomLibsModule {
}
