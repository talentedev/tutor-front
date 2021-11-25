import {Hydratable, HydrateProperty} from '../lib/core/hydratable';
import * as moment from 'moment';

export class Notification extends Hydratable {
    @HydrateProperty()
    _id: string;

    @HydrateProperty()
    title: string;

    @HydrateProperty()
    message: string;

    @HydrateProperty()
    action: string;

    @HydrateProperty()
    icon: string;

    @HydrateProperty('moment')
    time: moment.Moment;

    @HydrateProperty()
    seen: boolean;

    @HydrateProperty()
    deleting: boolean;

    @HydrateProperty()
    data: any;

    @HydrateProperty()
    type: number;

    constructor(raw?: any) {
        super();

        if (raw) {
            this.hydrate(raw);
        }

        if (!raw.icon) {
            this.icon = 'tick';
        }
    }
}
