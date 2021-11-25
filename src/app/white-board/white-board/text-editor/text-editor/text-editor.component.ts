import { Component, EventEmitter, ElementRef, OnInit, ViewChild, Inject } from '@angular/core';
import { loadScript } from 'app/lib/core/utils';
import { SocketService } from 'app/lib/core/socket';
import { VirtualClassRoomComponent } from 'app/class-room/virtual-class-room/virtual-class-room.component';

const LIB = 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.7.3/tinymce.min.js';

@Component({
    selector: 'learnt-text-editor',
    templateUrl: './text-editor.component.html',
    styleUrls: ['./text-editor.component.scss']
})
export class TextEditorComponent implements OnInit {

    readonly ready: EventEmitter<any> = new EventEmitter();

    @ViewChild('textarea')
    textarea: ElementRef;

    sendDataIntv: any;

    ignoreEventOnChangeValue: boolean;

    constructor(
        private vcr: VirtualClassRoomComponent,
        @Inject(SocketService) private socket: SocketService,
        @Inject('room') private room: any
    ) { }

    ngOnInit() {
        loadScript(LIB, () => {
            window['tinymce'].init({
                target: this.textarea.nativeElement,
                menubar: false,
                resize: false,
                plugins: [
                    'advlist autolink lists link image charmap print preview anchor textcolor',
                    'searchreplace visualblocks code fullscreen',
                    'insertdatetime media table contextmenu paste code help'
                ],
                // tslint:disable-next-line:max-line-length
                toolbar: 'insert | undo redo |  formatselect | bold italic backcolor  | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
                setup: (editor) => {

                    editor.on('init', (e) => {
                        this.setupEditorTitle();
                        editor.dom.doc.body.style.background = '#F3F3F3';
                        this.setupSocket(editor);
                        this.ready.next();
                    });

                    editor.on('change', e => {

                        if (this.ignoreEventOnChangeValue) {
                            return;
                        }

                        clearTimeout(this.sendDataIntv);
                        this.sendDataIntv = setTimeout(() => {
                            this.notifyChange(editor);
                        }, 300);
                    });
                }
            });
        });
    }

    setupSocket(editor) {
        this.socket.on('vcr.text.sync').subscribe(
            event => {

                if (event.data.text !== '') {
                    this.ignoreEventOnChangeValue = true;
                    editor.setContent(event.data.text);
                    setTimeout(() => {this.ignoreEventOnChangeValue = false; }, 300);
                }
            }
        );
    }

    notifyChange(editor) {
        this.socket.send('vcr.text.sync', {
            room: this.room._id,
            text: editor.getContent(),
        });
    }

    setupEditorTitle() {
        const toolbar = document.querySelector('.mce-toolbar').firstElementChild;
        const title = document.createElement('div');
        title.innerText = 'WordEditor';
        title.className = 'title';
        toolbar.insertBefore(
            title, toolbar.firstElementChild
        );
    }
}
