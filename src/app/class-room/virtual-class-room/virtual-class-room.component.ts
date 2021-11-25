import {
    Compiler,
    Component,
    ComponentFactory,
    ComponentFactoryResolver,
    ComponentRef,
    ElementRef,
    EventEmitter,
    HostBinding,
    HostListener,
    Inject,
    Injector,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AlertOptions, AlertRef, AlertService } from '@services/alerts';
import { LessonNotificationService } from '@services/lesson.notifications';
import { NotificationsService } from '@services/notifications';
import { DialogsFacade } from 'app/dialogs';
import { MicroEvents } from 'app/lib/core/common/events';
import _get from 'lodash-es/get';
import _has from 'lodash-es/has';
import { JoyrideService } from 'ngx-joyride';
import Peer from 'peerjs';
import { ROUTE_DASHBOARD } from 'routes';
import { Observable, timer } from 'rxjs';
import { first } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';
import { Auth, Backend } from '../../lib/core/auth';
import { Logger } from '../../lib/core/common/logger';
import { CanDeactivateComponent, CanDeactivateResponse } from '../../lib/core/guards';
import { SocketEvent, SocketEventData, SocketService, SocketServiceHandler } from '../../lib/core/socket';
import { User } from '../../models';
import { RoomData } from '../../models/room';
import { PreviewComponent } from '../../screen-share/preview/preview.component';
import { ClassRoomMenuComponent } from '../class-room-menu/class-room-menu.component';
import { VCRModule, VCRNgModule } from '../class-room.module';
import { ClassroomService } from '../services/classroom.service';
import { ModuleLoaderService } from '../services/module-loader.service';


export enum VcrModule {
    Sharescreen = 'sharescreen',
    Whiteboard = 'whiteboard',
    Word = 'word',
    Code = 'code'
}

const modmap: { [module: string]: () => Promise<any> } = {
    [VcrModule.Code]: () => import('../../code-mirror/code-mirror.module').then(m => m.CodeMirrorModule),
    [VcrModule.Word]: () => import('../../text-editor/text-editor.module').then(m => m.TextEditorModule),
    [VcrModule.Whiteboard]: () => import('../../white-board/white-board.module').then(m => m.WhiteBoardModule),
    [VcrModule.Sharescreen]: () => import('../../screen-share/screen-share.module').then(m => m.ScreenShareModule),
}

export enum VcrEvent {
    JOIN = 'vcr.join',
    JOIN_OK = 'vcr.join.ok',
    MODULE_CHANGE = 'vcr.module',
    LEAVE = 'vcr.leave',
    ENTER = 'vcr.enter',
    END = 'vcr.end',
    END_INCOMPLETE = 'vcr.end.incomplete',
    EXTEND_TIME = 'vcr.extend.time',
    EXTEND_TIME_ACCEPT = 'vcr.extend.time.accept',
    EXTEND_TIME_REJECT = 'vcr.extend.time.reject',
    WAIT = 'vcr.wait',
    WAIT_CANCEL = 'vcr.wait.cancel',
    PEER_CONNECTED = 'vcr.peer.connected',
    PEER_JOINED = 'vcr.peer.joined',
}

export enum DisplayMode {
    VideoAndChat,
    FullBoard = 2,
    FullVideo = 4,
}

@Component({
    selector: 'learnt-virtual-class-room',
    templateUrl: './virtual-class-room.component.html',
    styleUrls: ['./virtual-class-room.component.scss']
})
export class VirtualClassRoomComponent implements OnInit, OnDestroy, CanDeactivateComponent, SocketServiceHandler {

    // internal dto of virtual class room
    public roomData: RoomData;

    // conversation thread id
    public threadId: string;

    // currently connected user
    me: User;

    // active module name
    public moduleName: string;

    // indicator of module loading when using left side buttons
    public moduleLoading: boolean;

    // container where the loaded module will be compiled
    @ViewChild('moduleContainer', {read: ViewContainerRef, static: true})
    private moduleContainer: ViewContainerRef;

    // component ref of the loaded module for the VCR
    private moduleComponentRef: ComponentRef<any>;

    // VCR display mode:
    public displayMode: DisplayMode = 0;
    DisplayMode = DisplayMode;

    // indicator of only one participant being able to edit
    public editLocked: boolean;

    @ViewChild('menu', {read: ClassRoomMenuComponent, static: true})
    public menu: ClassRoomMenuComponent;
    
    private subs: Subscription = new Subscription();
    public readonly edit: EventEmitter<any> = new EventEmitter();
    private canLeave = true;

    /**
     * Keeps function to dismiss user waiting dialog
     */
    private userWaitingDismiss: ()=>void;

    /**
     * Keeps remote data for each module.
     * For example at key whiteboard hols
     * all he sessions with canvas data.
     *
     * This is provided at vcr.join.ok
     */
    remoteData: Map<string,any> = new Map()
    public durationInSecs: number;
    public isInstantSession: boolean;
    public timeRemaining = 0;
    private alertPopup: AlertRef;
    private lesson: any;
    private timeStart: any;
    private timeEnd: any;
    private alertCostTitle: string;
    private alertCostMessage: string;
    peer: Peer;
    
    @HostListener('mouseenter') onMouseenter() {
        this.elRef.nativeElement.classList.add('hover');
    }
    
    @HostListener('mouseleave') onMouseleave() {
        this.elRef.nativeElement.classList.remove('hover');
    }

    constructor(private injector: Injector,
                private route: ActivatedRoute,
                private auth: Auth,
                private logger: Logger,
                private router: Router,
                private dialogs: DialogsFacade,
                private backend: Backend,
                private moduleLoader: ModuleLoaderService,
                private alerts: AlertService,
                private notifs: NotificationsService,
                private componentFactoryResolver: ComponentFactoryResolver,
                private compiler: Compiler,
                @Inject('bus') private bus: MicroEvents,
                @Inject(SocketService) private socket: SocketService,
                private lessonNotifs: LessonNotificationService,
                private readonly joyrideService: JoyrideService,
                public classroomService: ClassroomService,
                private elRef: ElementRef) {
        if (!this.socket._connected) {
            this.socket.connect();
        }

        socket.register('vcr', this);
        socket.register('error', this);

        this.bus.on(VcrEvent.END, this.endSessionNow);
        this.bus.on(VcrEvent.WAIT, this.waitSessionAccept);
        this.bus.on(VcrEvent.WAIT_CANCEL, this.waitSessionCancel);
        this.me = this.route.snapshot.data.me;
    }

    ngOnInit(): void {
        this.joinRoom();
        
        this.subs.add(this.classroomService.onError.subscribe(([title, message]) => {
            this.notifs.notify(title, message);
        }));
        
        this.setMenuItems();
        this.setupIntercom();
        this.lessonNotifs.disableInstantSessionRequest();
    }
    
    ngOnDestroy(): void {
        this.socket.send("thread.unobserve", {thread: this.threadId})
        this.socket.unregister(this);
        if (this.peer) {
            this.peer.destroy();
        }
        this.lessonNotifs.enableInstantSessionRequest();
        this.bus.off('vcr.end', this.endSessionNow);

        // Remove intercom added class
        const ic = document.getElementById('intercom-container');

        if (ic) {
            const icframe = ic.querySelector('iframe');
            if (icframe) {
                icframe.classList.remove('intercom-frame-onclass')
            }
        }

        // Remove intercom messenger css style
        const styleToRemove = document.getElementById('intercomClassModifier');
        if (styleToRemove) {
            styleToRemove.remove();
        }
        this.subs.unsubscribe();
    }
    
    onSocketEvent(event: SocketEvent): void {
        const type = _get(event, 'type');
        const waiting = _get(event, 'data.waiting');
        switch (type) {
            case VcrEvent.JOIN_OK:
                if (waiting && typeof waiting === "number" && waiting > 0) {
                    this.userWaitingDismiss = this.dialogs.showUserWaited(null, waiting);
                }
                this.onRoomJoin(event.data);
                break;

            case VcrEvent.LEAVE:
                event.data.must("user", "keep_alive")
                this.backend.getUser(event.data.get("user")).subscribe(
                    user => {
                        this.userWaitingDismiss = this.dialogs.showUserWaiting(
                            user,
                            event.data.get("keep_alive")
                        );
                    }
                )
                break;

            case VcrEvent.ENTER:
                if (this.userWaitingDismiss) {
                    this.userWaitingDismiss();
                    this.userWaitingDismiss = null;
                }
                break;

            case VcrEvent.MODULE_CHANGE:
                if (this.roomData) {
                    this.setActiveModule(
                        event.data.get('name'),
                        this.remoteData.get(event.data.get('name'))
                    ).then(m => m).catch((err) => {
                        console.error(err);
                    });
                }
                break;

            case VcrEvent.END:
                this.canLeave = true;
                this.router.navigateByUrl(ROUTE_DASHBOARD);
                this.lessonNotifs.showSurvey()
                break;

            case VcrEvent.EXTEND_TIME: {

                this.alertPopup.dispose();
                const addTimeInSecs: number = event.data.get('time');

                if (addTimeInSecs == 0) {
                    this.alerts.alert('Time extension has been dismissed by the other party.');
                }
                else {
                    this.calculateCost(addTimeInSecs);

                    const alertOpts = {
                        lifetime: 0,
                        buttons: [{ label: 'Accept', result: true }, { label: 'Reject', result: false }],
                        closeButton: false
                    };
                    const alertMessage = this.alertCostMessage;
                    const alert = this.alerts.alert(this.alertCostTitle, alertMessage, alertOpts);
                    alert.result.subscribe(res => {

                        if (res) {
                            const newTimeEnd = new Date(this.timeEnd + (addTimeInSecs * 1000)).toISOString();

                            this.socket.send(VcrEvent.EXTEND_TIME_ACCEPT, {
                                room: this.roomData._id,
                                timeEnd: newTimeEnd,
                                user: this.me._id
                            });
                        }
                        else {
                            this.socket.send(VcrEvent.EXTEND_TIME_REJECT, {
                                room: this.roomData._id,
                                user: this.me._id
                            });
                        }

                        alert.dispose();
                    })
                }
                break;
            }

            case VcrEvent.EXTEND_TIME_ACCEPT: {
                this.alertPopup.dispose();

                const newTimeEnd: string = event.data.get('timeEnd');
                this.timeEnd = new Date(newTimeEnd).getTime();
                const timeNow = new Date().getTime();
                this.timeRemaining = (this.timeEnd - timeNow) / 1000;

                this.alerts.alert('Session has been extended.');
                break;
            }
            
            case VcrEvent.EXTEND_TIME_REJECT:
                this.alertPopup.dispose();
                this.alerts.alert('Time extension has been rejected by the other party.');
                break;
            
            case VcrEvent.PEER_JOINED: {
                this.onPeerJoined(event.data['data']);
                break;  
            }

            case 'error':
                if (event.data.get("event") == VcrEvent.JOIN) {
                    this.canLeave = true;
                    const a = this.alerts.alert('This class room no longer available. Redirecting to dashboard...', '', {lifetime: 2000, backdropClose: false})
                    a.result.subscribe(() => {
                        this.router.navigateByUrl(ROUTE_DASHBOARD);
                    })
                }
                break;
        }
    }

    @HostListener('window:beforeunload', ['$event'])
    unloadNotification(event: BeforeUnloadEvent) {
        console.log('beforunload called');
        if (!this.canLeave) {
            event.preventDefault();
            event.returnValue = true;
            return true;
        }
    }

    public canDeactivate(): CanDeactivateResponse {
        console.log('candeactivate called');
        if (this.canLeave) {
            return true;
        }

        return new Observable(subscriber => {
            const title = `Are you sure you want to leave the page?`;
            const message = `Refreshing or closing the page will end this classroom session. Are you sure you want to exit?`;
            const alertOpts: AlertOptions = {
                lifetime: 0,
                buttons: [{label: 'Yes', result: true}, {label: 'No', result: false}]
            };

            const alert = this.alerts.alert(title, message, alertOpts);
            alert.result.subscribe(result => {
                subscriber.next(result);
                alert.dispose();
            });
        });
    }

    private setMenuItems(): void {
        this.menu.add('view-full-whiteboard', {
            label: 'Full Whiteboard',
            parent: 'view',
            handler: () => this.setDisplayMode(2),
        });

        this.menu.add('view-full-video', {
            label: 'Full Video',
            parent: 'view',
            handler: () => this.setDisplayMode(4),
        });

        this.menu.add('help', {
            label: 'Help Center',
            parent: 'help',
        });

        this.menu.add('tour', {
            label: 'Take the tour',
            parent: 'help',
            handler: () => this.startTutorial(),
        });

        this.menu.lock();
    }

    /**
     * Setup intercom button styling for classroom
     * @private
     */
    private setupIntercom() {
        // Move intercom button to the left using a css class
        const ic = document.getElementById('intercom-container');

        if (ic) {
            const icframe = ic.querySelector('iframe');
            if (icframe) {
                icframe.classList.add('intercom-frame-onclass')
            }
        }

        // Create custom css style for the intercom messenger
        const style = document.createElement('style');
        style.id = 'intercomClassModifier';
        style.innerHTML = `.intercom-messenger-frame{ left: 20px!important; }`;
        document.head.appendChild(style);
    }

    public startTutorial(): void {
        this.joyrideService.startTour({ steps: ['chats', 'whiteboard', 'texteditor',  'codeeditor', 'sharescreen']});
    }

    public endSession(): void {
        this.canLeave = true;

        const alertOpts = {lifetime: 0, buttons: [{label: 'Yes', result: true}, {label: 'No', result: false}]};
        const alertMessage = 'Are you sure you want to exit the room?';
        const alert = this.alerts.alert('Exit virtual classroom', alertMessage, alertOpts);

        alert.result.subscribe(res => {

            if (res === true) {
                this.endSessionNow();
            }

            alert.dispose();
        });
    }

    public endSessionNow = () => {
        this.canLeave = true;
        if (this.userWaitingDismiss == null) {
            this.socket.send(VcrEvent.END, {room: this.roomData._id});
        } else {
            this.socket.send(VcrEvent.END_INCOMPLETE, {room: this.roomData._id});
        }
        
        this.router.navigateByUrl(ROUTE_DASHBOARD);
    }

    public waitSessionAccept = () => {
        this.socket.send(VcrEvent.WAIT, {user: this.me._id, room: this.roomData._id});
    }

    public waitSessionCancel = () => {
        this.canLeave = true;
        this.socket.send(VcrEvent.WAIT_CANCEL, {user: this.me._id, room: this.roomData._id});
        this.router.navigateByUrl(ROUTE_DASHBOARD);
    }

    /**
     * @param data
     */
    private async onRoomJoin(data: SocketEventData): Promise<void> {
        this.canLeave = false;
        this.classroomService.createPeer();
        
        try {
            data.must('room', 'room._id', 'room.thread')
        } catch (e) {
            this.logger.error(e.message);
            return;
        }

        this.roomData = _get(data, 'data.room')
        // this.accessToken = _get(data, 'data.token', '');

        this.threadId = _get(data, 'data.room.thread');
        if (this.isObserverMode()) {
            this.socket.send("thread.observe", {thread: this.threadId})
        }
        
        const moduleName: string = _get(data, 'data.module','');

        this.lesson = _get(data, 'data.room.lesson');
        const strTimeStart: string = _get(data, 'data.room.lesson.starts_at', '');
        const strTimeEnd: string = _get(data, 'data.room.lesson.ends_at', '');
        this.timeStart = new Date(strTimeStart).getTime();
        this.timeEnd = new Date(strTimeEnd).getTime();
        const timeNow = new Date().getTime();
        this.timeRemaining = (this.timeEnd - timeNow) / 1000;
        this.isInstantSession = this.lesson.type == 2;

        if(this.isInstantSession) {
            timer(1000, 1000).subscribe(() => {
                this.durationInSecs = new Date().getTime() - new Date(strTimeStart).getTime();
            });
        }

        if (moduleName) {
            this.remoteData.set(moduleName, _get(data, `data.${moduleName}`));
            await this.setActiveModule(moduleName, this.remoteData.get(moduleName)).catch((err) => {
                console.error(err);
            });
        }
        
        this.subs.add(this.classroomService.peer$.subscribe(peer => {
            if (peer) {
                console.log('peer conneceted', peer.id)
                this.peer = peer;
                this.socket.send(VcrEvent.PEER_CONNECTED, {room: this.roomData._id, id: peer.id});
            }
        }));
    }

    public setDisplayMode(mode: number): void {
        this.displayMode = mode;
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
            window.dispatchEvent(new Event('resize'));
        }, 50);
    }

    public onChangeModule(name: string) {
        if (this.moduleName === name || this.isObserverMode()) return;
        this.setActiveModule(name, null, true).catch(
            (error) => {
                throw new Error(error);
            }
        );
    }

    public setActiveModule(name: string, remoteData?: any, emit?:boolean): Promise<VCRModule> {
        this.logger.info('VCR: Changing module to ' + name);
        this.moduleLoading = true;
        return new Promise<VCRModule>((resolve, reject) => {
            if (this.moduleName === name) {
                reject();
            }

            if (!_has(modmap, name)) {
                name = 'whiteboard';
            }

            if (this.moduleName !== name) {
                this.moduleName = name;
            }
            this.moduleContainer.clear();

            if (emit) {
                this.socket.send(VcrEvent.MODULE_CHANGE, {
                    room: this.roomData._id,
                    name: name,
                    user: this.me._id
                });
            }

            modmap[name]().then(
                (moduleType: any) => {

                    const injector = Injector.create({
                        providers: [
                            { provide: 'room', useValue: this.roomData },
                            { provide: 'remoteData', useValue: remoteData },
                        ],
                        parent: this.injector
                    });

                    this.compiler.compileModuleAndAllComponentsAsync(
                        moduleType
                    ).then(
                        response => {

                            const modRef = response.ngModuleFactory.create(injector);
                            const vcrMod: VCRNgModule = modRef.instance as any
                            const cmpFactory: ComponentFactory<VCRModule> = vcrMod.getVCREntryComponentFactory();
                            const cmpRef = this.moduleContainer.createComponent(cmpFactory, 0, injector)
                            this.moduleComponentRef = cmpRef;

                            const instance = cmpRef.instance;

                            if (instance.setup) {
                                console.log('Module setup')
                                instance.setup(this);
                            }

                            if (!instance.ready) {
                                throw new Error("Module must have ready: EventEmitter")
                            }

                            instance.ready.subscribe(

                                () => {
                                    console.log('Module ready')
                                    this.moduleLoading = false
                                    resolve(instance)
                                },

                                (error) => {
                                    console.log('Module load error', error)
                                    this.moduleLoading = false;
                                    reject(error);
                                }
                            );
                        }
                    ).catch(
                        error => {
                            throw new Error(error)
                        }
                    )
                }
            )
        });
    }

    private joinRoom(): void {
        this.route.params.pipe(first()).subscribe((params: Params) => {
            this.socket.send(VcrEvent.JOIN, {room: params.id});
        });
    }

    @HostBinding('class.fullboard')
    public get isFullBoard() {
        return this.displayMode === DisplayMode.FullBoard;
    }

    @HostBinding('class.fullvideo')
    public get isFullVideo() {
        return this.displayMode === DisplayMode.FullVideo;
    }

    toggleScreenSharing(): void {
        if (this.moduleComponentRef.instance instanceof PreviewComponent) {
            this.moduleComponentRef.instance.toggleSharing();
        }
    }

    handleCountDown(event) {

        if(event.action == 'notify') {
            const alertOpts = {
                lifetime: 0, 
                buttons: [
                    {label: '15 Minutes', result: 900}, 
                    {label: '30 Minutes', result: 1800}, 
                    {label: '1 Hour', result: 3600}, 
                    {label: 'Dismiss', result: 0}], 
                closeButton: false
            };
            const alertMessage = 'Do you want to extend this session? Please select below.';
            this.alertPopup = this.alerts.alert(`Time remaining is ${event.left < 60000 ? ((event.left / 1000) + ' seconds') : ((event.left / 60000) + ' minutes')}`, alertMessage, alertOpts);
            this.alertPopup.result.subscribe(timeExtensionSecs => {

                this.socket.send(VcrEvent.EXTEND_TIME, {
                    room: this.roomData._id,
                    time: timeExtensionSecs.toString(),
                    user: this.me._id
                });
     
                this.alertPopup.dispose();

                if(timeExtensionSecs !== 0) {

                    this.calculateCost(timeExtensionSecs);
                    const alertOpts = {lifetime: 0, buttons: [{label: 'Ok', result: true}], closeButton: false};
                    const alertMessage = this.alertCostMessage;
                    this.alertPopup = this.alerts.alert(this.alertCostTitle, alertMessage, alertOpts);

                    this.alertPopup.result.subscribe(() => {
                        this.alertPopup.dispose();
                    });
                }
            })
        }
    }

    private calculateCost(addTimeInSecs) {

        const tutorRate = this.lesson.rate;
        const durationInHrs = (this.timeEnd - this.timeStart) / 3600000;
        const originalCost = tutorRate * durationInHrs;
  
        const addTimeInHrs = addTimeInSecs / 3600;
        const additionalCost = tutorRate * addTimeInHrs;

        const totalCost = originalCost + additionalCost;

        this.alertCostTitle = (addTimeInSecs / 60) + ' Minutes Time Extension';
        this.alertCostMessage = 'Original Cost: ' + originalCost + ' &ensp;<b>|</b>&ensp; Additional Cost: ' + additionalCost + ' &ensp;<b>|</b>&ensp; Total Cost: ' + totalCost;
    }

    private onPeerJoined(data: {[k: string]: string}) {
        const otherUsers = Object.keys(data.peers).filter(id => id !== this.me._id);
        const peers = otherUsers.map(userId => data.peers[userId]);
        console.log('next peers', peers);
        this.classroomService.peers$.next(peers);
    }

    stopScreenSharing() {
        if (this.moduleName === 'screenshare') {
            (this.moduleComponentRef.instance as PreviewComponent).toggleSharing();
        }
    }

    /**
     * called by components in other modules
     */
    isObserverMode(): boolean {
        return this.me.isAdmin();
    }

    backToAdmin(): void {
        console.log('back to admin');
        this.canLeave = true;
        this.socket.send(VcrEvent.END, {room: this.roomData._id});
        this.router.navigateByUrl('/admin');
    }
}
