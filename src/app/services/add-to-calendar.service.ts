import { Injectable } from '@angular/core';
import { NgAddToCalendarService, ICalendarEvent } from '@trademe/ng-add-to-calendar';
import { SafeUrl, DomSanitizer } from '@angular/platform-browser';
import * as moment from 'moment';


@Injectable({
  providedIn: 'root'
})
export class AddToCalendarService {

  constructor(private addToCalendarService: NgAddToCalendarService,
    private sanitizer: DomSanitizer) {

  }

  public generateCalendarEvent(event: any): {googleLink: SafeUrl, icalLink: SafeUrl} {
    if (!event) {
      return;
    }

    const duration = event.duration || moment(event.end).diff(event.start, 'minutes');

    const newEvent = {
      title: event.title,
      start: new Date(event.start),
      duration: duration,
      end: new Date(event.end),
      address: event.address,
    };

    const iCalCalendarEventUrl = this.sanitizer.bypassSecurityTrustUrl(
      this.addToCalendarService.getHrefFor(this.addToCalendarService.calendarType.iCalendar, newEvent)
    );

    const googleCalendarEventUrl = this.sanitizer.bypassSecurityTrustUrl(
      this.addToCalendarService.getHrefFor(this.addToCalendarService.calendarType.google, newEvent)
    );

    return {googleLink: googleCalendarEventUrl, icalLink: iCalCalendarEventUrl}
  }


}
