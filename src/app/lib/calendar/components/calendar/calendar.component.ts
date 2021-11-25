import { Availability, Time, TimeRange, Class } from '../../services/models';
import { RenderingService } from '../../services/rendering.service';
import { Component, OnInit, Input, ElementRef, ViewChildren, SimpleChanges, OnChanges, AfterViewInit, QueryList } from '@angular/core';
import { CalendarDayComponent } from '../day/day.component';

@Component({
    selector: 'learnt-calendar',
    templateUrl: './calendar.component.html',
    styleUrls: ['./calendar.component.scss'],
})
export class CalendarComponent implements OnInit, AfterViewInit, OnChanges {

    @Input()
    availability: Availability[];

    @Input()
    classes: Class[];

    @ViewChildren(CalendarDayComponent)
    days: QueryList<CalendarDayComponent>;

    constructor(
        public renderer: RenderingService,
        public ref: ElementRef
    ) {}

    ngOnInit() {
        const e: HTMLElement = this.ref.nativeElement;
        const timeline = e.getElementsByClassName('timeline')[0];
        const rect = timeline.getBoundingClientRect();
        this.renderer.setDate(new Date());
        this.renderer.setTimeRange(
            new TimeRange(
                new Time(9),
                new Time(16)
            )
        );

        this.renderer.setCalendarWidth(rect.width);
    }

    ngOnChanges(changes: SimpleChanges) {
        this.renderer.setAvailability(this.availability);
        this.renderer.render();
    }

    ngAfterViewInit() {
        this.renderer.setDayViews(
            this.days
        );
        this.renderer.render();
    }
}
