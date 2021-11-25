import { FilesizePipe } from './filesize';
import { ByTimePipe } from './byTime';
import { TimePipe } from './time';
import { SettingPipe } from './setting';
import { DurationPipe } from './duration.pipe';
import {NgModule} from '@angular/core';
import {TruncatePipe} from './truncate';
import {PluralizePipe} from './pluralize';
import { StatesNamePipe } from "./states-name.pipe";
import { TimezonePipe } from "./timezone.pipe";
import { MinuteSecondsPipe } from "./minuteSeconds.pipe";

@NgModule({
    imports: [],
    declarations: [
        TruncatePipe,
        PluralizePipe,
        DurationPipe,
        TimePipe,
        SettingPipe,
        ByTimePipe,
        FilesizePipe,
        StatesNamePipe,
        TimezonePipe,
        MinuteSecondsPipe,
    ],
    exports: [
        TruncatePipe,
        PluralizePipe,
        DurationPipe,
        TimePipe,
        SettingPipe,
        ByTimePipe,
        FilesizePipe,
        StatesNamePipe,
        TimezonePipe,
        MinuteSecondsPipe,
    ],
})
export class PipeModule {
    static forRoot() {
        return {
            ngModule: PipeModule,
            providers: [],
        }
    }
}
