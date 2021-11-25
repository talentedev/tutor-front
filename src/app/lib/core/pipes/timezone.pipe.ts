import { Pipe, PipeTransform } from "@angular/core";
import { format, toDate } from 'date-fns-tz';


@Pipe({
    name: 'timezone'
})
export class TimezonePipe implements PipeTransform {

    transform(timezone: string): string {
        if (!timezone) return "";
        const date = toDate(new Date(), {timeZone: timezone});
        return `${timezone} (${format(date, 'zzz', {timeZone: timezone})})`;
    }
}
