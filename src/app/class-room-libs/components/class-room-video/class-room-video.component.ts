import {
    AfterViewInit,
    Component,
    ElementRef,
    HostBinding,
    HostListener,
    Input,
    OnDestroy,
    OnInit,
    ViewChild,
} from '@angular/core';
import { AlertService } from '@services/alerts';
import { NotificationsService } from '@services/notifications';
import Peer, { DataConnection, MediaConnection } from 'peerjs';
import { combineLatest, Subscription } from 'rxjs';
import { first } from 'rxjs/operators';
import { ClassroomService } from '../../../class-room/services/classroom.service';
import { Auth } from '../../../lib/core/auth';
import { User } from '../../../models';
import { DataEvent, MediaType, PeerMetaData } from '../../models';

@Component({
    selector: 'learnt-class-room-video',
    templateUrl: './class-room-video.component.html',
    styleUrls: ['./class-room-video.component.scss'],
})
export class ClassRoomVideoComponent implements OnInit, OnDestroy, AfterViewInit {
    @Input() fullscreen: boolean;
    audioEnabled: boolean;
    videoEnabled: boolean;
    private peer: Peer;
    private _videoStream: MediaStream;
    private _audioStream: MediaStream;
    private _vidConnections: MediaConnection[] = [];
    private _audConnections: MediaConnection[] = [];
    private _peers: string[] = [];  // remote peers
    private _subs = new Subscription();
    private _me: User;
    private _streamInitiated: boolean;
    private _devices: MediaDeviceInfo[];

    @HostBinding('class.fullscreen') get isFullscreen(): boolean {
        return this.fullscreen;
    }

    @HostBinding('class.hover')
    public hover: boolean;

    @ViewChild('localVideo')
    public localVideo: ElementRef<HTMLVideoElement>;

    @ViewChild('video')
    public videoRef: ElementRef<HTMLVideoElement>;

    @ViewChild('audio')
    public audioRef: ElementRef<HTMLAudioElement>;

    @ViewChild('container')
    public container: ElementRef;

    get isConnected(): boolean {
        return this.peer !== undefined;
    }

    constructor(private classroomService: ClassroomService,
                private alertsService: AlertService,
                private notifsService: NotificationsService,
                private authService: Auth) {
    }

    ngOnInit(): void {
        navigator.mediaDevices.enumerateDevices().then((mediaInfo: MediaDeviceInfo[]) => {
            this._devices = mediaInfo;
        }).catch(err => {
            this._devices = [];
            console.error(err);
        });

        this._subs.add(this.authService.me.pipe(first(u => u !== null)).subscribe(me => {
            this._me = me;
        }));

        this._subs.add(this.classroomService.peer$.subscribe(peer => {
            this.peer = peer;
            this.onPeerOpen();
        }));

        this._subs.add(combineLatest([this.classroomService.peers$, this.classroomService.peer$]).subscribe(([peers]: [string[], Peer]) => {
            this._peers = peers;
            this._vidConnections = this._vidConnections.filter(con => {
                if (peers.includes(con.peer)) {
                    return true;
                }
                con.close();
            });
            this._audConnections = this._audConnections.filter(con => {
                if (peers.includes(con.peer)) {
                    return true;
                }
                con.close();
            });

            // run only once on page load
            if (!this._streamInitiated) {
                this._streamInitiated = true;
                this.startStream('video');
                this.startStream('audio');
            }
            else {
                if (this._videoStream) this.startStream('video');
                if (this._audioStream) this.startStream('audio');
            }
        }));
    }

    ngOnDestroy(): void {
        this.stopStream('audio');
        this.stopStream('video');
        this.classroomService.closeDataConnections();
        this._subs.unsubscribe();
    }

    ngAfterViewInit(): void {
        if (!window['peerjs'].util.supports.audioVideo) {
            this.alertsService.alert("Audio and video is not supported.");
        }
    }

    private onPeerOpen(): void {
        this.peer.on('call', (connection: MediaConnection) => {
            const type = connection.metadata.type;
            if (type === 'audio' || type === 'video') {
                connection.answer();
                
                connection.on('stream', (stream: MediaStream) => {
                    if (type === 'video') {
                        this.videoRef.nativeElement.srcObject = stream;
                    }
                    if (type === 'audio') {
                        this.audioRef.nativeElement.srcObject = stream;
                    }
                });
            }
        });

        this.peer.on('connection', (connection: DataConnection) => {
            // on receive data
            connection.on('data', (data: DataEvent) => {
                if (data.action === 'stopped') {
                    if (data.type === 'video') {
                        this.videoRef.nativeElement.srcObject = null;
                    }
                    if (data.type === 'audio') {
                        this.audioRef.nativeElement.srcObject = null;
                        this.audioRef.nativeElement.pause();
                    }
                }
            });
        });
    }

    /**
     * Starts streaming to peers, Call if peer list is updated
     * @param type
     * @private
     */
    private async startStream(type: MediaType): Promise<void> {
        const metadata: PeerMetaData = {
            type,
            name: this._me.shortName,
            source: this.peer.id,
        };

        if (type === 'video') {
            if (!this._videoStream) {
                const videoStream = await this.getVideoStream();
                if (videoStream) {
                    this._videoStream = videoStream;
                    this.videoEnabled = true;
                    this.localVideo.nativeElement.srcObject = videoStream;
                }
            }

            if (this._videoStream) {
                for (const peer of this._peers) {
                    if (!this.hasConnectionWith('video', peer)) {
                        const connection = this.peer.call(peer, this._videoStream, { metadata });
                        if (connection && connection.open) {
                            this._vidConnections.push(connection);
                        }
                    }
                }
            }
        }

        if (type === 'audio') {
            if (!this._audioStream) {
                const stream = await this.getAudioStream();
                if (stream) {
                    this._audioStream = stream;
                    this.audioEnabled = true;
                }
            }

            if (this._audioStream) {
                for (const peer of this._peers) {
                    if (!this.hasConnectionWith('audio', peer)) {
                        const connection = this.peer.call(peer, this._audioStream, { metadata });
                        if (connection && connection.open) {
                            this._audConnections.push(connection);
                        }
                    }
                }
            }
        }
    }

    /**
     * Checks if a media or data connection has been made with a peer and this peer is the source
     * @param type
     * @param peerId
     * @private
     */
    private hasConnectionWith(type, peerId: string): boolean {
        const conWithPeer = (con: MediaConnection | DataConnection): boolean => con.peer === peerId;
        let conn: MediaConnection | DataConnection | undefined;
        if (type === 'video') {
            conn = this._vidConnections.find(conWithPeer);
        }
        if (type === 'audio') {
            conn = this._audConnections.find(conWithPeer);
        }
        return conn !== undefined && conn.metadata.source === this.peer.id;
    }

    private hasMediaDevice(kind: 'video' | 'audio'): boolean {
        if (typeof this._devices == 'undefined' || this._devices.length==0 || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            this.noDeviceFoundMsg(kind);
            return false;
        }

        const device = this._devices.find(dev => dev.kind === kind+'input');
        if (device) {
            return false;
        }
    }

    private noDeviceFoundMsg(type: MediaType): void {
        if (type === 'video') {
            this.notifsService.notify(
                'No camera',
                'We couldn\'t find any video device available, the other person won\'t be able to see you!',
                'video-camera',
                10000,
            );
        }
        else {
            this.notifsService.notify(
                'No microphone',
                'We couldn\'t find any audio device available, the other person won\'t be able to hear you!',
                'unmute',
                10000,
            );
        }
    }

    private noDevicePermissionMsg(type: MediaType): void {
        if (type === 'audio') {
            this.notifsService.notify(
                'Permission Denied',
                'Please enable access to your microphone',
                'unmute',
            );
        }
        else {
            this.notifsService.notify(
                'Permission Denied',
                'Please enable access to your camera',
                'video-camera',
            );
        }
    }

    toggleTrack(type: MediaType): void {
        if (type === 'video') {
            this.videoEnabled ? this.stopStream(type) : this.startStream(type);
        }
        if (type === 'audio') {
            this.audioEnabled ? this.stopStream(type) : this.startStream(type);
        }
    }

    private stopStream(type: MediaType): void {
        if (type === 'video') {
            this.videoEnabled = false;
            if (!this._videoStream) {
                return;
            }
            this.localVideo.nativeElement.srcObject = null;
            this._videoStream.getTracks().map(track => {
                this._videoStream.removeTrack(track);
                track.stop();
            });
            this._videoStream = null;
            this._vidConnections.map(con => con.close());
            this._vidConnections = [];
        }
        if (type === 'audio') {
            this.audioEnabled = false;
            if (!this._audioStream) {
                return;
            }
            this._audioStream.getTracks().map(track => {
                this._audioStream.removeTrack(track);
                track.stop();
            });
            this._audioStream = null;
            this._audConnections.map(con => con.close());
            this._audConnections = [];
        }

        // notify peers that stream is closed
        this.classroomService.broadcastToPeers({ action: 'stopped', type });
    }

    @HostListener('mouseenter')
    onMouseEnter(): void {
        this.hover = true;
    }

    @HostListener('mouseleave')
    onMouseLeave(): void {
        this.hover = false;
    }

    private async getVideoStream(): Promise<MediaStream|null> {
        if (!this.hasMediaDevice('video')) {
            return null;
        }
        try {
            return await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } catch (e) {
            if (e.name === 'NotAllowedError') {
                this.noDevicePermissionMsg('video');
            }
            else {
                this.alertsService.alert('An error occurred', e.message);
                console.error(e.name, e.message);
            }
        }
    }

    private async getAudioStream(): Promise<MediaStream> {
        if (!this.hasMediaDevice('audio')) {
            return;
        }
        try {
            return await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        } catch (e) {
            if (e.name === 'NotAllowedError') {
                this.noDevicePermissionMsg('audio');
            }
            else {
                this.alertsService.alert('An error occurred', e.message);
                console.error(e.name, e.message);
            }
        }
    }
}
