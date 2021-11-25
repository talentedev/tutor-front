import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    HostBinding,
    HostListener,
    Input,
    Output,
} from '@angular/core';

@Component({
    selector: 'learnt-rating',
    templateUrl: './rating.component.html',
    styleUrls: ['./rating.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RatingComponent {

    @Input()
    @HostBinding('attr.title')
    rating = 0;

    @Input()
    interactive = false;

    @Output()
    select: EventEmitter<number> = new EventEmitter<number>(true);

    private isHover: boolean;
    private hoverIndex: number;

    @HostListener('mouseover', ['$event'])
    onMouseOver(event: MouseEvent) {
        if (!this.interactive) {
            return;
        }
        this.isHover = true;
    }

    @HostListener('mouseout', ['$event'])
    onMouseOut(event: MouseEvent) {
        if (!this.interactive) {
            return;
        }
        this.isHover = false;
    }

    @HostListener('click', ['$event'])
    onClick() {
        if (!this.interactive) {
            return;
        }
        this.select.next(this.hoverIndex + 1);
    }

    onIndexHover(index: number) {
        if (!this.interactive) {
            return;
        }
        this.hoverIndex = index;
    }

    getEmptyFill(index: number) {
        if (this.isHover && this.hoverIndex >= index) {
            return '#000';
        }

        return '#F3F3F3';
    }

    show(index: number, step: number): boolean {
        if (this.isHover) {
            return step === 0;
        }

        if (step === 0) {
            return index >= this.rating;
        }

        if (step === 0.5 && this.rating >= index + 1) {
            return false;
        }

        return this.rating >= index + step;
    }
}
