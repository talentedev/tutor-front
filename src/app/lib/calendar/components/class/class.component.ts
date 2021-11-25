import {
    Component,
    Input,
    Optional,
    ViewChild,
    ViewContainerRef,
    ComponentFactory,
    ComponentRef,
    ChangeDetectionStrategy,
    ElementRef,
    Inject,
    HostBinding,
    InjectionToken,
    HostListener,
    Injector,
    OnInit
} from '@angular/core';

export const AVATAR_FACTORY = new InjectionToken('AVATAR_FACTORY');
export const AVATAR_FACTORY_CONFIG_FN = new InjectionToken('AVATAR_FACTORY_CONFIG_FN');

@Component({
    selector: 'learnt-calendar-class',
    templateUrl: './class.component.html',
    styleUrls: ['./class.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarClassComponent implements OnInit {

    @Input()
    @HostBinding('style.width.px')
    width = 100;

    @ViewChild('avatar', {read: ViewContainerRef})
    avatarContainer: ViewContainerRef;

    constructor(
        @Optional() @Inject(AVATAR_FACTORY) private avatarFactory: ComponentFactory<any>,
        @Optional() @Inject(AVATAR_FACTORY_CONFIG_FN) private avatarConfig: Function,
        private injector: Injector
    ) {}

    ngOnInit() {
        if (this.avatarFactory) {

            const comp = this.avatarContainer.createComponent(
                this.avatarFactory
            );

            if (this.avatarConfig) {
                this.avatarConfig(comp);
            }
        }
    }
}
