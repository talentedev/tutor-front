import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({ name: 'byTime' })
export class ByTimePipe implements PipeTransform {
    transform(array: Array<any>, property: string): Array<any> {
        if (!Array.isArray(array)) {
            return;
        }

        array.sort((a: any, b: any) => {
            if (!a[property] || !b[property]) {
                return 0;
            }
            if (a[property].isBefore(b[property])) {
                return -1;
            } else if (a[property].isAfter(b[property])) {
                return 1;
            } else {
                return 0;
            }
        });
        return array;
    }
}
