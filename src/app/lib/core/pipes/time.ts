import {Pipe, PipeTransform} from '@angular/core';
import * as moment from 'moment';

@Pipe({name: 'time'})
export class TimePipe implements PipeTransform {
    transform(value: Date, format: string): string {
        const m = moment(value);
        const now = moment();

        if (format) {
            return m.format(format);
        }

        if (m.isSame(now, 'day')) {
            return m.fromNow();
        }

        return m.format('LLL');
    }
}
