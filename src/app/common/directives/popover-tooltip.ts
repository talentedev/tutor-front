import {ApplicationRef, ChangeDetectorRef, EmbeddedViewRef, EventEmitter, OnDestroy} from '@angular/core';
import {PopoverBoxComponent, PopoverBoxSettings, PopoverDirection} from '../popover-box/popover-box.component';
import {
    Directive,
    ComponentRef,
    ElementRef,
    Input,
    Injector,
    ComponentFactoryResolver,
    OnInit,
    TemplateRef
} from '@angular/core';
import {
    Overlay,
    OverlayRef,
    OverlayConfig, ConnectedPosition
} from '@angular/cdk/overlay';
import {ComponentPortal} from '@angular/cdk/portal';

let previousPopover: PopoverTooltipDirective;

@Directive({
    selector: '[learntPopoverTooltip]'
})
export class PopoverTooltipDirective implements OnInit, OnDestroy {

    @Input()
    arrow: boolean = true;

    @Input('learntPopoverTooltip')
    popoverTemplate: TemplateRef<any>;

    @Input('learntPopoverDisabled')
    popoverDisabled: boolean

    @Input('show-event')
    showEvent = 'mouseenter';

    @Input('direction')
    direction = 'bottom';

    @Input()
    popoverSettings: PopoverBoxSettings;

    @Input('autoclose')
    autoclose = true;

    @Input('autocloseTimeout')
    autocloseTimeout = 0;

    @Input('offsetX')
    offsetX = 0;

    @Input('offsetY')
    offsetY = 0;

    @Input()
    hider: EventEmitter<boolean>;

    overlayRef: OverlayRef;
    portal: ComponentPortal<PopoverBoxComponent>;

    embedded: EmbeddedViewRef<any>;

    private active: boolean;

    constructor(private ref: ElementRef,
                private overlay: Overlay,
                public cd: ChangeDetectorRef) {
        this.show = this.show.bind(this);
        this.hide = this.hide.bind(this);
        this.onScroll = this.onScroll.bind(this);
    }

    ngOnInit(): void {
        this.ref.nativeElement.addEventListener(this.showEvent, this.show);

        const scroller = document.getElementById('search-results-scroller');
        if (scroller) {
            scroller.addEventListener('wheel', this.onScroll);
        }

        if (this.hider !== null && this.hider !== undefined) {
            this.hider.subscribe(() => this.hide(true));
        }
    }

    ngOnDestroy(): void {
        this.hide(true);
        const scroller = document.getElementById('search-results-scroller');
        if (scroller) {
            scroller.removeEventListener('wheel', this.onScroll);
        }
        if (this.showEvent === 'touchstart') {
            document.removeEventListener(this.showEvent, this.onScroll);
        }
    }

    private hideTimer(): void {
        setTimeout(this.hide, this.autocloseTimeout);
    }

    show(event: any): void {

        if (this.popoverDisabled) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (this.overlayRef) {
            return;
        }

        if (previousPopover) {
            previousPopover.hide(true);
        }

        const refRect = (<HTMLElement>this.ref.nativeElement).getBoundingClientRect();

        const position: ConnectedPosition = {
            originX: 'start', originY: 'top',
            overlayX: 'start', overlayY: 'top',
            offsetX: this.offsetX, offsetY: this.offsetY
        };

        if (this.showEvent === 'touchstart') {
            this.direction = refRect.top < 300 ? 'bottom' : 'top';
        }

        switch (this.direction) {
            case 'top':
                position.originX = 'center';
                position.originY = 'top';
                position.offsetY -= 5;
                break;
            case 'bottom':
                position.originX = 'center';
                position.originY = 'bottom';
                position.offsetY += 5;
                break;
            case 'left':
                position.originX = 'end';
                position.originY = 'center';
                break;
            case 'right':
                position.originX = 'start';
                position.originY = 'center';
                break;
        }

        const state = new OverlayConfig();
        state.positionStrategy = this.overlay.position().flexibleConnectedTo(this.ref).withPositions([position]);

        this.overlayRef = this.overlay.create(state);

        if (this.showEvent === 'mouseenter') {
            this.overlayRef.overlayElement.addEventListener('mouseenter', () => {
                this.active = true;
                this.ref.nativeElement.removeEventListener('mouseleave', this.hide);
            });

            this.overlayRef.overlayElement.addEventListener('mouseleave', () => {
                this.active = false;
                this.ref.nativeElement.addEventListener('mouseleave', this.hide);

                if (this.autocloseTimeout > 0) {
                    setTimeout(this.hide, this.autocloseTimeout);
                } else {
                    this.hide();
                }
            });
        }

        this.portal = new ComponentPortal(PopoverBoxComponent);
        const compRef: ComponentRef<PopoverBoxComponent> = this.overlayRef.attach(this.portal);

        if (this.direction) {
            compRef.instance.direction = <PopoverDirection>this.direction;
        }

        if (this.popoverSettings) {
            compRef.instance.setSettings(this.popoverSettings);
        }

        compRef.instance.arrow = this.arrow;
        compRef.instance.loading = false;
        compRef.instance.autoclose = this.autoclose;

        this.embedded = compRef.instance.setTemplate(this.popoverTemplate);

        compRef.instance.onDestroy.subscribe(() => {
            this.hide();
            this.embedded.destroy();
        });

        if (this.showEvent === 'mouseenter') {
            if (this.autoclose === true) {
                this.ref.nativeElement.addEventListener('mouseleave', this.hide);
            }

            if (this.autocloseTimeout > 0) {
                this.ref.nativeElement.removeEventListener('mouseleave', this.hide);
                this.ref.nativeElement.addEventListener('mouseleave', this.hideTimer);

                this.overlayRef.overlayElement.removeEventListener('mouseleave', this.hideTimer);
                this.overlayRef.overlayElement.addEventListener('mouseleave', this.hideTimer);
            }
        } else if (this.showEvent === 'touchstart') {
            this.active = true;
            this.ref.nativeElement.removeEventListener(this.showEvent, this.show);
            this.ref.nativeElement.addEventListener(this.showEvent, this.hide);
            document.addEventListener(this.showEvent, this.onScroll);
        }

        previousPopover = this;
    }

    onScroll(event): void {
        if (this.overlayRef && !this.overlayRef.overlayElement.getElementsByClassName('contents')[0].contains(event.target)) {
            this.hide(this.showEvent === 'touchstart');
        }
    }

    hide(force: boolean = false): void {
        if (this.overlayRef === null || this.overlayRef === undefined) {
            return;
        }

        if (this.active && !force) {
            return;
        }

        this.embedded.destroy();

        // this.overlayRef.overlayElement.removeEventListener('mouseenter', this.hideTimer);
        this.overlayRef.overlayElement.removeEventListener('mouseleave', this.hideTimer);

        this.overlayRef.dispose();
        this.overlayRef = null;

        this.ref.nativeElement.removeEventListener('mouseleave', this.hide);

        if (this.showEvent === 'touchstart') {
            this.active = false;
            this.ref.nativeElement.removeEventListener(this.showEvent, this.hide);
            this.ref.nativeElement.addEventListener(this.showEvent, this.show);
            document.removeEventListener(this.showEvent, this.onScroll);
        }
    }

    detectChanges(): void {
        if (this.embedded && !this.embedded.destroyed) {
            this.embedded.markForCheck();
            this.embedded.detectChanges();
        }
    }
}
