import { NotificationsService } from '../../../services/notifications';
import { UserPresence } from '../userpresence';
import { SocketPresence } from './services';
import { TOKEN_STORAGE, TokenStorage } from '../auth';
import { EventEmitter, Inject, Injectable, InjectionToken, Injector, Output } from '@angular/core';
import { SocketEvent, SocketEventData, SocketServiceHandler } from './main';
import { Observable } from 'rxjs';

export const API_SOCKET_URL = new InjectionToken('API_SOCKET_URL');

@Injectable()
export class SocketService {

    _url: string;
    _socket: WebSocket;
    _services: { [prefix: string]: SocketServiceHandler[] } = {};
    _tryCount = 0;
    _connected: boolean;

    queue = [];

    @Output()
    public readonly events: EventEmitter<any> = new EventEmitter();

    constructor(@Inject(TOKEN_STORAGE) private tokenProvider: TokenStorage,
                private injector: Injector,
                private notificationsService: NotificationsService,
                @Inject(API_SOCKET_URL) url: string) {
        this._url = url;

        this.onSocketOpen = this.onSocketOpen.bind(this);
        this.onSocketMessage = this.onSocketMessage.bind(this);
        this.onSocketError = this.onSocketError.bind(this);
        this.onSocketClose = this.onSocketClose.bind(this);

        this.register('presence', new SocketPresence(this.injector.get(UserPresence)));
    }

    public on(kind: string): Observable<any> {
        return this.events.filter(e => e.type.indexOf(kind) !== -1);
    }

    public connect(): void {

        if (this._socket || this._connected) {
            return;
        }

        this.tokenProvider.get().then(token => {
            if (token) {
                this._socket = new WebSocket(`${this._url}?access_token=${token}`);
                this._socket.addEventListener('open', this.onSocketOpen);
                this._socket.addEventListener('message', this.onSocketMessage);
                this._socket.addEventListener('error', this.onSocketError);
                this._socket.addEventListener('close', this.onSocketClose);
            }
        });
    }

    public send(type: string, data: any): void {
        this.queue.push(JSON.stringify({type, data}));
        this.flush();
    }

    public disconnect(): void {

        if (!this._socket) {
            return;
        }

        this.flush();

        this._connected = true;
        this._socket.close();
        this._socket = null;
    }

    private flush(): void {

        if (!(this._socket && this._socket.readyState === WebSocket.OPEN && this.queue.length)) {
            return;
        }

        for (let i = 0; i < this.queue.length; i++) {
            this._socket.send(this.queue[i]);
        }

        this.queue = [];
    }

    /**
     * Register a service from outside to
     */
    register(prefix: string, service: SocketServiceHandler): void {

        if (!this._services[prefix]) {
            this._services[prefix] = [service];
            return;
        }

        this._services[prefix].push(service);
    }

    /**
     * Unregister service
     */
    unregister(service: SocketServiceHandler): void {
        for (const ev in this._services) {
            for (let i = 0; i < this._services[ev].length; i++) {
                if (this._services[ev][i] === service) {
                    this._services[ev].splice(i, 1);
                }
            }
        }
    }

    private onSocketOpen(): void {
        this._connected = true;
        this._tryCount = 0;
        this.flush();
    }

    private onSocketMessage(event: any): void {
        const message: SocketEvent = JSON.parse(event.data);

        if (message.data) {
            message.data = new SocketEventData(message.data);
        }

        for (const prefix in this._services) {
            if (message.type.indexOf(prefix) === 0) {
                const services = this._services[prefix];
                for (let i = 0; i < services.length; i++) {
                    const ctx = this._services[prefix][i];
                    ctx.onSocketEvent.apply(ctx, [message]);
                }
            }
        }

        this.events.next(message);
    }

    private onSocketError(event: any): void {
        console.error({socketErrorEvent: event})
    }

    private onSocketClose(event: any): void {
        this._socket = null;
        this._connected = false;
        setTimeout(() => this.connect(), this._tryCount < 10 ? 5000 : 20000);
        this._tryCount++;
    }
}
