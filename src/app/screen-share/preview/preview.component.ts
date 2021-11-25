import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AlertService } from '@services/alerts';
import * as Peer from 'peerjs';
import { MediaConnection } from 'peerjs';
import { combineLatest, Subscription } from 'rxjs';
import { DataEvent, PeerMetaData } from '../../class-room-libs/models';
import { VCRModule } from '../../class-room/class-room.module';
import { ClassroomService } from '../../class-room/services/classroom.service';
import { VirtualClassRoomComponent } from '../../class-room/virtual-class-room/virtual-class-room.component';
import { Auth } from '../../lib/core/auth';
import { User } from '../../models';

@Component({
    selector: 'learnt-preview',
    templateUrl: './preview.component.html',
    styleUrls: ['./preview.component.scss'],
})
export class PreviewComponent implements VCRModule, OnInit, OnDestroy {
    public readonly ready = new EventEmitter<boolean>();
    public videoEl: HTMLMediaElement;
    private _subs = new Subscription();
    peer: Peer;
    isScreenSharing = false;
    private _screenStream: MediaStream;
    private _peers: string[] = [];
    private _connections: MediaConnection[] = [];
    me: User;

    @ViewChild('videoContainer', { static: true })
    public videoContainer: ElementRef<HTMLDivElement>;

    constructor(
        private classroomService: ClassroomService,
        private alerts: AlertService,
        private authService: Auth,
    ) {
    }

    ngOnInit(): void {
        this._subs.add(this.authService.me.subscribe(me => {
            if (me) this.me = me;
        }));

        this._subs.add(this.classroomService.peer$.subscribe((peer) => {
            this.peer = peer;
            this.listenToPeer();
        }));

        this._subs.add(combineLatest([this.classroomService.peers$, this.classroomService.peer$])
            .subscribe(([peers]: [string[], Peer]) => {
                this._peers = peers;
                if (this._screenStream && this.isScreenSharing) {
                    this.startScreenSharing();
                }
            }));

        // module ready
        setTimeout(() => this.ready.next(), 300);
    }

    ngOnDestroy(): void {
        this.stopScreenSharing();
        this._subs.unsubscribe();
    }

    private listenToPeer(): void {
        this.peer.on('call', conn => {
            const metadata = conn.metadata;
            if (metadata.type === 'screen' && !this.hasStreamFrom(metadata.source)) {
                conn.answer();
                this._connections.push(conn);
                conn.on('stream', stream => {
                    this._screenStream = stream;
                    const video = document.createElement('video');
                    video.srcObject = stream;
                    this.videoContainer.nativeElement.appendChild(video);
                    this.videoEl = video;
                    video.play();
                    this.classroomService.isRemoteScreensharing$.next(true);
                });
            }
        });

        this.peer.on('connection', dataConnection => {
            dataConnection.on('data', (data: DataEvent) => {
                if (data.action === 'stopped' && data.type === 'screen') {
                    this._screenStream = null;
                    const videoEls: HTMLCollectionOf<HTMLVideoElement> = this.videoContainer.nativeElement.getElementsByTagName('video');
                    for (let i = 0; i < videoEls.length; i++) {
                        videoEls.item(i).remove();
                    }
                    this.videoEl = null;
                    this._connections = [];
                    this.classroomService.isRemoteScreensharing$.next(false);
                }
            });
        });
    }

    private hasConnectionWith(peerId: string): boolean {
        const conn = this._connections.find(conn => conn.peer === peerId);
        return conn !== undefined && conn.metadata.source === this.peer.id;
    }

    private hasStreamFrom(peerId: string): boolean {
        const conn = this._connections.find(conn => conn.metadata.source === peerId);
        return conn !== undefined;
    }

    toggleSharing(): void {
        this.isScreenSharing ? this.stopScreenSharing() : this.startScreenSharing();
    }

    /**
     * override
     * @param vcr
     */
    public setup(vcr: VirtualClassRoomComponent): void {
        if (!(vcr && vcr.menu)) {
            return;
        }
        vcr.menu.init({
            'export': {
                label: () => this.isScreenSharing ? 'Stop screen sharing' : 'Share screen',
                parent: 'file',
                handler: () => this.toggleSharing(),
            },
        });
    }

    private async startScreenSharing(): Promise<void> {
        if (!this.peer) return;

        if (!this._screenStream) {
            try {
                this._screenStream = await navigator.mediaDevices.getDisplayMedia();
            } catch (e) {
                console.error(e);
                if (e.name !== 'NotAllowedError') {
                    this.alerts.alert('Failed to share screen', e);
                }
            }
        }
        if (this._screenStream) {
            this._screenStream.getTracks()[0].onended = () => {
                this.stopScreenSharing();
            };

            this._peers.map(peerId => {
                const metadata: PeerMetaData = {
                    type: 'screen',
                    source: this.peer.id,
                };
                if (!this.hasConnectionWith(peerId)) {
                    const connection = this.peer.call(peerId, this._screenStream, { metadata });
                    if (connection && connection.open) {
                        this._connections.push(connection);
                    }
                }
            });
            this.classroomService.isScreensharing$.next(true);
            this.isScreenSharing = true;
        }
    }

    private stopScreenSharing(): void {
        this.classroomService.broadcastToPeers({ action: 'stopped', type: 'screen' });
        this.isScreenSharing = false;
        this.classroomService.isScreensharing$.next(false);
        this._connections.map(conn => conn.close());
        this._connections = [];
        if (this._screenStream) {
            this._screenStream.getTracks().forEach(t => t.stop());
            this._screenStream = null;
        }
    }
}
