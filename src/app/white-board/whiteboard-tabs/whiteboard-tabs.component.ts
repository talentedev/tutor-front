import {Component, Output, QueryList, ElementRef, ViewChildren, HostBinding, EventEmitter, Input} from '@angular/core';

export interface WhiteboardTab {
    getName(): string
    setName(name: string)
    isActive(): boolean;
}

@Component({
    selector: 'learnt-whiteboard-tabs',
    templateUrl: './whiteboard-tabs.component.html',
    styleUrls: ['./whiteboard-tabs.component.scss']
})
export class WhiteboardTabsComponent {

    private index = 1;

    @ViewChildren('tabList')
    public tabList: QueryList<ElementRef>;

    @Input()
    tabs: WhiteboardTab[] = [];

    @HostBinding('class.editing')
    public editing: WhiteboardTab;

    @Output()
    public readonly change: EventEmitter<any> = new EventEmitter();

    @Output()
    public readonly closing: EventEmitter<any> = new EventEmitter();

    @Output()
    public readonly rename: EventEmitter<any> = new EventEmitter();

    @Output()
    public readonly create: EventEmitter<any> = new EventEmitter();

    onTabClick(tab: WhiteboardTab, event: MouseEvent) {
        event.stopImmediatePropagation();
        event.stopPropagation();
        event.preventDefault();
        this.change.next(tab);
    }

    public close(tab: WhiteboardTab, event: MouseEvent): void {
        this.editing = null;
        event.stopImmediatePropagation();
        this.closing.next(tab);
    }

    public edit(tab: WhiteboardTab): void {

        if (tab !== this.tabs.find(t => t.isActive())) {
            return;
        }

        this.editing = tab;

        setTimeout(() => {
            this.tabList.forEach(e => {
                const dataset = e.nativeElement.dataset;
                const sameIndex = parseInt(dataset.index, 10) === this.tabs.indexOf(tab);
                const firstElementChild = e.nativeElement.firstElementChild;

                if (dataset && sameIndex && firstElementChild) {
                    const span: HTMLElement = firstElementChild;
                    span.focus();

                    const selection = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(span);
                    selection.removeAllRanges();
                    selection.addRange(range);

                    const onEditFinish = (event) => {
                        let terminate: boolean;

                        if (event.type === 'blur') {
                            terminate = true;
                        }

                        if (event && event instanceof KeyboardEvent && event.keyCode === 13) {
                            // pressed Enter
                            event.preventDefault();
                            event.stopImmediatePropagation();
                            terminate = true;
                        }

                        if (terminate) {
                            this.editing = null;
                            span.removeEventListener('blur', onEditFinish);
                            span.removeEventListener('keydown', onEditFinish);
                            if (span.innerText.trim() !== '') {
                                tab.setName(span.innerText.trim())
                                this.rename.next(tab);
                            }
                            
                        }
                    };

                    span.addEventListener('blur', onEditFinish);
                    span.addEventListener('keydown', onEditFinish);
                }
            });
        });
    }

}
