import { LocalStorageBind } from '../../../lib/core/common/lcprop';
import { Component, Output, Input, EventEmitter, OnInit } from '@angular/core';
import {isUndefined} from 'util';

export type EnterMode = 'send' | 'break-line';

@Component({
    selector: 'learnt-messenger-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss']
})
export class MessengerSettingsComponent implements OnInit {

    @Output()
    public readonly mode: EventEmitter<EnterMode> = new EventEmitter(true);

    @Output()
    public readonly close: EventEmitter<any> = new EventEmitter(true);

    @Input()
    initialMode: string;

    @LocalStorageBind('messenger-enter-mode')
    enterMode: string;

    constructor() {
    }

    ngOnInit() {
        if (isUndefined(this.initialMode)) {
            this.enterMode = 'send';
        } else {
            this.enterMode = this.initialMode;
        }
        console.log(this.initialMode);
    }

    onCloseRequest() {
        this.close.next();
        this.close.complete();
    }

    onOptionChange(mode: EnterMode) {
        this.mode.emit(mode);
    }
}
