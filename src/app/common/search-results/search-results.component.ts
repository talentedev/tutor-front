import {
    SearchResultsRecoverPasswordComponent,
} from '../search-results-recover-password/search-results-recover-password.component';
import {SearchResultsBookSummaryComponent} from '../search-results-book-summary/search-results-book-summary.component';
import {SearchResultsCreditCardComponent} from '../search-results-credit-card/search-results-credit-card.component';
import {SearchResultsRegisterComponent} from '../search-results-register/search-results-register.component';
import {SearchResultsLoginComponent} from '../search-results-login/search-results-login.component';
import {SearchResultsBookComponent} from '../search-results-book/search-results-book.component';
import {ActivatedRoute} from '@angular/router';
import {SearchResultComponent} from '../search-result/search-result.component';
import {User} from '../../models';
import {
    ChangeDetectorRef,
    Component,
    ComponentFactoryResolver,
    ComponentRef,
    ElementRef,
    HostBinding,
    HostListener,
    Injector,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    ReflectiveInjector,
    ViewChild,
    ViewContainerRef,
    ChangeDetectionStrategy,
} from '@angular/core';


const GAP = 15;
const BOX_WIDTH = 250;
const EXPAND_BOX_WIDTH = BOX_WIDTH * 2 + GAP;
const BOX_HEIGHT = 310;

const VIEW_MAP = {
    'login': SearchResultsLoginComponent,
    'register': SearchResultsRegisterComponent,
    'cc': SearchResultsCreditCardComponent,
    'book': SearchResultsBookComponent,
    'book-summary': SearchResultsBookSummaryComponent,
    'recover-password': SearchResultsRecoverPasswordComponent,
    'instant-book': SearchResultsBookSummaryComponent,
};

@Component({
    selector: 'learnt-search-results',
    templateUrl: './search-results.component.html',
    styleUrls: ['./search-results.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchResultsComponent implements OnInit, OnDestroy, OnChanges {

    @Input()
    tutors: User[];

    @Input()
    columns = 3;

    @ViewChild('container', {read: ViewContainerRef})
    tutorsContainer: ViewContainerRef;

    @ViewChild('expand', {read: ViewContainerRef})
    expandContainer: ViewContainerRef;

    @ViewChild('more')
    more: ElementRef;

    @ViewChild('arrow')
    arrow: ElementRef;
    expandContainerView: string;
    expandContainerComponentRef: ComponentRef<any>;
    expandContainerHeight = 0;
    expandContainerVisible: boolean;
    boxes: ComponentRef<SearchResultComponent>[] = [];
    active: number;
    scrollingInterval: any;
    scrolling: boolean;
    focusInterval: any;
    focusBlocked: boolean;
    mouseMoveDisabled: boolean;

    constructor(private resolver: ComponentFactoryResolver,
                private injector: Injector,
                private route: ActivatedRoute,
                private eRef: ElementRef,
                private cdRef: ChangeDetectorRef) {
        this.onSearchScrolling = this.onSearchScrolling.bind(this);
    }

    ngOnInit() {
        const scroller = document.getElementById('search-results-scroller');
        if (scroller) {
            scroller.addEventListener('wheel', this.onSearchScrolling);
        }
    }

    ngOnDestroy() {
        const scroller = document.getElementById('search-results-scroller');
        if (scroller) {
            scroller.removeEventListener('wheel', this.onSearchScrolling);
        }
    }

    ngOnChanges(changes) {
        if (changes.tutors) {
            this.render();
        }
    }

    render() {

        if (!this.tutors || !this.tutors.length) {
            return;
        }

        const factory = this.resolver.resolveComponentFactory(
            SearchResultComponent
        );

        const injector = ReflectiveInjector.resolveAndCreate(
            [{provide: 'results', useValue: this}],
            this.injector,
        );

        for (let i = 0; i < this.tutors.length; i++) {
            const cmpRef = this.tutorsContainer.createComponent(factory, i, injector);
            cmpRef.instance.tutor = this.tutors[i];
            cmpRef.instance.index = i;
            this.boxes[i] = cmpRef;
        }

        this.focus();
    }

    onProfileAction(action: string) {

    }

    onSearchScrolling(event: MouseEvent) {

        this.scrolling = true;

        if (this.scrollingInterval) {
            clearTimeout(this.scrollingInterval);
        }

        this.scrollingInterval = setTimeout(this.onScrollingComplete.bind(this), 100);
    }

    onScrollingComplete(event: MouseEvent) {
        this.scrolling = false;
    }

    @HostListener('document:mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {

        if (this.mouseMoveDisabled || this.scrolling || this.focusBlocked) {
            return;
        }

        const index = this.getMouseCurrentIndex(event);

        if (index === this.active) {
            return;
        }

        this.active = index;

        clearTimeout(this.focusInterval);

        if (typeof(index) === 'undefined') {
            return this.focus();
        }

        this.focusInterval = setTimeout(() => this.focus(index), 100);
    }

    getIndexPosition(box: number): { x: number, y: number } {

        const index = box;

        let row, column;

        if (index >= 0) {
            row = Math.floor(index / this.columns);
            column = Math.floor(Math.abs(index) % this.columns);
        } else {
            row = Math.abs(Math.floor(index / this.columns));
            column = 3 - Math.ceil(Math.abs(index) % this.columns);
        }

        const x = Math.abs(column) * BOX_WIDTH + (GAP * column);
        let y = Math.abs(row) * BOX_HEIGHT + (GAP * row);

        if (index < 0) {
            y = y * -1;
        }

        return {x, y};
    }

    setIndexPosition(box: number, shift = 0) {

        const {x, y} = this.getIndexPosition(box + shift);

        this.setBox3DTranslate(box, x, y);

        const e = this.boxes[box].location.nativeElement;
        e.style.width = BOX_WIDTH + 'px';
        this.boxes[box].instance.focused = false;
        this.boxes[box].instance.disabled = false;
    }

    focus(active?: number | User, autoscroll = false) {
        if (active instanceof User) {
            for (let i = 0; i < this.tutors.length; i++) {
                if (this.tutors[i]._id === active._id) {
                    return this.focus(i, autoscroll);
                }
            }

            throw new Error('This tutor is not in search results');
        }

        if (this.scrolling || this.focusBlocked) {
            return;
        }

        if (typeof active === 'undefined') {
            this.tutors.forEach((x, i) => this.setIndexPosition(i));
            return;
        }

        if (!this.boxes[active]) {
            throw new Error(`Index ${active} is out of bounds!`);
        }

        this.active = active;

        const column = Math.floor(active % this.columns);

        let bx = -(BOX_WIDTH / 2);
        let c = 0;

        if (column === 0) {
            bx = 0;
        } else if (column === 2) {
            bx = -(BOX_WIDTH + GAP);
        }

        for (let i = 0; i < this.boxes.length; i++) {

            const box = this.boxes[i];
            const e = box.location.nativeElement;
            const {x, y} = this.getIndexPosition(i);

            e.style.width = BOX_WIDTH + 'px';

            if (i >= active - column && i < Math.min(active - column + this.columns, this.boxes.length)) {

                this.setBox3DTranslate(i, bx, y);

                if (column === c) {
                    e.style.width = EXPAND_BOX_WIDTH + 'px';
                    bx += EXPAND_BOX_WIDTH + GAP;
                    box.instance.showProfile();
                } else {
                    bx += BOX_WIDTH + GAP;
                }

                this.boxes[i].instance.focused = (column === c);
                this.boxes[i].instance.disabled = (column !== c);
                this.boxes[i].changeDetectorRef.detectChanges();

                c++;

                continue;
            }

            this.setBox3DTranslate(i, x, y);

            this.boxes[i].instance.focused = false;
            this.boxes[i].instance.disabled = true;
            this.boxes[i].changeDetectorRef.detectChanges();
        }

        if (autoscroll) {
            this.scrollIntoView(this.boxes[active].location);
        }

        this.cdRef.detectChanges();
    }

    getMouseCurrentIndex(event?: MouseEvent): number {

        let e: HTMLElement = <HTMLElement> event.target;
        let i = 0;

        while (e.parentElement && i < 30) {

            if (e.nodeName === 'NERDLY-SEARCH-RESULTS' || e.nodeName === 'BODY') {
                break;
            }

            if (e.nodeName === 'NERDLY-SEARCH-RESULT') {
                return parseInt(e.dataset.index, 10);
            }

            e = e.parentElement;

            i++;
        }

        return;
    }

    expand(view: string, data: any = {}) {

        this.focusBlocked = true;

        this.tutors.forEach((x, i) => {
            if (this.active !== i) {
                this.boxes[i].location.nativeElement.style.opacity = '0.4';
            }
            this.setIndexPosition(i);
        });

        this.expandContainerVisible = true;

        const column = Math.floor(this.active % this.columns);

        this.arrow.nativeElement.style.left = ((column * 15) + (column * 250) + (250 / 2) - 10) + 'px';

        this.setExpandView(view, data);

        this.cdRef.detectChanges();
    }

    setExpandView(view: string, data = {}) {

        if (!this.expandContainerVisible) {
            throw new Error('Expand container is not visible');
        }

        const row = Math.ceil((this.active + 1) / this.columns);

        this.expandContainer.clear();

        this.expandContainerView = view;

        if (!VIEW_MAP[view]) {
            alert('Error: Trying to navigate to a view "' + view + '" that does not exist!');
            return null;
        }

        const injector = ReflectiveInjector.resolveAndCreate(
            [{provide: 'results', useValue: this}],
            this.injector,
        );

        this.expandContainerComponentRef = this.expandContainer.createComponent(
            this.resolver.resolveComponentFactory(VIEW_MAP[view]),
            0,
            injector
        );

        this.expandContainerComponentRef.instance.init(data);

        this.expandContainerComponentRef.changeDetectorRef.detectChanges();

        const e = this.more.nativeElement;

        e.style.opacity = '0';
        e.style.top = (row * BOX_HEIGHT + GAP * (row - 1)) - 10 + 'px';

        this.updateExpandViewHeight();
    }

    updateExpandViewHeight() {

        setTimeout(() => {
            const row = Math.ceil((this.active + 1) / this.columns);
            const e = this.more.nativeElement;
            const viewElement: HTMLElement = this.expandContainerComponentRef.location.nativeElement;
            const rect: ClientRect = viewElement.getBoundingClientRect();

            e.style.height = this.expandContainerHeight + 'px';

            for (let i = row * this.columns; i < this.boxes.length; i++) {
                const {x, y} = this.getIndexPosition(i);
                this.setBox3DTranslate(i, x, y + rect.height + GAP);
            }

            this.expandContainerHeight = rect.height;

            this.scrollIntoView(this.more);

            setTimeout(() => {
                e.style.top = (row * BOX_HEIGHT + GAP * (row - 1)) - 5 + 'px';
                e.style.height = rect.height + 'px';
                e.style.opacity = '1';
            });
        });
    }

    closeExpandView() {
        this.expandContainerHeight = 0;
        this.focusBlocked = false;
        this.tutors.forEach((x, i) => {
            this.boxes[i].location.nativeElement.style.opacity = '1';
            this.setIndexPosition(i);
        });
        const e = this.more.nativeElement;
        e.style.height = '0px';
        e.style.opacity = '0';
        setTimeout(() => this.expandContainerVisible = false, 250);
        if (this.expandContainerComponentRef) {
            this.expandContainerComponentRef.destroy();
        }
    }


    private scrollIntoView(ref: ElementRef) {

        const SCROLL_TIME = 500;
        const now = window.performance && window.performance.now
            ? window.performance.now.bind(window.performance) : Date.now;

        const contents = document.getElementById('search-results-scroller');
        const e: HTMLElement = ref.nativeElement;

        const parentRects = contents.getBoundingClientRect();
        const clientRects = e.getBoundingClientRect();

        const startTime = now();

        const from = contents.scrollTop;

        const ease = (t) => t * (2 - t);

        const animate = () => {
            const time = now();
            var elapsed = (time - startTime) / SCROLL_TIME;
            elapsed = elapsed > 1 ? 1 : elapsed;
            const value = ease(elapsed);
            const top = from + (clientRects.top - parentRects.top - 10) * value;
            contents.scrollTop = top;
            if (value < 1) {
                window.requestAnimationFrame(() => animate());
            }
        };

        animate();
    }


    setBox3DTranslate(box: number, x: number, y: number) {
        this.boxes[box].location.nativeElement.style.transform = `translate3D(${x}px, ${y}px, 0px)`;
    }

    @HostBinding('attr.class')
    get className() {
        return 'col-' + this.columns;
    }
}
