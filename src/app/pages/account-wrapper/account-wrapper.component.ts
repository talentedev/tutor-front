import {Component, ElementRef, OnDestroy} from "@angular/core";

@Component({
    selector: 'learnt-account-wrapper',
    styleUrls: ['./account-wrapper.component.scss'],
    templateUrl: './account-wrapper.component.html',
})
export class AccountWrapperComponent implements OnDestroy {
    constructor() {
        document.body.parentElement.classList.add('learnt-theme--2');
    }

    ngOnDestroy() {
        document.body.parentElement.classList.remove('learnt-theme--2');
    }
    
    ngAfterViewInit() {
    }
}
