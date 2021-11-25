import {Component, ElementRef, HostListener, ViewChild} from '@angular/core';
import { Media } from 'app/lib/core/media';

@Component({
    selector: 'learnt-affiliate-profile-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss']
})
export class AffiliateProfileMenuComponent {
    @ViewChild('menu')
    public menu: ElementRef;

    public menuExpanded: boolean;

    constructor(private media: Media) {}

    expand(event: MouseEvent) {
        if (this.media.query('gt-sm')) {
            return;
        }

        if (!this.menuExpanded) {
            event.stopImmediatePropagation();
        }
        this.menuExpanded = !this.menuExpanded;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        if (!this.menu.nativeElement.contains(<Node>event.target) && this.menuExpanded) {
            this.menuExpanded = false;
        }
    }
}
