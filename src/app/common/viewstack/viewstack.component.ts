import {
  Component,
  Input,
  Output,
  OnInit,
  HostBinding,
  ElementRef,
  ChangeDetectionStrategy,
  HostListener,
  Renderer2,
  EventEmitter
} from '@angular/core';

import * as hammerjs from 'hammerjs';

export class ViewStackChangeEvent {
    private _defaultPrevented = false;
    constructor(
      public readonly type: string,
      public readonly from: number,
      public readonly to
    ) {}
    preventDefault() { this._defaultPrevented = true; }
    get defaultPrevented() { return this._defaultPrevented; }
}

@Component({
  selector: 'learnt-viewstack, learnt-view-stack',
  template: '<ng-content select="view"></ng-content>',
  styleUrls: ['./viewstack.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewStackComponent implements OnInit {

    @Input()
    @HostBinding('style.width')
    width: string;

    @Input()
    @HostBinding('style.height')
    height: string;

    @Input()
    swipe: boolean;

    private _index = 0;

    @Output()
    public readonly change: EventEmitter<ViewStackChangeEvent> = new EventEmitter<ViewStackChangeEvent>(false);

    constructor(private ref: ElementRef, private renderer: Renderer2 ) {}

    ngOnInit() {
      new hammerjs(this.ref.nativeElement);
      this.render();
    }

    @HostListener('swipeleft', ['$event'])
    private onSwipeLeft(event: HammerInput) { // event should be TouchEvent, but Firefox doesn't know about it
      if (!this.swipe) { return; }
      event.preventDefault();
      if (this._index < this.length - 1) {
        if (this.checkIsDefaultPrevented(this._index + 1)) { return; }
        this._index++;
        this.render();
      }
    }

    @HostListener('swiperight', ['$event'])
    private onSwipeRight(event: HammerInput) { // event should be TouchEvent, but Firefox doesn't know about it
      if (!this.swipe) { return; }
      event.preventDefault();
      if (this._index  > 0) {
        if (this.checkIsDefaultPrevented(this._index - 1)) { return; }
        this._index--;
        this.render();
      }
    }

    setIndex(index: number, emit: boolean) {
      if (emit && this.checkIsDefaultPrevented(index)) { return; }
      this._index = index;
      this.render();
    }

    @Input()
    set index(index: number) {
      if (this.checkIsDefaultPrevented(index)) { return; }
      this._index = index;
      this.render();
    }

    private render() {
      const views: HTMLElement[] = this.ref.nativeElement.childNodes;
      for (let i = 0; i < views.length; i++) {
        const clazz = this._index > i ? 'left' : ( this._index < i ? 'right' : '' );
        this.renderer.setAttribute(views[i], 'class', clazz);
      }
    }

    get index() {
      return this._index;
    }

    get length() {
      return this.ref.nativeElement.childNodes.length;
    }

    private checkIsDefaultPrevented(to: number): boolean {
      const event = new ViewStackChangeEvent('change', this._index, to);
      this.change.next(event);
      return event.defaultPrevented;
    }
}
