import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'truncate'})
export class TruncatePipe implements PipeTransform {
    transform(value: string, limit: number, completeWords: boolean = false, ending: string = '...'): string {
        if (value === undefined || value === null) {
            return '';
        }

        if (completeWords === true && value.length > limit) {
            limit = value.substr(0, limit).lastIndexOf(' ');
        }

        if (value.length <= limit) {
            ending = '';
        }

        return `${value.substr(0, limit)}${ending}`;
    }
}
