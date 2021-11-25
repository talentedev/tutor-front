import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'pluralize'})
export class PluralizePipe implements PipeTransform {
    transform(value: string, count: number, plural?: string): any {
        switch (count) {
            case 0:
                return '';
            case 1:
                return value;
            default:
                return plural ? plural : value + 's';
        }
    }
}
