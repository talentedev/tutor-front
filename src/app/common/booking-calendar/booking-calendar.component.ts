import { BookingSlot, TimeEntry } from 'app/pages/account/calendar/interfaces';
import { Component, OnInit, Input, OnChanges, SimpleChanges, EventEmitter, Output, ViewChildren, QueryList, ElementRef, ChangeDetectionStrategy, HostListener } from '@angular/core';
import * as moment from 'moment-timezone';
import { Availability, MomentRange } from 'app/models';
import { Lesson } from 'app/models/lesson';
import { start } from "repl";

@Component({
  selector: 'learnt-booking-calendar',
  templateUrl: './booking-calendar.component.html',
  styleUrls: ['./booking-calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingCalendarComponent implements OnInit, OnChanges {

  @Input()
  public date: moment.Moment;

  @Input() full: boolean;  // all hours shown

  @Input() public availability: Availability;

  @Input() userLessons: Lesson[];

  @Output() public change: EventEmitter<MomentRange> = new EventEmitter();

  @ViewChildren('hour')
  public hourElements: QueryList<ElementRef>;

  public slots: BookingSlot[] = [];

  private dragging = false;

  private selection: { from: number, to: number } = { from: -1, to: -1 };

  private value: MomentRange;

  constructor() {
  }

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.date) {
      this.createBookingSlots();
      this.change.next(null);
    }
  }

  public createBookingSlots() {
    const startDate = this.date.clone().startOf('day');
    const slots: BookingSlot[] = [new BookingSlot(startDate, startDate.clone().add(1, 'hour'))];
    for (let i = 1; i <= 23; i++) {
      const from = startDate.clone().add(i, 'hour');
      slots.push(new BookingSlot(from, from.clone().add(1, 'h')))
    }
    this.slots = slots;
  }

  render() {
    const from = Math.min(this.selection.from, this.selection.to);
    const to = Math.max(this.selection.from, this.selection.to);

    let fromElement: Element;
    let toElement: Element;

    this.hourElements.map((e, i) => {

      const elem = e.nativeElement;

      elem.classList.remove('start', 'end', 'middle');

      if (i > from && i < to) {
        elem.classList.add('middle');
      }

      if (i === from) {
        elem.classList.add('start');
        fromElement = elem;
      }

      if (i === to) {
        elem.classList.add('end');
        toElement = elem;
      }
    })

    const fromSlot: BookingSlot = this.slots[fromElement.getAttribute('data-slot-index')]
    const toSlot: BookingSlot = this.slots[toElement.getAttribute('data-slot-index')]

    this.value = new MomentRange(
      fromSlot[fromElement.getAttribute('data-slot-part')]().from,
      toSlot[toElement.getAttribute('data-slot-part')]().to,
    )
  }

  public isSlotHidden(slot: BookingSlot): boolean {
    const hours = slot.from.hours()
    return !this.full && (hours < 8 || hours > 19);
  }

  public hourIsLighter(i: number): boolean {
    switch (this.full) {
      case true:
        return i < 8 || i > 15
      case false:
        return i < 12 || i > 15
      default:
        return false;
    }
  }

  private getIndexFromEvent(event: MouseEvent | TouchEvent): number {

    let index = -1;

    let element: Element = event.target as Element
    if (window.TouchEvent && event instanceof TouchEvent) {
      element = document.elementFromPoint(
        event.changedTouches[0].clientX,
        event.changedTouches[0].clientY
      )
    }

    this.hourElements.map((e, i) => {
      if (e.nativeElement === element) {
        index = i
        return true
      }
    });

    return index;
  }

  public mouseDown(event: MouseEvent | TouchEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.selection.from = this.selection.to = this.getIndexFromEvent(event)
    this.dragging = true;
    this.render()
    this.change.next(null);
  }

  public mouseUp(event: MouseEvent | TouchEvent): void {

    event.preventDefault();
    event.stopPropagation();

    if (this.selection.from === -1) {
      return
    }

    const index = this.getIndexFromEvent(event);

    if (index !== -1) {
      this.selection.to = index;
      this.render()
      this.change.next(this.value);
    }

    this.dragging = false;
  }


  public mouseEnter(event: MouseEvent | TouchEvent): void {

    event.preventDefault();
    event.stopPropagation();

    if (!this.dragging) {
      return;
    }

    const index = this.getIndexFromEvent(event);

    if (index !== -1) {
      this.selection.to = index;
      this.render()
    }
  }

  @HostListener('window:mouseup', ['$event'])
  @HostListener('document:touchend', ['$event'])
  onDocumentMouseUp(event: MouseEvent | TouchEvent) {
    this.dragging = false;
  }

}
