import {Hydratable, HydrateProperty} from '../lib/core/hydratable';

// https://openid.net/specs/openid-connect-core-1_0.html#UserInfoResponse
export class UserInfo extends Hydratable {

    @HydrateProperty()
    sub: string;

    @HydrateProperty()
    name: string;

    @HydrateProperty()
    given_name: string;

    @HydrateProperty()
    family_name: string;

    @HydrateProperty()
    email: string;

    @HydrateProperty()
    picture: string;

    @HydrateProperty()
    birthday: string;

    @HydrateProperty()
    phone: string;

    @HydrateProperty()
    address: string;

    constructor(raw?: any) {
        super();
        if (raw) {
            this.hydrate(raw);
        }
    }
}
