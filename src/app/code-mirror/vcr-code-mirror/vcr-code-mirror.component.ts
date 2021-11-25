import { VirtualClassRoomComponent } from '../../class-room/virtual-class-room/virtual-class-room.component';
import { PopoverTooltipDirective } from '../../common/directives/popover-tooltip';
import { loadScript } from '../../lib/core/utils';
import { Component, ElementRef, EventEmitter, HostBinding, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SocketEvent, SocketService, SocketServiceHandler } from '../../lib/core/socket';
import { saveAs } from 'file-saver';
import { VCRModule } from '../../class-room/class-room.module';
import { Ace as ace } from 'ace-builds';
import { Auth, Backend, VCRCodeBackend } from 'app/lib/core/auth';
import { User } from 'app/models';
import { NotificationsService } from 'app/services/notifications';

@Component({
    selector: 'learnt-vcr-code-mirror',
    templateUrl: './vcr-code-mirror.component.html',
    styleUrls: ['./vcr-code-mirror.component.scss']
})
export class VcrCodeMirrorComponent implements VCRModule, OnInit, OnDestroy, SocketServiceHandler {

    public theme: 'dark' | 'light' = 'dark';
    public language = 'javascript';

    public languages: string[] = [
        'javascript', 'coffee', 'css', 'json', 'php', 'xml',
        'markdown', 'golang', 'html', 'java', 'jsp', 'swift',
        'perl', 'lua', 'ini', 'closure'
    ];

    @ViewChild('selectLang', {read: PopoverTooltipDirective})
    public popover: PopoverTooltipDirective;

    @ViewChild('coding')
    public coding: ElementRef;

    private editor: ace.Editor;

    private releaseEditor: any;
    public editorReadonly: boolean;

    readonly ready: EventEmitter<boolean> = new EventEmitter();

    me: User;

    backend: VCRCodeBackend;

    editorReady = false;
    observerMode = false;

    @HostBinding('style.pointerEvents') get isObserver(): string { return this.observerMode ? 'none' : 'auto'; }

    constructor(private vcr: VirtualClassRoomComponent,
                private auth: Auth,
                private notifications: NotificationsService,
                backend: Backend,
                @Inject(SocketService) private socket: SocketService,
                @Inject('room') private room: any) {
        this.backend = backend.getVcrCodeBackend(room._id)
        auth.me.subscribe(me => this.me = me);
        socket.register('vcr.code', this)
    }

    ngOnInit() {}

    ngOnDestroy() {
        this.socket.unregister(this)
    }

    private setupEditor(): Promise<void> {

        if (this.editorReady) {
            return Promise.resolve();
        }

        const scripts = [
            'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.11/ace.js',
            'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.11/theme-monokai.min.js',
        ];

        return new Promise((resolve, reject) => {
            // How to : https://ace.c9.io/#nav=howto
            loadScript(scripts, () => {
                if (!window.ace) {
                    return reject('No ace editor');
                }
                this.editor = window.ace.edit(this.coding.nativeElement) as ace.Editor;
                this.editor.setFontSize('14');

                this.changeTheme('dark');
                this.changeLanguage('javascript');

                this.editor.setShowPrintMargin(false);

                this.editor.on('input', () => {

                    if (this.editorReadonly) {
                        return;
                    }

                    this.socket.send('vcr.code.sync', {
                        room: this.room._id,
                        code: this.editor.getValue(),
                    });

                    this.release()
                });

                this.editorReady = true;

                resolve();
            });
        });
    }

    public setup(vcr: VirtualClassRoomComponent): void {
        this.observerMode = vcr.isObserverMode();

        vcr.menu.init({
            'save': {
                label: 'Download code',
                parent: 'file',
                handler: () => saveAs(new Blob([this.editor.getValue()], {type: 'text/plain'}), 'code.txt')
            }
        });

        this.setupEditor().then(() => {

            this.backend.getContents().subscribe(
                contents => {

                    if (contents.value) {
                        this.editor.getSession().setValue(contents.value);
                    }

                    if (contents.settings && contents.settings.theme) {
                        this.changeTheme(contents.settings.theme, false);
                    }

                    if (contents.settings && contents.settings.language) {
                        this.changeLanguage(contents.settings.language, false)
                    }

                    this.ready.next()
                },
                (error) => {
                    this.ready.next()
                }
            );
        }).catch((error) => {
            this.ready.error(error);
        })
    }

    onSocketEvent(event: SocketEvent) {
        if (!this.editor) {
            return;
        }

        if (event.type === 'vcr.code.sync') {

            this.setEditorReadonly(true)

            if (event.data.has("code")) {
                this.editor.getSession().setValue(event.data.get("code"));
            }

            if (event.data.has('theme')) {
                this.changeTheme(event.data.get('theme'), false);
            }

            if (event.data.has('language')) {
                this.changeLanguage(event.data.get('language'), false);
            }
        }

        if (event.type === 'vcr.code.release') {
            this.setEditorReadonly(false)
        }
    }

    public changeTheme(theme: 'dark' | 'light', notify?: boolean): void {

        this.theme = theme;

        this.editor.setTheme(`ace/theme/${(theme === 'dark') ? 'monokai' : 'clouds'}`);

        if (notify) {

            this.socket.send('vcr.code.sync', {
                room: this.room._id,
                theme: theme,
            });

            this.release();
        }
    }

    public changeLanguage(language: string, notify?: boolean): void {
        this.language = language;
        this.editor.getSession().setMode(`ace/mode/${language}`);
        this.popover.hide();

        if (notify) {

            this.socket.send('vcr.code.sync', {
                room: this.room._id,
                language: language,
            });

            this.release();
        }
    }

    release() {

        if (this.releaseEditor) {
            clearTimeout(this.releaseEditor);
        }

        this.releaseEditor = setTimeout(() => {
            this.socket.send('vcr.code.release', {
                room: this.room._id,
            });
        }, 3000)
    }

    setEditorReadonly(readonly: boolean) {

        if (readonly == this.editorReadonly) {
            return;
        }

        this.editorReadonly = readonly;
        this.editor.setOption("readOnly", readonly)

        this.notifications.notify('Editor mode', readonly ? 'Editor in readonly mode' : 'Editor readonly disabled','', 2000)
    }
}
