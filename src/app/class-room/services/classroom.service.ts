import { EventEmitter, Injectable } from '@angular/core';
import Peer, { DataConnection } from 'peerjs';
import { BehaviorSubject, combineLatest, ReplaySubject } from 'rxjs';

/**
 * Creates peer and keeps track of other peers
 */
@Injectable({
    providedIn: 'root',
})
export class ClassroomService {
    // class room data
    onError = new EventEmitter<string[]>();  // title, error message
    isScreensharing$ = new BehaviorSubject<boolean>(false);
    isRemoteScreensharing$ = new BehaviorSubject<boolean>(false);
    peer$ = new ReplaySubject<Peer>();
    peers$ = new ReplaySubject<string[]>();
    private _dataConnections: DataConnection[] = [];

    constructor() {
        combineLatest([this.peer$, this.peers$]).subscribe(([peer, peers]) => {
            peers.map(peerId => {
                if (!this.hasDataConnectionWith(peerId)) {
                    const conn = peer.connect(peerId);
                    if (conn) {
                        conn.on('open', () => {
                            this._dataConnections.push(conn);
                        });
                    }
                    else {
                        console.error('Unable to establish data connection with peer', peerId);
                    }
                }
            });
        });
    }

    private hasDataConnectionWith(peerId: string): boolean {
        return this._dataConnections.find(c => c.peer === peerId) !== undefined;
    }

    closeDataConnections(): void {
        this._dataConnections.map(c => c.close());
        this._dataConnections = [];
    }

    createPeer(): void {
        // TODO: When changing to a private peerjs server see: https://github.com/peers/peerjs-server
        const peer = new Peer();
        if (peer) {
            peer.on('open', (id: string) => {
                this.peer$.next(peer);
            });

            peer.on('connection', (conn: DataConnection) => {
                this._dataConnections.push(conn);
            });
        }
        else {
            console.error('Unable to establish peer connection');
        }
    }

    broadcastToPeers(data: any): void {
        this._dataConnections.map(c => c.send(data));
    }
}
