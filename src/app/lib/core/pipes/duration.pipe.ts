import {Pipe, PipeTransform} from '@angular/core';
import * as moment from 'moment';

@Pipe({name: 'duration'})
export class DurationPipe implements PipeTransform {
    transform(value: number, format: any = 'minutes'): string {
      return moment.duration(value, format).humanize()
    }
}
