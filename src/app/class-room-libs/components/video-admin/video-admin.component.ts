import {
    Component,
    ElementRef,
    HostBinding,
    Input,
    OnDestroy,
    OnInit,
    QueryList,
    Renderer2,
    ViewChild,
    ViewChildren,
} from '@angular/core';
import Peer, { DataConnection, MediaConnection } from 'peerjs';
import { Subscription } from 'rxjs';
import { ClassroomService } from '../../../class-room/services/classroom.service';
import { DataEvent } from '../../models';

@Component({
    selector: 'learnt-video-admin',
    templateUrl: './video-admin.component.html',
    styleUrls: ['./video-admin.component.scss'],
})
export class VideoAdminComponent implements OnInit, OnDestroy {
    peer: Peer;
    private _vidConnections = new Map<string, HTMLVideoElement>();
    @Input() fullscreen: boolean;
    @ViewChild('container') container: ElementRef<HTMLDivElement>;
    @ViewChildren('video') videoRefs: QueryList<ElementRef<HTMLVideoElement>>;
    @ViewChildren('audio') audioRefs: QueryList<ElementRef<HTMLAudioElement>>;
    private _subs = new Subscription();

    @HostBinding('class.fullscreen') get isFullscreen() {
        return this.fullscreen;
    };

    constructor(
        private classroomService: ClassroomService,
        private renderer: Renderer2,
    ) {
    }

    ngOnInit(): void {
        this._subs.add(this.classroomService.peer$.subscribe((peer: Peer) => {
            this.peer = peer;
            this.listenToPeers();
        }));
    }

    ngOnDestroy(): void {
        this._subs.unsubscribe();
    }

    private listenToPeers(): void {
        this.peer.on('call', (conn: MediaConnection) => {
            const metadata = conn.metadata;
            if (['audio', 'video'].includes(metadata.type)) {
                conn.answer();
                conn.on('stream', stream => {
                    if (metadata.type === 'video') {
                        const videoEl = this.videoRefs.find(item => !item.nativeElement.dataset.id);
                        if (!videoEl) {
                            console.error('Video element not found');
                            return;
                        }
                        this.renderer.setProperty(videoEl.nativeElement, 'srcObject', stream);
                        this.renderer.setAttribute(videoEl.nativeElement, 'data-id', conn.peer);
                        this.renderer.setProperty(videoEl.nativeElement, 'volume', 0);
                        videoEl.nativeElement.play();
                        const span = videoEl.nativeElement.nextElementSibling;
                        span.textContent = conn.metadata.name;
                    }
                    if (conn.metadata.type === 'audio') {
                        const audioEl = this.audioRefs.find(item => !item.nativeElement.dataset.id);
                        if (!audioEl) {
                            console.error('Audio element not found');
                            return;
                        }
                        audioEl.nativeElement.srcObject = stream;
                        audioEl.nativeElement.dataset.id = conn.peer;
                        audioEl.nativeElement.play();
                    }
                });
            }
        });

        this.peer.on('connection', (conn: DataConnection) => {
            conn.on('data', (data: DataEvent) => {
                if (data.type === 'video' && data.action == 'stopped') {
                    const videoRef = this.videoRefs.find(item => item.nativeElement.dataset.id === conn.peer);
                    if (videoRef) {
                        videoRef.nativeElement.removeAttribute('data-id');
                        videoRef.nativeElement.srcObject = null;
                        videoRef.nativeElement.nextElementSibling.textContent = '';
                    }
                }

                if (data.type === 'audio' && data.action == 'stopped') {
                    const audioEl = this.audioRefs.find(item => item.nativeElement.dataset.id === conn.peer);
                    if (audioEl) {
                        audioEl.nativeElement.removeAttribute('data-id');
                        audioEl.nativeElement.srcObject = null;
                    }
                }
            });
        });
    }

    private showVideo(stream: MediaStream): HTMLVideoElement {
        const videoEl = document.createElement('video');
        videoEl.setAttribute('preload', 'true');
        videoEl.setAttribute('autoplay', 'true');
        videoEl.classList.add('video');
        videoEl.srcObject = stream;
        this.container.nativeElement.appendChild(videoEl);
        return videoEl;
    }
}
