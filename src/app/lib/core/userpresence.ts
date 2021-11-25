import { EventEmitter, Injectable } from '@angular/core';

export enum Presence {
    Offline,
    Online,
    Iddle,
}

export type PresenceLabel = 'online' | 'idle' | 'offline'

const PresenceLabels: {[label: string]: PresenceLabel} = {
    [Presence.Offline]: 'offline',
    [Presence.Online]: 'online',
    [Presence.Iddle]: 'idle',
}

export interface UserPresenceObject {
    getID(): string;
    setPresence(presence: Presence): void;
}

let ref: UserPresence;

@Injectable()
export class UserPresence {

    users: Map<string, Presence> = new Map();

    changes: EventEmitter<any> = new EventEmitter();

    set(users: string[] | string, online?: Presence) {
        if (Array.isArray(users)) {
            this.users.clear();
            users.forEach(user => {
                this.users.set(user, Presence.Online)
            })
        } else {
            if (online) {
                this.users.set(users, online);
            } else {
                this.users.delete(users);
            }
        }
        this.changes.next();
    }

    apply(user: UserPresenceObject): void {
        user.setPresence(this.get(user))
    }

    get(user: UserPresenceObject): Presence {

        if (!this.users.has(user.getID())) {
            return Presence.Offline;
        }

        return this.users.get(user.getID());
    }

    label(user: UserPresenceObject): PresenceLabel {
        return PresenceLabels[
            this.get(user)
        ];
    }
}
