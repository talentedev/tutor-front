import { Component, ElementRef, HostBinding, Input, OnChanges, OnInit, ChangeDetectionStrategy } from '@angular/core';

const CARD_TYPES = {
    'mc': '5[1-5][0-9]{14}',
    'ec': '5[1-5][0-9]{14}',
    'vi': '4(?:[0-9]{12}|[0-9]{15})',
    'ax': '3[47][0-9]{13}',
    'dc': '3(?:0[0-5][0-9]{11}|[68][0-9]{12})',
    'bl': '3(?:0[0-5][0-9]{11}|[68][0-9]{12})',
    'di': '6011[0-9]{12}',
    'jcb': '(?:3[0-9]{15}|(2131|1800)[0-9]{11})',
    'er': '2(?:014|149)[0-9]{11}'
};

@Component({
    selector: 'learnt-credit-card-icon-matcher',
    templateUrl: './credit-card-icon-matcher.component.html',
    styleUrls: ['./credit-card-icon-matcher.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreditCardIconMatcherComponent implements OnInit, OnChanges {

    @Input()
    mode: 'highlight' | 'only' = 'highlight';

    @Input()
    number: any;

    @HostBinding('class.matched')
    matched: boolean;

    @HostBinding('class.highlight')
    get isHighlightMode() {
        return this.mode === 'highlight';
    }

    @HostBinding('class.only')
    get isOnlyMode() {
        return this.mode === 'only';
    }

    constructor(
        private eRef: ElementRef
    ) { }

    ngOnInit() {}

    ngOnChanges(change) {
        if (change.number) {
            this.update();
        }
    }

    match(): string {
        const value = String(this.number).replace(/[- ]/g, '');
        for (const p in CARD_TYPES) {
            if (value.match('^' + CARD_TYPES[p] + '$')) {
                return p;
            }
        }
        return '';
    }

    update() {

        const children = this.eRef.nativeElement.childNodes;

        const match = this.match();
        let matched = false;

        for (let i = 0; i < children.length; i++) {

            if (children[i].nodeName !== 'DIV') {
                continue;
            }

            const name = children[i].dataset.card;

            if (!name) {
                continue;
            }

            if (name === match) {
                children[i].classList.add('matched');
                matched = true;
            } else {
                children[i].classList.remove('matched');
            }
        }

        this.matched = matched;
    }
}
