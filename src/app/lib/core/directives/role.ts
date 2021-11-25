import { Auth } from '../../core/auth/auth';
import { Directive, Input, ElementRef, OnInit, ViewContainerRef } from '@angular/core';
import { User } from '../../../models';

@Directive({
    // tslint:disable-next-line:directive-selector
    selector: '[if-role]'
})
export class IfRoleDirective implements OnInit {

    @Input('if-role')
    role: string;

    me: User;

    constructor(
        private auth: Auth,
        private container: ViewContainerRef,
        private ref: ElementRef
    ) {
        const sub = auth.me.subscribe(me => {
            if (sub) { sub.unsubscribe(); }
            this.me = me;
        });
    }

    ngOnInit() {
        this.verify();
    }

    verify() {

        if (this.role.indexOf(',') === -1) {
            if (!this.me.hasRole(this.role)) {
                this.dispose();
            }
        } else {
            for (const role of this.role.split(',')) {
                if (!this.me.hasRole(role.trim())) {
                    this.dispose();
                }
            }
        }
    }

    dispose() {
        this.container.clear();
        this.ref.nativeElement.parentNode.removeChild(
            this.ref.nativeElement
        );
    }
}
