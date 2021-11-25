import {Session} from 'app/white-board/core/session';
import {MicroEvents} from 'app/lib/core/common/events';
import * as moment from 'moment-timezone';
import { EventEmitter } from '@angular/core';

export enum SessionHistoryAction {
    ADD,
    REMOVE,
    MODIFY,
}

type SessionHistoryChange = {
    action: SessionHistoryAction
    object: any
}

export class SessionHistory extends MicroEvents {

    recordings: any[] = [];

    index = 0;

    updating: boolean;

    change: EventEmitter<SessionHistoryChange> = new EventEmitter();

    constructor(private session: Session) {
        super();
    }

    undo() {
        if (this.index > 0) {
            this.move(this.index - 1);
        }
    }

    redo() {
        if (this.index < this.length) {
            this.move(this.index + 1);
        }
    }

    move(to: number) {
        this.updating = true;

        const back = to < this.index;
        const canvas = this.session.getCanvas();

        for (let i = this.index; back ? i >= to : i <= to; back ? i-- : i++) {

            if (i === to || i === 0 && back) {
                continue;
            }
            const idx = back ? i - 1 : i;
            const record = this.recordings[idx];

            if (!record) {
                console.log('Record missing. Index is ', idx);
                continue;
            }

            switch (record.action) {

                case SessionHistoryAction.ADD:
                    back ? canvas.remove(record.element) : canvas.add(record.element);
                    break;

                case SessionHistoryAction.REMOVE:
                    back ? canvas.add(record.element) : canvas.remove(record.element);
                    break;

                case SessionHistoryAction.MODIFY:
                    break;
            }
        }

        this.index = to;
        this.updating = false;
        this.session.sendChanges()
    }

    push(action: SessionHistoryAction, element: any) {
        
        if (this.updating) {
            return;
        }

        const index = this.index + 1;
        const state = {action, element, index: index, time: moment().utc().format()};
        this.recordings = this.recordings.slice(0, index - 1);
        this.recordings.push(state);
        this.index = index;
    }

    clear() {
        this.recordings = [];
        this.index = 0;
    }

    get canUndo(): boolean {
        return this.index > 0;
    }

    get canRedo(): boolean {
        return this.index < this.length;
    }

    get length() {
        return this.recordings.length;
    }
}
