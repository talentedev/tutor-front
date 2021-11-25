import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    HostBinding,
    HostListener,
    Input,
    Output,
    ViewChild
} from '@angular/core';

let ActiveDropdown: WhiteboardToolbarButtonComponent;

@Component({
    selector: 'learnt-whiteboard-toolbar-button',
    templateUrl: './whiteboard-toolbar-button.component.html',
    styleUrls: ['./whiteboard-toolbar-button.component.scss'],
})
export class WhiteboardToolbarButtonComponent implements AfterViewInit {

    @Input()
    icon: string;

    @Input()
    @HostBinding('class.active')
    active: boolean;

    @Input()
    @HostBinding('class.disabled')
    disabled: boolean;

    @Input()
    color = 'learnt-white';

    @ViewChild('submenu')
    submenuElement: ElementRef;

    @HostBinding('class.more')
    hasSubmenu = false;

    @HostBinding('class.expanded')
    expanded = false;

    @Output()
    action: EventEmitter<any> = new EventEmitter(true);

    constructor(private ref: ElementRef,
                private cdref: ChangeDetectorRef) {
        this.onMouseClickOutside = this.onMouseClickOutside.bind(this);
    }

    ngAfterViewInit() {
        if (this.submenuElement && this.submenuElement.nativeElement) {
            setTimeout(() => {
                this.hasSubmenu = this.submenuElement.nativeElement.childNodes.length > 0;
            }, 0);
        }
    }

    collapse() {
        this.expanded = false;
    }

    canCloseActiveExpanded(event: MouseEvent) {
        return true;
    }

    canAutoClose(event: MouseEvent) {
        return true;
    }

    @HostListener('mousedown', ['$event'])
    onButtonClick(event: MouseEvent) {
        console.log(event, ActiveDropdown, this);

        if (ActiveDropdown && ActiveDropdown.canAutoClose(event)) {
            ActiveDropdown.onMouseClickOutside(event);
        }

        if (this.expanded) {

            let e: HTMLElement = <HTMLElement> event.target;

            while (e.parentElement) {

                if (e.dataset.submenuOption) {
                    this.action.next(e.dataset.submenuOption);
                    this.expanded = false;
                    window.removeEventListener('mousedown', this.onMouseClickOutside);
                    return;
                }

                e = e.parentElement;
            }
        }

        event.stopImmediatePropagation();
        event.stopPropagation();
        event.preventDefault();

        if (!this.hasSubmenu) {
            this.action.next();
            return;
        }

        this.expanded = true;

        window.addEventListener('mousedown', this.onMouseClickOutside);

        ActiveDropdown = this;
    }

    onMouseClickOutside(event?: MouseEvent) {

        if (event) {

            event.stopPropagation();

            let e: HTMLElement = <HTMLElement> event.target;

            while (e.parentElement) {
                const elementIsToolbarButton = e.nodeName.toLowerCase() === 'learnt-whiteboard-toolbar-button';
                const elementIsThis = e === this.ref.nativeElement;
                if (elementIsToolbarButton && elementIsThis) {
                    return;
                }
                e = e.parentElement;
            }
        }

        window.removeEventListener('mousedown', this.onMouseClickOutside);

        this.expanded = false;

        if (!this.cdref['destroyed']) {
            this.cdref.detectChanges();
        }
    }
}
