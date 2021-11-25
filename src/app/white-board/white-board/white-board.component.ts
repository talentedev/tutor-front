import {Session, DrawMode, ObjectRef} from '../core/session';
import {WhiteboardTab, WhiteboardTabsComponent} from '../whiteboard-tabs/whiteboard-tabs.component';
import {Logger} from '../../lib/core/common/logger';
import {
    Component,
    ElementRef,
    AfterViewInit,
    ViewChild,
    EventEmitter,
    OnInit,
    Inject,
    OnDestroy, HostBinding,
} from '@angular/core';
import {VirtualClassRoomComponent} from '../../class-room/virtual-class-room/virtual-class-room.component';
import {SocketService, SocketEvent} from '../../lib/core/socket';
import {User} from '../../models';
import {Auth, Backend, VCRWhiteboardBackend} from '../../lib/core/auth';
import {Subscription} from 'rxjs';
import FontFaceObserver from 'fontfaceobserver';
import {VCRModule} from '../../class-room/class-room.module';

type SessionData = {
    canvas: string[]
    name: string
}
type RemoteData = {
    sessions: SessionData[]
    active: number
}

@Component({
    selector: 'learnt-white-board',
    templateUrl: './white-board.component.html',
    styleUrls: ['./white-board.component.scss']
})
export class WhiteboardComponent implements VCRModule, OnInit, OnDestroy {

    public readonly ready: EventEmitter<boolean> = new EventEmitter();

    @ViewChild('tabs', {read: WhiteboardTabsComponent})
    private tabsComponent: WhiteboardTabsComponent;

    @ViewChild('boards')
    private boards?: ElementRef<HTMLDivElement>;

    public sessions: Session[] = [];

    get session(): Session {
        return this.sessions.find(s => s.isActive());
    }

    public selecting: boolean;
    public writing: boolean;
    public drawing: boolean;
    public drawingMode: DrawMode;

    public fontFamily = 'Times New Roman';
    public fontFamilies: string[] = ['Times New Roman', 'Pacifico', 'VT323', 'Quicksand', 'Inconsolata'];
    public fontSize = '14';
    public fontColor = '#000000';
    public fontBold: boolean;
    public fontItalic: boolean;
    public fontUnderline: boolean;

    public fontSizes: string[] = ['9', '10', '11', '12', '13', '14', '18', '20', '24', '36'];
    public borderSizes: number[] = new Array(9).fill(0).map((_, i) => i + 1);
    public borderStyles: any[] = [
        ['solid', [0]],
        ['dotted', [3]],
        ['dashed', [3, 9]],
    ];

    private editingTimeout: number;
    private doneTimeout: number;
    private ignoreEvent: boolean;

    me: User;

    private instantSession = false;
    private pristine = true;

    private _subs = new Subscription();

    private sessionNameIndex = 1;

    private backend: VCRWhiteboardBackend;
    private observerMode = false;

    @HostBinding('style.pointerEvents') get isObserver(): string { return this.observerMode ? 'none' : 'auto'; }

    constructor(private logger: Logger,
                private vcr: VirtualClassRoomComponent,
                @Inject(SocketService) private socket: SocketService,
                @Inject('room') private room: any,
                backend: Backend,
                @Inject('remoteData') private remoteData: RemoteData,
                private auth: Auth) {
        this.logger = logger.context('WhiteBoard');
        this.backend = backend.getVcrWhiteboard(room._id)
        this.onKeyDown = this.onKeyDown.bind(this);
    }

    ngOnInit() {
        this.auth.me.subscribe((u: User) => {
            this.me = u;
            document.addEventListener('keydown', this.onKeyDown);
            window.addEventListener('resize', this.onScreenResize);
            this._subs.add(this.socket.on('vcr.wb').subscribe(event => this.onSocketEvent(event)));
            setTimeout(() => this.preloadFonts(), 200);
            this.fetchRemoteObjects();
        });
    }

    /**
     * Load remote sessions and objects
     */
    fetchRemoteObjects() {

        type Session = {
            id: string
            name: string
            objects: any[];
        };

        this.backend.getObjects().subscribe(
            (response: {sessions: Session[], active: string}) => {
                response.sessions.forEach(item => {
                    const session = this.createNewSession(item.name, item.id);
                    item.objects.forEach(o => session.addObject(o))
                    session.render();
                });

                if (response.active) {
                    this.setActiveSession(response.active); 
                }
            }
        )
    }

    preloadFonts(): void {
        for (const font of this.fontFamilies) {
            if (font === 'Times New Roman') { continue; }
            (new FontFaceObserver(font))
                .load(() => console.log(`Preloaded font "${font}"`))
                .catch(() => console.log(`Couldn't preload font "${font}"`));
        }
    }

    ngOnDestroy() {
        document.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('resize', this.onScreenResize);
        this.session.clearCanvas();
        this._subs.unsubscribe();
    }

    public setup(vcr: VirtualClassRoomComponent): void {
        this.observerMode = vcr.isObserverMode();

        if (!(vcr && vcr.menu)) {
            return;
        }

        if (vcr.roomData && vcr.roomData.instant) {
            this.instantSession = true;
        }

        vcr.menu.init({
            'export': {
                label: 'Export current board as image',
                parent: 'file',
                handler: () => this.session.saveAs(`Export of ${this.session.name}.png`),
            },

            'edit': {
                label: 'Edit',
                position: 1,
            },

            'undo': {
                label: 'Undo',
                parent: 'edit',
                disabled: () => this.session && !this.session.history.canUndo,
                handler: () => this.session.history.undo(),
            },

            'cut': {
                label: 'Cut',
                parent: 'edit',
                disabled: () => this.session && !this.session.hasSelectedObjects,
                handler: () => this.session.cut(),
            },

            'copy': {
                label: 'Copy',
                parent: 'edit',
                disabled: () => this.session && !this.session.hasSelectedObjects,
                handler: () => this.session.copy(),
            },

            'paste': {
                label: 'Paste',
                parent: 'edit',
                disabled: () => {
                    if (!this.session) {
                        return true;
                    }
                    return !this.session.clipboard;
                },
                handler: () => this.session.paste(),
            },
        });

        setTimeout(() => this.ready.next());
    }

    undo() {
        this.session.history.undo();
        this.socket.send('vcr.wb.undo', {
            room: this.room._id,
            session: this.session.id,
        });
    }

    redo() {
        this.session.history.redo();
        this.socket.send('vcr.wb.redo', {
            room: this.room._id,
            session: this.session.id,
        });
    }

    createNewSession(name?:string, id?: string): Session {
        const enableDefaultDrawing = this.sessions.length === 0;
        const session = new Session(name ? name : "Name " + this.sessionNameIndex, id)
        this.sessions.push(session);
        this.setActiveSession(session)
        this.sessionNameIndex++;

        if (enableDefaultDrawing) {
            this.onCustomDrawing('free');
        }

        return session
    }

    removeSession(session: Session): void {
        session.destroy()
        let index = this.sessions.indexOf(session);
        this.sessions.splice(index, 1);
        if (this.sessions.length) {           
            this.setActiveSession()
        }
    }

    onRemoveSession(session:Session) {
        this.removeSession(session)
        this.socket.send('vcr.wb.remove', {
            room: this.room._id,
            session: session.id,
        });
    }

    onSocketEvent(event: SocketEvent) {

        switch(event.type) {
            case 'vcr.wb.create':
                this.createNewSession(event.data.get('name'), event.data.get('session'))
                break;
            case 'vcr.wb.active':
                this.setActiveSession(event.data.get('session'));
                break;
            case 'vcr.wb.remove':
                this.removeSession(this.sessions.find(s => s.id == event.data.get('session')))
                break;
            case 'vcr.wb.objects':
                event.data.must('session', 'object')
                switch (event.data.get('action')) {
                    case 'added':
                        this.backend.getObject(
                            event.data.get('session'),
                            event.data.get('object'),
                        ).subscribe((obj:any) => {
                            this.session.addObject(obj, event.data.get('object'))
                        })
                        break;

                    case 'removed':
                        this.session.removeObject(event.data.get('object'))
                        break;

                    case 'modified':
                        this.backend.getObject(
                            event.data.get('session'),
                            event.data.get('object'),
                        ).subscribe((obj:any) => {
                            this.session.modifyObject(obj)
                        })

                        break;
                }

                break;
            case 'vcr.wb.sync':
                this.fetchRemoteObjects();
                break;
        }
    }

    private setEvents(on: boolean): void {

        if (on && !this.session.awake) {
            throw new Error('Session must be awake to add events to it')
        }

        const events = {
            'drawn': this.activateSelectionMode,
            'text:editing:exited': this.activateSelectionMode,
            'object:added': this.onCanvasObjectAdded,
            'object:modified': this.onCanvasObjectModified,
            'object:removed': this.onCanvasObjectRemoved,
        };

        for (const event in events) {
            this.session[on ? 'on' : 'off'](event, events[event]);
        }
    }

    private onCanvasObjectAdded = (o: ObjectRef) => {
        this.backend.addObject(this.session.id, o).subscribe()
    }

    private onCanvasObjectModified = (o: ObjectRef) => {
        this.backend.modifyObject(this.session.id, o.id, o).subscribe()
    }

    private onCanvasObjectRemoved = (o: ObjectRef) => {
        this.backend.removeObject(
            this.session.id,
            o.id,
        ).subscribe()
    }

    private onKeyDown(event: KeyboardEvent): void {
        switch (event.code) {
            case 'Backspace':
                event.stopPropagation();
                this.session.deleteSelectedObjects();
                break;

            case 'KeyA':
                if (event.ctrlKey || event.metaKey) {
                    this.activateSelectionMode();
                    event.stopPropagation();
                    event.preventDefault();
                    this.session.selectAll();
                }
                break;
        }
    }

    setActiveSession(item?: Session | string | number) {

        let index = this.sessions.length - 1;

        if (item instanceof Session) {
            index = this.sessions.indexOf(item);
        }

        if (typeof item === 'string') {
            index = this.sessions.findIndex(s => s.id == item)
        }

        if (typeof item === 'number') {
            index = item;
        }
        
        if (!this.sessions[index]) {
            throw new Error('Unknown index to activate')
        }

        if (this.sessions[index].isActive()) {
            return;
        }

        if (this.drawing && this.session) {
           this.session.setDrawing(true, this.drawingMode);
        }

        if (this.session) {
            // Remove events for current session
            this.setEvents(false);
        }

        // update sessions for setting active one
        this.sessions.forEach((s, i) => s.setActive(i === index))

        this.socket.send('vcr.wb.active', {
            room: this.room._id,
            session: index,
        });

        // update dom with current canvas
        this.setSessionElements()

        // add events for active session
        this.setEvents(true);
    }

    /**
     * Set current session canvas elements
     */
    setSessionElements() {
        this.onScreenResize();
        this.boards.nativeElement.innerHTML = '';
        this.session.elements.forEach(e => this.boards.nativeElement.appendChild(e));
    }

    onSessionChange(session: Session): void {
        this.setActiveSession(session);
    }

    private canvasTxID = 0;

    public onSessionRename(session: Session) {
        this.socket.send('vcr.wb.name', {
            room: this.room._id,
            session: session.id,
            name: session.name,
        });
    }

    public onSessionCreate() {
        const session = this.createNewSession()
        this.socket.send('vcr.wb.create', {
            room: this.room._id,
            session: session.id,
            name: session.name,
        });
    }

    private setState(selecting: boolean | number, drawing: boolean | number, writing: boolean | number): void {
        this.selecting = Boolean(selecting);
        this.drawing = Boolean(drawing);
        this.writing = Boolean(writing);
        this.session.setWriteMode(Boolean(writing));
        this.session.setDrawing(Boolean(drawing));
    }

    public activateSelectionMode = (): void => {
        this.setState(1, 0, 0);
    }

    public changeFillColor(color: string): void {
        this.session.setFillColor(color);
    }

    public changeLineColor(color: string): void {
        this.session.setLineColor(color);
    }

    public changeStrokeWidth(width: number): void {
        this.session.setStrokeWidth(parseInt('' + width, 10));
    }

    public changeStrokeDashArray(strokeDashArray: any): void {
        this.session.setStrokeDashArray(strokeDashArray.split(','));
    }

    public changeFontSize(size: string): void {
        this.fontSize = size;
        this.session.setFontSize(parseInt(size, 10));
    }

    public changeFontColor(color: string): void {
        this.fontColor = color;
        this.session.setFontColor(color);
    }

    public changeFontStyle(style: string): void {
        let state = false;
        switch (style) {
            case 'bold':
                this.fontBold = !this.fontBold;
                state = this.fontBold;
                break;
            case 'italic':
                this.fontItalic = !this.fontItalic;
                state = this.fontItalic;
                break;
            case 'underline':
                this.fontUnderline = !this.fontUnderline;
                state = this.fontUnderline;
                break;
        }

        this.session.setFontStyle(style, state);
    }

    public onCustomDrawing(mode: DrawMode): void {
        this.setState(0, 1, 0);
        this.drawingMode = mode;
        this.session.setWriteMode(false);
        this.session.setDrawing(true, mode);
        this.logger.info('Set session mode to ' + mode);
    }

    public write(): void {
        this.setState(0, 0, 1);
        this.session.setWriteMode();
    }

    public onDrawingClick(): void {
        this.setState(0, 1, 0);
        this.drawingMode = 'free';
        this.session.setDrawing(true);
    }

    private onScreenResize = (): void => {

        const rect = (<HTMLDivElement>this.boards.nativeElement).getBoundingClientRect();

        if (rect.width === 0 || rect.height === 0) {
            setTimeout(() => this.onScreenResize(), 50);
            return;
        }

        this.sessions.forEach(s => s.resize(rect.width, rect.height))
    }

    public changeFont(fontFamily: any): void {
        this.fontFamily = fontFamily;
        this.session.setFontFamily(fontFamily);
    }
}
