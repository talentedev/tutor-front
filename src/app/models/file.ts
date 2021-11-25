import { Hydratable, HydrateProperty } from '../lib/core/hydratable';

export class File extends Hydratable {

    @HydrateProperty()
    context: string;

    @HydrateProperty()
    url: string;
}
