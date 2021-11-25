import { PopoverTooltipDirective } from '../../../../common/directives/popover-tooltip';
import { HostBinding, Component, OnInit, ViewChild, Input, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';

export type DayMode = 'vertical' | 'horizontal';

@Component({
    selector: 'learnt-calendar-day',
    templateUrl: './day.component.html',
    styleUrls: ['./day.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarDayComponent implements OnInit {

    @Input()
    mode: DayMode = 'horizontal';

    @Input()
    interval = [9, 16];

    @Input()
    day: number;

    @Input()
    @HostBinding('class.disabled')
    disabled: boolean;

    popoverSettings = {
        width: 220,
        height: 300,
        padding: '40px 30px'
    };

    @ViewChild('popoverTooltip', {read: PopoverTooltipDirective})
    popoverTooltip: PopoverTooltipDirective;

    constructor(private cd: ChangeDetectorRef) { }

    ngOnInit() {}

    hours() {
        const out = [];
        for (let i = this.interval[0]; i <= this.interval[1]; i++) {
            out.push(i);
        }
        return out;
    }

    zerofil(n: number): string {
        if (n < 10) {
            return '0' + n;
        }
        return '' + n;
    }

    onPartSelect($event) {
        // TODO: Collect selected value
        this.popoverTooltip.hide();
    }

    setDay(day: number, disabled?: boolean): void {
        this.day = day;
        this.disabled = disabled;
        this.cd.detectChanges();
    }
}
