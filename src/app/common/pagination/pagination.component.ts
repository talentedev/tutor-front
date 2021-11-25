import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
    selector: 'learnt-pagination',
    template: `
        <div class="pagination" *ngIf="pagesArray.length > 1">
            <div class="dot-wrapper">
                <div class="dot" *ngFor="let _ of pagesArray; let p = index" [class.active]="isActive(p)" (click)="next(p)"></div>
            </div>
        </div>
    `,
    styleUrls: ['./pagination.component.scss']
})
export class PaginationComponent {

    @Input()
    public set pages(p: number) {
        this.pagesArray = new Array(p);
    }

    public pagesArray: number[] = new Array(this.pages);

    public pageNum = 0;

    @Output()
    page = new EventEmitter<number>();

    public isActive(p: number): boolean {
        return this.pageNum === p;
    }

    public next(p: number): void {
        if (this.isActive(p)) {
            return;
        }
        this.pageNum = p;
        this.page.emit(p);
    }
}
