import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
    selector: 'learnt-popup-menu',
    templateUrl: './popup-menu.component.html',
    styleUrls: ['./popup-menu.component.scss']
})
export class PopupMenuComponent implements OnInit {
    @Output() close = new EventEmitter();
    
    constructor() {
    }

    ngOnInit(): void {
    }

}
