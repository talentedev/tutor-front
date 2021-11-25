import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

@Component({
    selector: 'learnt-navigation-dots',
    template: '<div class="dot" (click)="change(dot, $event)" [class.active]="dot == current" *ngFor="let dot of dots"></div>',
    styleUrls: ['./navigation-dots.component.scss']
})
export class NavigationDotsComponent implements OnInit, OnChanges {

    @Input()
    total: number;

    @Input()
    current: number;

    @Output()
    changes: EventEmitter<number> = new EventEmitter();

    dots: any[] = [1, 2, 3];

    constructor() { }

    ngOnInit() { }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.total) {
            const dots = [];
            for (let i = 0; i < this.total; i++) {
                this.dots.push(i);
            }
            this.dots = dots;
        }
    }

    change(index: number, event?: MouseEvent) {

        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }

        this.current = index;
        this.changes.next(index);
    }
}
