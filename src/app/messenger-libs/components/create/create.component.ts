import {LocalStorageBind} from '../../../lib/core/common/lcprop';
import {Backend} from '../../../lib/core/auth';
import {MessengerService} from '../../core/messenger.service';
import {EnterMode} from '../settings/settings.component';
import {
    Component,
    Renderer2,
    ViewChild,
    ComponentRef,
    ViewContainerRef,
    OnInit,
    OnDestroy,
    ChangeDetectorRef,
    TemplateRef,
    ElementRef,
    Input,
    ApplicationRef,
    ComponentFactoryResolver, AfterViewInit
} from '@angular/core';
import {Media} from '../../../lib/core/media';
import {Thread} from '../../core/models';
import {Subscription} from 'rxjs/Subscription';
import { first } from 'rxjs/operators';
import {PopoverBoxComponent, PopoverDirection} from '../../../common/popover-box/popover-box.component';
import {NotificationsService} from '../../../services/notifications';

@Component({
    selector: 'learnt-messenger-create',
    templateUrl: './create.component.html',
    styleUrls: [
        './create.component.scss',
        './create.component.mobile.scss',
        './create.component.desktop.scss'
    ]
})
export class MessengerCreateComponent implements OnInit, OnDestroy {

    @Input()
    mode: 'full' | 'small' = 'full';

    @Input()
    emoji = true;

    @Input()
    settings = true;

    public allowedMimeTypes: string[] = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', // allow images
        'application/pdf', 'application/msword', // allow PDFs and regular MSWord docs
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // allow 2007+ MSWord docs
        'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
        'application/vnd.ms-word.document.macroEnabled.12',
        'application/vnd.ms-word.template.macroEnabled.12',
    ];

    /**
     * Can send message trough thread flag
     * This is changed based on input value availability
     */
    canSend: boolean;

    /**
     * Is mobile
     */
    mobile: boolean;

    /**
     * Keep all subscription to be cleaned when component destroyed
     */
    subscriptions: Subscription[] = [];

    /**
     * Selected  thread
     */
    thread: Thread;

    /**
     * View stack index 0 - emoticons 1 - settings
     */
    popoverViewStackIndex = 0;

    /**
     * View stack with emoticons and settings dialog
     */
    @ViewChild('popovercontents')
    popoverViewStack: TemplateRef<any>;

    /**
     * Popover container
     */
    @ViewChild('popover', {read: ViewContainerRef})
    popoverContainer: ViewContainerRef;

    @ViewChild('input')
    input: ElementRef;

    /**
     * Popover containing a view stack with emoticons and settings
     */
    popover: ComponentRef<PopoverBoxComponent>;

    /**
     * What is happening if pressing on enter while writting a message
     */
    @LocalStorageBind('messenger-enter-mode')
    enterMode: string;

    /**
     * Message is currently sending
     */
    sending: boolean;

    constructor(private backend: Backend,
                private service: MessengerService,
                private media: Media,
                private renderer: Renderer2,
                private resolver: ComponentFactoryResolver,
                private appRef: ApplicationRef,
                private cd: ChangeDetectorRef,
                private notifications: NotificationsService) {

        this.canSend = false;
        this.mobile = !media.query('gt-sm');

        if (this.enterMode === undefined) {
            this.enterMode = 'send';
        }

        this.subscriptions.push(media.watch('gt-sm').subscribe(
            event => this.mobile = !event.active
        ));

        if (this.service.thread) {
            this.thread = this.service.thread;
        }

        this.subscriptions.push(service.threadChange.subscribe(
            thread => this.thread = thread
        ));

    }

    parseCommand() {

        if (!this.value) {
            return;
        }

        const raw = this.value.replace('&nbsp;', ' ');

        if (raw.indexOf('/message') !== -1) {

            const command = raw.split(' ');

            if (command.length < 3) {
                return;
            }

            command.shift(); // Remove command prefix

            const user = command.shift();
            const message = command.join(' ');

            if (message === '') {
                return;
            }

            this.backend.getUser(user).subscribe(
                user => {
                    this.service.createThread(
                        {body: message, type: 'text'},
                        user,
                    );
                },
                err => alert('User ' + user + ' not found!')
            );

            return true;
        }

        return false;
    }

    onInputKeyDown(event: KeyboardEvent) {
        if (event.key === "Enter") {
            if (event.ctrlKey || event.altKey) {
                event.preventDefault();
                return;
            }

            if (this.parseCommand()) {
                return;
            }

            if (event.shiftKey && this.canSend && this.enterMode==="break-line") {
                event.preventDefault();
                return this.send();
            }

            if (event.shiftKey && this.enterMode==="send"){
                return;
            }

            if (this.mobile || this.mode === 'small' || (this.enterMode === 'send' && this.canSend && this.thread)) {
                event.preventDefault();
                return this.send();
            }
        }
    }

    onInputKeyUp(event: KeyboardEvent) {
        this.canSend = (this.value !== '');
    }

    onSubmitClick(event: MouseEvent) {
        this.send();
    }

    send() {
        if (this.value.trim() === '') {
            return;
        }

        this.sending = true;
        this.service.send(this.thread, {body: this.value, type: 'text'}).pipe(first()).subscribe(() => {
            this.value = '';
            this.sending = false;
            setTimeout(() => this.input.nativeElement.focus());
        });
    }

    onSettingsChange(mode: EnterMode) {
        this.backend.setMsgStatus(mode).pipe().subscribe(() => {
            this.enterMode = mode;
        });
        this.enterMode = mode;
    }

    onEmojiSelect(emoji: string) {
        if (typeof emoji !== 'string') {
            return;
        }

        const input = <HTMLTextAreaElement>this.input.nativeElement;
/*        if (/ngcontent/.test(input.innerHTML.trim())) {
            // we used an HTML hack for Firefox to bypass a weird styling issue of contenteditable divs
            // inserting an emoji after clicking the input will also send a text `<br _ngcontent-c14="">`
            input.innerHTML = '';
        }*/
        input.value += ':' + emoji + ':';
        input.focus();
        this.canSend = true;
    }

    showEmoticons(event: MouseEvent) {
        this.updatePopoverIndex(event, 0);
    }

    attachFile(event: MouseEvent) {
        const target: any = event.target;
        const files = target.files;
        if (!files || files.length === 0) {
            return;
        }
        const file: File = files[0];

        if (this.allowedMimeTypes.indexOf(file.type) < 0) {
            this.notifications.notify('Invalid file', 'Selected file is not allowed, please try again.', 'close');
            return;
        }

        this.service.upload(this.thread, file).subscribe();
    }

    showSettings(event: MouseEvent) {
        this.updatePopoverIndex(event, 1);
    }

    /**
     * Update popover index based on pressed button
     */
    updatePopoverIndex(event: MouseEvent, index: number) {
        event.stopPropagation();
        this.createPopover();
        this.popoverViewStackIndex = index;
        this.popover.changeDetectorRef.detectChanges();
        const render = this.renderer[(index ? 'add' : 'remove') + 'Class'].bind(this.renderer);
        render(this.popover.location.nativeElement, 'settings');
    }

    onPopoverCloseRequest() {
        this.popover.instance.destroy();
    }

    createPopover() {
        if (this.popover) {
            return;
        }

        // Create embedded view from ng-template
        const viewstack = this.popoverViewStack.createEmbeddedView(this);

        // create popover instance at runtime with view stack from ng-template
        const factory = this.resolver.resolveComponentFactory(PopoverBoxComponent);
        this.popover = this.popoverContainer.createComponent(factory, 0, null, [viewstack.rootNodes]);

        setTimeout(() => this.appRef.attachView(viewstack), 0);

        this.popover.instance.direction = <PopoverDirection>'top';
        this.popover.instance.loading = true;
        this.popover.instance.width=300;

        setTimeout(() => this.popover.instance.loading = false, 0);

        // listen for popover destory
        const popoverDestroySubscription = this.popover.instance.onDestroy.subscribe(() => {
            this.popover.destroy();
            this.popover = null;
            popoverDestroySubscription.unsubscribe();
        });
    }

    ngOnInit() {
        this.backend.getMsgStatus().subscribe((response) => {
            this.enterMode = String(response);
        })
    }

    ngOnDestroy() {
        for (const sub of this.subscriptions) {
            sub.unsubscribe();
        }

        this.subscriptions = [];
    }

    set value(value: string) {
        (<HTMLTextAreaElement>this.input.nativeElement).value = value;
    }

    get value(): string {
        return (<HTMLTextAreaElement>this.input.nativeElement).value;
    }
}
