import {
    AfterViewInit,
    ChangeDetectorRef,
    Component, ComponentRef,
    ElementRef,
    EventEmitter,
    forwardRef,
    HostBinding,
    Input,
    OnDestroy,
    OnInit,
    Output, Renderer2,
    ViewChild
} from '@angular/core';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR} from '@angular/forms';
import getBlobDuration from 'get-blob-duration';
import {NotificationsService} from "../../services/notifications";
import {Notification, VideoData} from "../../models";
import {Subscription} from "rxjs/Rx";
import * as RecordRTC from 'recordrtc';
import {UploadButtonComponent} from "../upload-button/upload-button.component";

export enum VideoRecordingState {
    initial = 'initial',
    recording = 'recording',
    recorded = 'recorded',
    playing = 'playing',
    uploaded = 'uploaded',
}

const MAX_UPLOAD_SIZE = 524288000; // 500 MB

@Component({
    selector: 'learnt-video-recording',
    templateUrl: './video-recording.component.html',
    styleUrls: ['./video-recording.component.scss'],
    providers: [
        {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => VideoRecordingComponent), multi: true}
    ]
})
export class VideoRecordingComponent implements OnInit, AfterViewInit, OnDestroy, ControlValueAccessor {

    @Input()
    public disabled: boolean;

    @Input()
    formControl: FormControl;

    @Output() onDataChange = new EventEmitter<VideoData>();

    @ViewChild('video', {static: true})
    public videoEl: ElementRef<HTMLVideoElement>;

    @ViewChild('file') file: ElementRef<HTMLInputElement>;
    @ViewChild(UploadButtonComponent) uploadButton: UploadButtonComponent;

    public requesting: boolean;
    public recording: boolean;

    public state = VideoRecordingState.initial;
    private prevState: VideoRecordingState;

    private stream: MediaStream;
    private recorder: RecordRTC;

    private blob: Blob;
    objectURL: string;

    public duration: number; // exact video duration
    extension = '';
    public counter: number; // seconds timer
    private durationIntv: number;
    private subs = new Subscription();
    private mimeType = 'video/webm';
    onChangeFn: (value: null | File) => void;
    onTouchFn: () => void;
    maxUploadSize = MAX_UPLOAD_SIZE;
    videoUpload: FormControl;

    constructor(private cdRef: ChangeDetectorRef,
                private notifications: NotificationsService,
                private renderer: Renderer2) {
        this.videoUpload = new FormControl(null);
    }


    ngOnInit() {
        const script = document.createElement('script');
        script.src = 'https://www.webrtc-experiment.com/EBML.js';
        script.type = 'text/javascript';
        this.renderer.appendChild(document.body, script);
        this.videoEl.nativeElement.addEventListener('ended', this.stopPlaying.bind(this), false);
    }

    ngAfterViewInit() {
        this.videoUpload.valueChanges.subscribe(this.onFileSelect.bind(this));
    }

    ngOnDestroy() {
        this.videoEl.nativeElement.removeEventListener('ended', this.stopPlaying.bind(this), false);
        this.subs.unsubscribe();
        if (this.recorder) {
            this.recorder.destroy();
        }
    }

    onFileSelect(file: File | null) {
        if (!file) {
            return;
        }

        this.blob = file as Blob;
        this.objectURL = URL.createObjectURL(file);
        this.state = VideoRecordingState.uploaded;
        this.extension = file.name.slice(file.name.lastIndexOf('.') + 1);
        this.onTouchFn();
        this.onChangeFn(file);
        this.setMedia();
    }

    private onGetMediaSuccess(stream: MediaStream): void {
        this.stream = stream;
        this.state = VideoRecordingState.recording;
        this.requesting = false;

        const mimeTypes = [
            'video/webm;codecs=h264',
            'video/webm;codecs=vp8',
        ];
        // select mimeType to use
        for (const type of mimeTypes) {
            if (MediaRecorder.isTypeSupported(type)) {
                this.mimeType = type;
                break;
            }
        }
        this.recorder = new RecordRTC(stream, {
            type: 'video',
            mimeType: this.mimeType,
            disableLogs: true,
        });

        this.renderer.setProperty(this.videoEl.nativeElement, 'autoplay', true);
        this.renderer.setProperty(this.videoEl.nativeElement, 'srcObject', stream);
        this.renderer.setProperty(this.videoEl.nativeElement, 'volume', 0);
        this.recorder.startRecording();

        this.counter = 0;
        this.durationIntv = window.setInterval(() => this.counter++, 1000);

        this.cdRef.detectChanges();
    }

    public startRecord(): void {
        this.requesting = true;
        const fallback = (errMessage = "Couldn't initialize video renderer") => {
            this.notifications.display(new Notification({title: "Couldn't record", message: errMessage}));
            this.requesting = false;
        };

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            fallback();
            return;
        }

        navigator.mediaDevices.getUserMedia({
            video: {
                width: {max: 1280, ideal: 1280},
                height: {max: 720, ideal: 720},
                frameRate: {ideal: 30, max: 60, min: 24}
            },
            audio: true
        })
            .then((stream: MediaStream) => this.onGetMediaSuccess(stream))
            .catch((err: MediaStreamError) => {
                if (err.name === 'NotAllowedError') {
                    fallback('Please enable access to your camera and microphone');
                } else {
                    fallback(err.message);
                }
            });
    }

    public stopRecord(): void {
        this.state = VideoRecordingState.recorded;
        clearInterval(this.durationIntv);
        this.durationIntv = null;
        this.stream.getTracks().forEach(t => t.stop());
        this.stream = null;
        this.recorder.stopRecording(() => {
            const blob = this.recorder.getBlob();
            this.renderer.setProperty(this.videoEl.nativeElement, 'srcObject', null);
            RecordRTC.getSeekableBlob(blob, newBlob => {
                this.blob = newBlob;
                this.extension = this.mimeType.split(';')[0].split('/')[1];
                this.objectURL = URL.createObjectURL(newBlob);
                this.onTouchFn();
                this.onChangeFn(new File([blob], `video.${this.extension}`, {type: this.mimeType}));
                this.setMedia();
            });
        });
    }

    private async setMedia() {
        try {
            if (!this.blob) {
                this.duration = 0;
            } else {
                this.duration = Math.round(await getBlobDuration(this.blob) * 100) / 100;
            }
        } catch (e) {
            this.duration = 0;
        }

        this.renderer.setProperty(this.videoEl.nativeElement, 'autoplay', false);
        this.renderer.setAttribute(this.videoEl.nativeElement, 'src', this.objectURL);
        this.renderer.setProperty(this.videoEl.nativeElement, 'volume', 1);
        this.onDataChange.emit({
            duration: this.duration,
            extension: this.extension,
        });
    }

    play(): void {
        this.videoEl.nativeElement.play().then(() => {
            this.prevState = this.state;
            this.state = VideoRecordingState.playing;
        });
        this.cdRef.detectChanges();
    }

    public stopPlaying(): void {
        this.prevState = this.state;
        this.state = VideoRecordingState.recorded;
        this.videoEl.nativeElement.pause();
        this.cdRef.detectChanges();
    }

    writeValue(file: File): void {
        this.videoUpload.setValue(file);
    }

    registerOnChange(fn: any): void {
        this.onChangeFn = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouchFn = fn;
    }

    setDisabledState?(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    removeVideo() {
        this.duration = 0;
        this.extension = '';
        this.onDataChange.emit({
            duration: 0,
            extension: '',
        });
        this.onChangeFn(null);
        this.counter = 0;
        this.objectURL = '';
        this.renderer.setAttribute(this.videoEl.nativeElement, 'src', '');
        this.renderer.setProperty(this.videoEl.nativeElement, 'srcObject', null);
        this.blob = null;
        // this.uploadButton.reset();
        this.state = VideoRecordingState.initial;
    }
}
