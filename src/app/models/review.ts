import {Hydratable, HydrateProperty} from '../lib/core/hydratable';
import * as moment from 'moment';
import {User} from './user';
import _isNumber from 'lodash-es/isNumber';

abstract class BaseReview extends Hydratable {
    @HydrateProperty()
    communication: number;

    @HydrateProperty()
    clarity: number;

    @HydrateProperty()
    professionalism: number;

    @HydrateProperty()
    patience: number;

    @HydrateProperty()
    helpfulness: number;

    get average(): number {
        const data =[
            this.communication,
            this.clarity,
            this.professionalism,
            this.patience,
            this.helpfulness
        ];
        return data.filter(_isNumber).reduce((a, b) => a + b, 0) / data.length;
    }
}

export class OverallReview extends BaseReview {
    constructor(raw?: any) {
        super();
        if (raw) {
            this.hydrate(raw);
        }
    }
}

export class Review extends BaseReview {
    @HydrateProperty()
    _id: string;

    @HydrateProperty(User)
    user: User;

    @HydrateProperty(User)
    reviewer: User;

    @HydrateProperty()
    title: string;

    @HydrateProperty()
    public_review: string;

    @HydrateProperty()
    private_review: string;

    @HydrateProperty()
    approved: boolean;

    @HydrateProperty('moment')
    time: moment.Moment;

    constructor(raw?: any) {
        super();
        if (raw) {
            this.hydrate(raw);
        }
    }
}
