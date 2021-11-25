import {Component, Output, EventEmitter, OnInit, ChangeDetectorRef} from '@angular/core';
import {Emoji, EmojiService} from '../../../services/emoji';

@Component({
    selector: 'learnt-messenger-emoticons',
    templateUrl: './emoticons.component.html',
    styleUrls: ['./emoticons.component.scss']
})
export class MessengerEmoticonsComponent implements OnInit {

    public emojis: Emoji[] = [];
    public keyword: string;
    public loading: boolean;

    @Output()
    public readonly change: EventEmitter<any> = new EventEmitter();

    constructor(private cd: ChangeDetectorRef,
                private emojiService: EmojiService) {
        this.filterEmoji = this.filterEmoji.bind(this);
    }

    ngOnInit() {
        this.loading = true;
        this.emojiService.emojis.subscribe((emojis: Emoji[]) => {
            this.emojis = emojis;
            this.loading = false;
        });
    }

    public filterEmoji(emoji: Emoji): boolean {
        let keyword = this.keyword;

        if (keyword === null || keyword === undefined || keyword === '') {
            return true;
        }

        keyword = keyword.trim().toLowerCase();

        if (emoji.name.indexOf(keyword) !== -1) {
            return true;
        }

        return emoji.alternatives.indexOf(keyword) !== -1;
    }

    public onKeywordChange(keyword: string): void {
        this.keyword = keyword;
        this.cd.detectChanges();
    }
}
