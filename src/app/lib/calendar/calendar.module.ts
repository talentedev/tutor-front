import { MatIconModule } from '@angular/material/icon';
import { CommonComponentsModule } from '../../common/common-components.module';
import { RenderingService } from './services/rendering.service';
import { DataService } from './services/data.service';
import { CalendarSlotComponent } from './components/slot/slot.component';
import { CalendarClassComponent } from './components/class/class.component';
import { CommonModule } from '@angular/common';
import { CalendarDayComponent } from './components/day/day.component';
import { CalendarComponent } from './components/calendar/calendar.component';
import { NgModule } from '@angular/core';

export * from './components/class/class.component';

@NgModule({
    declarations: [
        CalendarComponent,
        CalendarDayComponent,
        CalendarClassComponent,
        CalendarSlotComponent
    ],
    exports: [
        CalendarComponent,
        CalendarClassComponent,
        CalendarSlotComponent,
        CalendarDayComponent,
    ],
    imports: [
        CommonModule,
        CommonComponentsModule,
        MatIconModule
    ],
    providers: [
        DataService,
        RenderingService
    ]
})
export class NerdlyCalendarModule {}
