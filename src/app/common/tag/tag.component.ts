import { Component, HostBinding, Input, OnInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'learnt-tag',
    templateUrl: './tag.component.html',
    styleUrls: ['./tag.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagComponent implements OnInit {

    @Input()
    icon: string;

    @Input('icon-width')
    iconWidth = 10;

    @Input('icon-height')
    iconHeight = 14;

    @HostBinding('attr.class')
    @Input('icon-position')
    iconPosition: 'left' | 'right' = 'left';

    @HostBinding('style.flex-direction')
    get positionStyle() {
        if (this.iconPosition === 'right') {
            return 'row-reverse';
        }
        return 'row';
    }

    @Input()
    label: string;

    constructor() {}

    ngOnInit() {}
}
