import {Observable} from 'rxjs/Rx';
import {ModalAlertComponent} from '../common/modal-alert/modal-alert.component';
import {ComponentRef, Injectable} from '@angular/core';
import {Overlay, OverlayConfig, OverlayRef} from '@angular/cdk/overlay';
import {ComponentPortal} from '@angular/cdk/portal';
import { take } from 'rxjs/operators';

export interface AlertOptions {
    lifetime?: number;
    backdropClose?: boolean;
    buttons?: { label: string, result: any }[];
    rootTabEnabled?: boolean;
    closeButton?: boolean;
}

export class AlertRef {
    constructor(private service: AlertService,
                private overlayRef: OverlayRef,
                private alertRef: ModalAlertComponent) {
    }

    public get result(): Observable<any> {
        return this.alertRef.result.pipe(take(1));
    }

    close() {
        this.overlayRef.dispose()
    }

    public dispose(): void {
        this.service.setRootTabEnabled(true);
        this.overlayRef.dispose();
    }
}

@Injectable()
export class AlertService {

    previousFocus: any;

    constructor(private overlay: Overlay) {
    }

    public setRootTabEnabled(enabled: boolean = true): void {
        const roots = document.getElementsByTagName('learnt-wrapper');
        if (roots && roots.length) {
            const root: HTMLElement = <HTMLElement> roots[0];
            root.style.pointerEvents = enabled ? 'auto' : 'none';
        }

        if (enabled && this.previousFocus) {
            this.previousFocus.focus();
        }
    }

    alert(title: string, message?: string, alertOptions?: AlertOptions): AlertRef {
        const options: AlertOptions = {
            lifetime: 5000,
            backdropClose: true,
            closeButton: false
        };

        for (const key in alertOptions) {
            if (!alertOptions.hasOwnProperty(key)) {
                continue;
            }
            options[key] = alertOptions[key];
        }

        this.previousFocus = document.hasFocus() &&
            document.activeElement !== document.body &&
            document.activeElement !== document.documentElement &&
            document.activeElement;

        let lifetimeTimeout: NodeJS.Timer;

        const state: OverlayConfig = new OverlayConfig();
        state.hasBackdrop = true;
        state.positionStrategy = this.overlay.position().global().centerHorizontally().centerVertically();
        const overlayRef: OverlayRef = this.overlay.create(state);

        if (options && options.backdropClose === true) {
            overlayRef.backdropClick().subscribe(() => {
                if (!lifetimeTimeout) {
                    return;
                }

                this.setRootTabEnabled(true);
                clearTimeout(lifetimeTimeout);
                lifetimeTimeout = null;
                overlayRef.dispose();
            });
        }

        const componentRef: ComponentRef<ModalAlertComponent> = overlayRef.attach(new ComponentPortal(ModalAlertComponent));

        const alertComponent = componentRef.instance;

        alertComponent.title = title;
        alertComponent.message = message;
        alertComponent.closeButton = options.closeButton;

        if (options && options.buttons) {
            alertComponent.buttons = options.buttons;
        }

        if (options && typeof(options.lifetime) === 'number' && options.lifetime > 0) {
            lifetimeTimeout = setTimeout(() => {
                this.setRootTabEnabled(true);
                overlayRef.dispose();
                alertComponent.result.next()
                alertComponent.result.complete()
            }, options.lifetime);
        }

        if (options && !options.rootTabEnabled) {
            this.setRootTabEnabled(false);
        }

        return new AlertRef(this, overlayRef, alertComponent);
    }
}
