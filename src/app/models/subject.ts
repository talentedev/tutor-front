import {Hydratable, HydrateProperty} from '../lib/core/hydratable';

export class Subject extends Hydratable {
    @HydrateProperty()
    _id: string;

    @HydrateProperty()
    name: string;

    constructor(raw?: any) {
        super();
        if (raw) {
            this.hydrate(raw);
        }
    }
}
