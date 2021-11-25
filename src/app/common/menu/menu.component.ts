import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { User } from "../../models";
import { Router } from "@angular/router";
import { Media } from "../../lib/core/media";
import { Auth } from "../../lib/core/auth";
import { Subscription } from "rxjs";
import { Overlay, OverlayRef } from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import { PopupMenuComponent } from "../popup-menu/popup-menu.component";

@Component({
    selector: 'learnt-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss'],
})
export class MenuComponent implements OnInit, OnDestroy {
    @Input() transparent: boolean;
    isHomepage = false;
    mobile: boolean;
    me: User;
    subs = new Subscription();
    private overlayRef: OverlayRef;
    menuPortal: ComponentPortal<PopupMenuComponent>;

    constructor(
        private router: Router,
        private media: Media,
        private auth: Auth,
        private overlay: Overlay,
    ) {
        this.mobile = !media.query('gt-sm');
        this.subs.add(this.auth.me.subscribe(me => this.me = me));
    }

    ngOnInit(): void {
        if (this.router.url === '/') {
            this.isHomepage = true;
        }
    }

    ngOnDestroy(): void {
        this.subs.unsubscribe();
    }

    showMenu(): void {
        this.menuPortal = new ComponentPortal(PopupMenuComponent);
        this.overlayRef = this.overlay.create({hasBackdrop: true, disposeOnNavigation: true});
        this.overlayRef.backdropClick().subscribe(() => {
            this.destroyMenu();
        });
        this.overlayRef.attach(this.menuPortal);
        this.router.events.subscribe(event => {
            this.destroyMenu();
        });
    }

    private destroyMenu(): void {
        this.overlayRef?.detach();
        this.menuPortal = null;
        this.overlayRef = null;
    }
}
