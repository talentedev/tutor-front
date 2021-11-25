import {
    Component,
    ElementRef,
    EmbeddedViewRef,
    EventEmitter,
    HostBinding,
    HostListener,
    Input,
    OnInit,
    Renderer2,
    TemplateRef,
    ViewChild,
} from '@angular/core';

import {
    trigger,
    state,
    style,
    animate,
    transition
} from '@angular/animations';

export type PopoverDirection = 'top' | 'bottom' | 'left' | 'right';

export interface PopoverBoxSettings {
    width?: number;
    height?: number;
    padding?: number;
    class?: string;
}

@Component({
    selector: 'learnt-popover-box',
    templateUrl: './popover-box.component.html',
    styleUrls: ['./popover-box.component.scss'],
    animations: [
        trigger('visibility', [

            // direction top
            state('visible-top', style({opacity: 1})),
            state('hidden-top', style({opacity: 0})),

            transition('void => visible-top', [
                style({opacity: 0}),
                animate('0.15s ease-out')
            ]),
            transition('visible-top => hidden-top', [
                style({opacity: 1}),
                animate('0.15s ease-in')
            ]),


            // direction bottom
            state('visible-bottom', style({opacity: 1})),
            state('hidden-bottom', style({opacity: 0})),

            transition('* => visible-bottom', [
                style({opacity: 0}),
                animate('0.15s ease-out')
            ]),
            transition('visible-bottom => hidden-bottom', [
                style({opacity: 1}),
                animate('0.15s ease-in')
            ]),

            // direction right
            state('visible-right', style({opacity: 1})),
            state('hidden-right', style({opacity: 0})),

            transition('* => visible-right', [
                style({opacity: 0}),
                animate('0.15s ease-out')
            ]),
            transition('visible-right => hidden-bottom', [
                style({opacity: 1}),
                animate('0.15s ease-in')
            ]),

            // direction left
            state('visible-left', style({opacity: 1})),
            state('hidden-left', style({opacity: 0})),

            transition('* => visible-left', [
                style({opacity: 0}),
                animate('0.15s ease-out')
            ]),
            transition('visible-left => hidden-bottom', [
                style({opacity: 1}),
                animate('0.15s ease-in')
            ]),
        ])
    ]
})
export class PopoverBoxComponent implements OnInit {

    @Input()
    arrow = true;

    @Input()
    direction: PopoverDirection = 'top';

    @Input()
    loading = true;

    @Input()
    @HostBinding('class')
    settings: PopoverBoxSettings;

    @Input()
    @HostBinding('style.width.px')
    width = 400;

    @Input()
    @HostBinding('style.height.px')
    height: number;

    @Input()
    @HostBinding('style.left')
    left = '';

    @Input()
    @HostBinding('style.top')
    top = '';

    @Input()
    @HostBinding('style.margin')
    margin = '';

    @Input()
    data: any;

    @Input()
    @HostBinding('style.padding.px')
    padding = 0;

    @HostBinding('@visibility')
    visibility;

    @HostBinding('class.learnt-popover-box')
    className = true;

    @ViewChild('content', { static: true })
    content: ElementRef;

    @ViewChild('container')
    container: ElementRef;

    public autoclose = true;

    public readonly onDestroy: EventEmitter<any> = new EventEmitter<any>(true);

    constructor(private ref: ElementRef,
                private renderer: Renderer2) {
    }

    ngOnInit() {
        this.visibility = 'visible-' + this.direction;
        this.renderer.addClass(this.ref.nativeElement, this.direction);

        if (this.settings !== undefined && this.settings !== null) {
            this.setSettings(this.settings);
        }
    }

    setSettings(settings: PopoverBoxSettings) {
        if (settings === undefined || settings === null) {
            return;
        }

        if (settings.class !== undefined && settings.class !== '') {
            this.renderer.addClass(this.ref.nativeElement, settings.class);
        }

        if (settings.width !== undefined) {
            this.width = settings.width;

            switch (this.direction) {
                case 'right':
                    this.left = -this.width + 'px';
                    break;
                case 'left':
                case 'bottom':
                    break;
            }
        }

        if (settings.height !== undefined) {
            this.height = settings.height;

            switch (this.direction) {
                case 'right':
                    this.top = -(this.height / 2) + 'px';
                    break;
                case 'left':
                    this.top = -(this.height / 2) + 'px';
                    break;
                case 'bottom':
                    break;
            }
        }

        if (settings.padding !== undefined) {
            this.padding = settings.padding;
        }
    }

    @HostListener('document:mousedown', ['$event'])
    onDocumentClick(event: MouseEvent) {
        if (!this.autoclose) {
            return;
        }
        const e: HTMLElement = this.ref.nativeElement;
        if (!e.contains(<Node>event.target) && this.visibility && this.visibility.indexOf('visible') === 0) {
            this.destroy();
        }
    }

    @HostListener('@visibility.done', ['$event'])
    onHideComplete(event) {
        if (event.toState.indexOf('hidden') === 0) {
            const e: HTMLElement = this.ref.nativeElement;
            if (!e || !e.parentNode) {
                return;
            }
            e.parentNode.removeChild(e);
            this.onDestroy.next();
            this.onDestroy.complete();
        }
    }

    public setContent(element: ElementRef): void {
        this.content.nativeElement.parentNode.replaceChild(element.nativeElement, this.content.nativeElement);
        this.content = element;
    }

    public setTemplate(template: TemplateRef<any>): EmbeddedViewRef<any> {
        const ctx: any = this.data ? {$implicit: this.data} : {};
        const embedded = template.createEmbeddedView(ctx);

        embedded.rootNodes.map(n => this.content.nativeElement.appendChild(n));

        if (!embedded.destroyed) {
            embedded.detectChanges();
        }

        return embedded;
    }

    public destroy(): void {
        this.visibility = 'hidden-' + this.direction;
    }
}
