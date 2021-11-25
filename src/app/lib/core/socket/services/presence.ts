import { UserPresence } from '../../userpresence';
import { SocketEvent, SocketServiceHandler } from '../main';
import { SocketService } from '../socket';


export class SocketPresence implements SocketServiceHandler {

    constructor(private presence: UserPresence) {}
    onSocketEvent(event: SocketEvent): void {
        switch (event.type) {
            case 'presence':
                if (event.data.has('users')) {
                    this.presence.set(event.data.get('users'));
                } else {
                    this.presence.set(
                        event.data.get('user'),
                        event.data.get('online')
                    );
                }
                break;
        }
    }
}
