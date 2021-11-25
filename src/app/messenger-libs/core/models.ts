import { User } from 'app/models';
import * as moment from 'moment';
import { Observable } from 'rxjs/Observable';
import { Hydratable, HydrateProperty } from '../../lib/core/hydratable';
import { Emoji, EmojiService } from '../../services/emoji';
import _get from 'lodash-es/get';

function formatTime(time: moment.Moment): string {

    const t = moment(time);
    const now = moment();

    if (now.diff(t, 'hours') < 5) {
        return t.fromNow();
    }

    if (t.isSame(now, 'day')) {
        return t.format('hh:mm A');
    }

    if (t.isSame(now, 'month')) {
        return t.format('D hh:mm A');
    }

    if (t.isSame(now, 'year')) {
        return t.format('MMM D hh:mm A');
    }

    return t.format('lll');
}

//
// ----------- MODELS -----------
//

export declare interface SidePlaceholder {
    setTutorId(id: string);

    onShow(): void;

    onHide(): void;
}

export declare interface MessageInterface {
    type: 'text' | 'file' | 'notification';
    body: string | File;
}

export class File extends Hydratable {

    @HydrateProperty()
    key: string;

    @HydrateProperty()
    name: string;

    @HydrateProperty()
    mime: string;

    @HydrateProperty()
    size: number;

    @HydrateProperty()
    url: string;

    @HydrateProperty()
    _id: string;

    @HydrateProperty()
    added_to_library: boolean;

    @HydrateProperty()
    expire: string;


    constructor(raw?: any) {
        super();
        if (raw) {
            this.hydrate(raw);
        }
    }

    public get humanSize(): string {
        let i = -1;
        let size: number = this.size;
        const byteUnits: string[] = [' kB', ' MB', ' GB', ' TB', ' PB', ' EB', ' ZB', ' YB'];
        do {
            size = size / 1024;
            i++;
        } while (size > 1024);

        return Math.max(size, 0.1).toFixed(1) + byteUnits[i];
    }

    public get mimeCategory(): string {
        if (this.mime.indexOf('/') === -1) {
            return this.mime;
        }
        return this.mime.split('/')[0];
    }
}

export class MessageData extends Hydratable {
    @HydrateProperty()
    type: number;

    @HydrateProperty()
    title: string;

    @HydrateProperty()
    content: string;

    @HydrateProperty()
    data: any;
}

export class Message extends Hydratable implements MessageInterface {

    @HydrateProperty()
    _id: string;

    @HydrateProperty(User)
    sender: User;

    @HydrateProperty()
    thread: string;

    @HydrateProperty()
    type: 'text' | 'file' | 'notification';

    @HydrateProperty()
    body: any | File;

    @HydrateProperty(MessageData)
    data: MessageData;

    @HydrateProperty()
    seen: string[];

    @HydrateProperty('moment')
    time: moment.Moment;

    static Encode(s: string): string {
        const buf: string[] = [];
        for (let i = s.length - 1; i >= 0; i--) {
            buf.unshift(['&#', s[i].charCodeAt(0), ';'].join(''))
        }
        return buf.join('');
    }

    static Decode(s: string): string {
        return s.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
    }

    constructor(raw?: any) {
        super();

        if (raw) {
            this.hydrate(raw);

            if (raw.body && raw.type === 'file') {
                this.body = new File(raw.body);
            }
        }
    }

    get formattedTime(): string {
        return formatTime(this.time);
    }

    html(): string | File {
        if (this.type === 'file') {
            return '<FILE>';
        }

        if (!this.body) {
            return this.body;
        }

        return new Option(this.body.toString()).innerHTML;
    }

    public text(maxLen: number = 30): string {
        if (!this.body) { return '' }
        if (this.type == 'file') {
            return (this.body as any).name;
        }
        const doc = new DOMParser().parseFromString(this.body.toString(), 'text/html');
        const text = doc.body.textContent || doc.body.innerText || '';
        return (text.length > maxLen) ? text.substr(0, maxLen) + '...' : text;
    }

    public seenBy(user: User): boolean {
        if (!user) {
            throw new Error('User can\'t be blank');
        }

        if (!this.sender) {
            throw new Error('This message has no sender details');
        }

        if (this.sender._id === user._id) {
            return true;
        }

        this.seen = this.seen || [];
        return this.seen.indexOf(user._id) !== -1;
    }

    private replaceURLs(text: string): string {
        // tslint:disable-next-line:max-line-length
        const regexp: RegExp = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig;
        const matches: string[] = text.match(regexp);

        if (matches === null || matches === undefined || matches.length === 0) {
            return text;
        }

        for (const url of matches) {
            if (!url.startsWith('http')) {
                continue;
            }
            text = text.replace(url, `<a href="${url}" target="_blank">${url}</a>`);
        }

        return text;
    }

    private bodyWithEmojis(emojiService: EmojiService, replaceURLs?: boolean): any {
        if (this.type !== 'text') {
            return this.body;
        }

        if(this.body === null || this.body === undefined) {
            return this.body;
        }

        let messageBody = replaceURLs ? this.replaceURLs(this.body.toString()) : this.body.toString();

        const matches = messageBody.match(/:[a-z0-9+_-]+:/gi);

        if (!matches || matches.length === 0) {
            return messageBody;
        }

        matches.filter((x, i) => matches.indexOf(x) === i);
        for (const match of matches) {
            const emoticon = match.substring(1, match.length - 1);
            if (!emojiService.isEmoji(emoticon)) {
                continue;
            }

            messageBody = messageBody.replace(
                match,
                `<img src="${EmojiService.ImageLink(emoticon)}" class="emoji" data-emoji="${emoticon}" width="22" height="22"/>`
            );
        }

        return messageBody;
    }

    public bodyFormatted(emojiService: EmojiService, replaceURLs: boolean = true): Observable<any> {
        return new Observable<any>(obs => {
            emojiService.emojis.subscribe((emoji: Emoji[]) => {
                obs.next(this.bodyWithEmojis(emojiService, replaceURLs));
                obs.complete();
            })
        });
    }
}

export class Thread extends Hydratable {

    @HydrateProperty()
    _id: string;

    @HydrateProperty()
    name: string;

    @HydrateProperty(User)
    creator: User;

    @HydrateProperty(Message)
    message: Message;

    @HydrateProperty(User, true)
    participants: User[];

    @HydrateProperty('moment')
    time: moment.Moment;

    @HydrateProperty()
    meta: any;

    @HydrateProperty('moment')
    message_time: moment.Moment;

    constructor(raw: any, private me: User) {
        super();
        if (raw) {
            this.hydrate(raw);
        }
    }

    get other(): User {
        const participants = this.participants || [];
        for (let i = 0; i < participants.length; i++) {
            if (participants[i]._id !== this.me._id) {
                return participants[i];
            }
        }
    }

    getOtherProperty(path: string, elseReturn: any): any {
        const other = this.other;
        if (other) {
            return _get(other, path, elseReturn);
        }
        return elseReturn;
    }

    private formatedTime: string;

    get formattedTime(): string {

        if (this.formatedTime) {
            return this.formatedTime;
        }

        this.formatedTime = formatTime(this.message_time);

        return this.formatedTime;
    }

    get isRoomConversation() {
        return this.meta && this.meta.lesson;
    }

    get isRoomInstant() {
        return this.isRoomConversation && this.meta.instant;
    }

    private headlineWithEmojis(emojiService: EmojiService): string {
        if (this.message.type === 'file') {
            return '<em>sent a file</em>'
        }

        let messageBody = this.message.text();

        const url = 'https://cdnjs.cloudflare.com/ajax/libs/emojify.js/1.1.0/images/basic/';
        const matches = messageBody.match(/:[a-z0-9+_-]+:/gi);

        if (!matches || matches.length === 0) {
            return messageBody;
        }

        matches.filter((x, i) => matches.indexOf(x) === i);
        for (const match of matches) {
            const emoticon = match.substring(1, match.length - 1);
            if (!emojiService.isEmoji(emoticon)) {
                continue;
            }

            messageBody = messageBody.replace(
                match,
                `<img src="${url}${emoticon}.png" class="emoji" data-emoji="${emoticon}" width="22" height="22"/>`
            );
        }

        return messageBody;
    }

    public headline(emojiService: EmojiService): Observable<string> {
        return new Observable<string>(obs => {
            emojiService.emojis.subscribe((emojis: Emoji[]) => {
                obs.next(this.headlineWithEmojis(emojiService));
                obs.complete();
            });
        });
    }
}

export interface PaginatedResultsInterface<T> {
    items: T[];
    total: number;
}

export class PaginatedResults<T> implements PaginatedResultsInterface<T> {

    constructor(
        public items: T[],
        public total: number,
        private _offset: number,
        private _limit: number,
        private _request: (offset: number, limit: number) => Observable<T>
    ) {
    }

    hasNext() {
        return this._offset + this._limit < this.total;
    }

    next(): Observable<T[]> {

        if (!this.hasNext()) {
            throw new Error('No page available!');
        }

        this._offset += this._limit;
        return new Observable<T[]>(subscriber => {
            this._request(this._offset, this._limit).subscribe(
                (items: any) => {
                    this.items.concat(items)
                    subscriber.next(items);
                    subscriber.complete();
                }
            );
        });
    }
}
