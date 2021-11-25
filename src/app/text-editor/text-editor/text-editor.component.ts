import { Component, ElementRef, EventEmitter, Inject, OnInit, ViewChild, OnDestroy, HostBinding } from '@angular/core';
import { VirtualClassRoomComponent } from 'app/class-room/virtual-class-room/virtual-class-room.component';
import { SocketService, SocketEvent, SocketServiceHandler } from 'app/lib/core/socket';
import { loadScript } from 'app/lib/core/utils';
import { saveAs } from 'file-saver';
import { VCRModule } from '../../class-room/class-room.module';
import { Subscription } from 'rxjs';
import { NotificationsService } from 'app/services/notifications';
import { Backend, VCRTextBackend } from 'app/lib/core/auth';

//https://www.codox.io/ ?
const LIB = 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.7.3/tinymce.min.js';

function setupEditorTitle(): void {
    const toolbar = document.querySelector('.mce-toolbar').firstElementChild;
    const title = document.createElement('div');
    title.innerText = 'WordEditor';
    title.className = 'title';
    toolbar.insertBefore(title, toolbar.firstElementChild);
}

@Component({
    selector: 'learnt-text-editor',
    templateUrl: './text-editor.component.html',
    styleUrls: ['./text-editor.component.scss']
})
export class TextEditorComponent implements VCRModule, SocketServiceHandler, OnInit, OnDestroy {

    public readonly ready: EventEmitter<boolean> = new EventEmitter();

    @ViewChild('textArea')
    textArea: ElementRef;

    /**
     * TinyMCE editor instance
     */
    private editor: any;

    private socketSubscription: Subscription;

    private releaseEditor: any;
    private editorReadonly: boolean;

    backend: VCRTextBackend;
    editorReady = false;
    observerMode = false;
    
    @HostBinding('style.pointerEvents') get isObserver() { return this.observerMode ? 'none' : 'auto'; }

    constructor(private vcr: VirtualClassRoomComponent,
                private notifications: NotificationsService,
                backend: Backend,
                @Inject(SocketService) private socket: SocketService,
                @Inject('room') private room: any) {
        this.backend = backend.getVcrTextBackend(room._id);
        socket.register('vcr.text', this);
    }

    public setup(vcr: VirtualClassRoomComponent): void {
        this.observerMode = vcr.isObserverMode();
        
        vcr.menu.init({
            'save': {
                label: 'Download text',
                parent: 'file',
                handler: () => {
                    saveAs(new Blob([this.editor.getContent()], {type: 'text/html'}), 'text.html');
                }
            }
        });

        this.loadEditor().then(() => {
            this.backend.getContents().subscribe(
                contents => {
                    
                    if (contents) {
                        this.editor.setContent(contents);
                    }

                    this.ready.next();
                }
            )
        }).catch((error) => {
            this.ready.error(error);
        })
    }

    ngOnInit() {}

    loadEditor(): Promise<void> {

        if (this.editorReady) {
            return Promise.resolve();
        }        

        return new Promise((resolve, reject) => {

            loadScript(LIB, () => {

                if (!window['tinymce']) {
                    reject('Tinymce not defined')
                }
    
                window['tinymce'].init({
                    target: this.textArea.nativeElement,
                    menubar: false,
                    resize: false,
                    plugins: [
                        'advlist autolink lists link image charmap print preview anchor textcolor',
                        'searchreplace visualblocks code fullscreen',
                        'insertdatetime media table contextmenu paste code help'
                    ],
                    // tslint:disable-next-line:max-line-length
                    toolbar: 'insert | undo redo | formatselect fontselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
                    setup: (editor) => {

                        this.editor = editor;

                        editor.on('init', (e) => {
                            setupEditorTitle();
                            editor.dom.doc.body.style.background = '#F3F3F3';
                            resolve();
                        });

                        editor.on('keyup', () => this.onEditorChange());
                    }
                });
            });
        })
    }

    ngOnDestroy() {
        this.socket.unregister(this);
    }

    onEditorChange() {

        this.socket.send('vcr.text.sync', {
            room: this.room._id,
            text: this.editor.getContent(),
        });

        if (this.releaseEditor) {
            clearTimeout(this.releaseEditor);
        }

        this.releaseEditor = setTimeout(() => {
            this.socket.send('vcr.text.release', {
                room: this.room._id,
            });
        }, 3000)
    }

    onSocketEvent(event: SocketEvent) {
        switch(event.type) {
            case 'vcr.text.sync':
                if (event.data.get('text') !== '') {
                    this.setEditorReadonly(true)
                    this.editor.setContent(event.data.get('text'));
                }
                break;
            case 'vcr.text.release':
                this.setEditorReadonly(false)
                break;
        }
    }

    setEditorReadonly(readonly: boolean) {

        if (readonly == this.editorReadonly) {
            return;
        }

        this.editorReadonly = readonly;
        this.editor.setMode(readonly ? 'readonly' : 'design');

        this.notifications.notify('Editor mode', readonly ? 'Editor in readonly mode' : 'Editor readonly disabled','', 2000)
    }

}
