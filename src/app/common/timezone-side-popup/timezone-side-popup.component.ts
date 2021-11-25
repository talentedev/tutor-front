import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    HostBinding,
    HostListener,
    OnInit,
} from '@angular/core';

import {
    trigger,
    state,
    style,
    animate,
    transition
} from '@angular/animations';
import {Timezone, TimezoneService} from '../../services/timezone';

@Component({
    selector: 'learnt-timezone-side-popup',
    templateUrl: './timezone-side-popup.component.html',
    styleUrls: ['./timezone-side-popup.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger('visibility', [
            state('visible', style({opacity: 1, transform: 'translateX(0%)'})),
            state('hidden', style({opacity: 0, transform: 'translateX(100%)'})),
            transition('* => visible', [style({opacity: 0, transform: 'translateX(100%)'}), animate('0.3s cubic-bezier(0, 0, 0, 1)')]),
            transition('visible => hidden', [style({opacity: 1, transform: 'translateX(0%)'}), animate('0.3s cubic-bezier(0, 0, 0, 1)')]),
        ]),
    ]
})
export class TimezoneSidePopupComponent implements OnInit {

    @HostBinding('@visibility')
    visibility = 'visible';

    loading = true;

    timezones = [];

    public readonly onClose: EventEmitter<any> = new EventEmitter();
    public readonly onSelect: EventEmitter<any> = new EventEmitter();

    constructor(private timezoneService: TimezoneService,
                private cd: ChangeDetectorRef) {
    }

    ngOnInit(): void {
        this.fetch();
    }

    public select(tz): void {
        this.onSelect.next(tz);
        this.close();
    }

    private fetch(): void {
        this.loading = true;

        this.timezoneService.USTimezones.subscribe((zones: Timezone[]) => {
            this.timezones = zones;
            this.loading = false;
            this.cd.detectChanges();
        })
    }

    public close(): void {
        this.visibility = 'hidden';
        this.cd.detectChanges();
    }

    @HostListener('@visibility.done', ['$event'])
    onAnimationDone(event) {
        if (event.toState === 'hidden') {
            this.onClose.next();
            this.onClose.complete();
        }
    }
}
