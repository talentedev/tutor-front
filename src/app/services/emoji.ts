import {EventEmitter, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs/Rx';

export interface Emoji {
    name: string;
    alternatives: string;
    category: string;
}

@Injectable()
export class EmojiService {
    private done: EventEmitter<boolean> = new EventEmitter<boolean>();
    private _emojis: Emoji[];

    public static ImageLink(name: string): string {
        return `https://cdnjs.cloudflare.com/ajax/libs/emojify.js/1.1.0/images/basic/${name}.png`;
    }

    constructor(private http: HttpClient) {
        this.getEmojis();
    }

    private getEmojis(): void {
        this.http.get<Emoji[]>('/assets/messenger/emoji-map.json').subscribe((emojis: Emoji[]) => {
            this._emojis = emojis;
            this.done.next(true);
        });
    }

    /**
     * Returns the list of emojis currently loaded.
     */
    public get emojis(): Observable<Emoji[]> {
        return new Observable(obs => {
            if (this._emojis !== undefined) {
                obs.next(this._emojis);
                obs.complete();
                return;
            }

            this.done.subscribe((done: boolean) => {
                obs.next(this._emojis);
                obs.complete();
            });
        });
    }

    /**
     * Returns whether a specific name matches an emoji.
     * @param {string} name
     * @return {boolean}
     */
    public isEmoji(name: string): boolean {
        return this._emojis.find(e => e.name === name) !== undefined;
    }
}
