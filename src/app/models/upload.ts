import {Hydratable, HydrateProperty} from '../lib/core/hydratable';
import * as moment from 'moment';
import { environment } from '../../environments/environment';

export enum UploadState {
    Initiated,
    Succeeded,
    Failed,
}

export class Upload extends Hydratable {

    @HydrateProperty()
    _id: string;

    @HydrateProperty()
    name: string;

    @HydrateProperty()
    mime: string;

    @HydrateProperty()
    size: number;

    @HydrateProperty()
    url: string;

    @HydrateProperty()
    context: string;

    @HydrateProperty('moment')
    expire: moment.Moment;

    @HydrateProperty()
    state: UploadState;

    constructor(raw?: any) {
        super();
        if (raw) {
            this.hydrate(raw);
        }
    }

    get href(): string {

        if (this.url) {
            return `https://s3.amazonaws.com/learnt/${this.url}`;
        }

        return 'https://s3.amazonaws.com/tutorthepeople/temp/default-avatar.png';
    }
}

export interface VideoData {
    duration: number,
        extension: string,
}

