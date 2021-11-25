import {Component, HostBinding} from '@angular/core';
import {ROUTE_ANIMATION_DEFAULT} from '../../app.animation';

@Component({
    selector: 'learnt-inbox-page',
    templateUrl: './inbox-page.component.html',
    styleUrls: ['./inbox-page.component.scss'],
    animations: [ROUTE_ANIMATION_DEFAULT]
})
export class InboxPageComponent {

    @HostBinding('class.page-component')
    isPageComponent = true;

    @HostBinding('@routeAnimation')
    routeAnimation = true;

    constructor() {
    }
}
