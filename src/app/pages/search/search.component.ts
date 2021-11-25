import { animate, state, style, transition, trigger } from '@angular/animations';
import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ComponentFactoryResolver,
    ComponentRef,
    ElementRef,
    OnDestroy,
    OnInit,
    QueryList,
    ViewChild,
    ViewChildren,
    ViewContainerRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { BookingPanelService } from '../../common/booking-panels/service';
import { MapComponent } from '../../common/map/map.component';
import { PriceIntervalValue } from '../../common/price-interval/price-interval.component';
import { SearchFilters, SearchFiltersComponent } from '../../common/search-filters/search-filters.component';
import { SearchResultTutorComponent } from '../../common/search-result-tutor/search-result.component';
import { Auth, Backend, SearchResult } from '../../lib/core/auth';
import { Media } from '../../lib/core/media';
import { getQueryString } from '../../lib/core/utils';
import { Coordinate, Subject, User } from '../../models';
import { AlertService } from '@services/alerts';
import { LayoutService } from '@services/layout';
import { MessengerFrontService } from '@services/messenger';
import { SearchService } from '@services/search';
import { DialogsFacade } from '../../dialogs';

const STATE_ANIMATION = animate(
    '0.3s cubic-bezier(0, 0, 0, 1)',
);

export interface WhenFilterDayInfo {
    dayNumber: number,
    day: string,
    whenFilterValue: number
}

interface ClearFilterButton {
    buttonText: string,
    clickAction?: string | WhenFilterDayInfo
}

const FLAT_FILTERS_PROPS = ['subject', 'query', 'when', 'specific', 'meetOnline', 'meetPlace', 'price', 'instantSession'];

export class FlatFilters {
    // Subject ID
    subject: any;

    // Query
    query: any;

    // General Availability
    when: string;

    // Specific Availability
    specific: string;

    // Where Online
    meetOnline: any;

    // Where Location
    meetPlace: any;

    // Price range
    price: string;

    // Instant session
    instantSession: boolean;

    constructor(raw?: any) {
        if (raw === null || raw === undefined) {
            return;
        }

        for (const prop of FLAT_FILTERS_PROPS) {
            if (raw[prop] === null || raw[prop] === undefined) {
                continue;
            }
            this[prop] = raw[prop];
        }
    }

    equal(b: FlatFilters): boolean {
        return this.toString() === b.toString();
    }

    empty(): boolean {
        return this.toString() === '';
    }

    toSearchFiltersComponentData(): SearchFilters {
        const filters: SearchFilters = <SearchFilters>{};

        if (this.instantSession) {
            filters.instantSession = true;
        }

        if (this.when) {
            filters.when = this.when;
        }

        if (this.specific !== null && this.specific !== undefined) {
            filters.specific = this.specific;
        }

        if (this.price) {
            const parts = this.price.split('-');
            filters.price = new PriceIntervalValue(
                parseInt(parts[0], 10),
                parseInt(parts[1], 10),
            );
        }

        if (this.meetOnline === '1' || this.meetPlace) {
            filters.where = <any>{};

            if (this.meetOnline === '1') {
                filters.where.online = true;
            }

            if (this.meetPlace) {
                if (this.meetPlace.indexOf(',') !== -1) {
                    filters.where.inperson = this.meetPlace.split(',');
                }
            }
        }

        return filters;
    }

    toString() {
        const payload: URLSearchParams = new URLSearchParams();
        for (const prop of FLAT_FILTERS_PROPS) {
            if (this[prop] !== null && this[prop] !== undefined) {
                payload.set(prop, this[prop]);
            }
        }
        return payload.toString();
    }
}

interface MapMouseOverEvent {
    user: User
    event: MouseEvent
}

@Component({
    selector: 'learnt-search',
    templateUrl: './search.component.html',
    styleUrls: [
        './search.component.scss',
        './search.component.mobile.scss',
        './search.component.desktop.scss',
    ],

    animations: [
        trigger('mapState', [
            state('visible', style({})),
            state('hidden', style({ transform: 'translateX(100%)' })),
            transition('* => hidden', [style({ transform: 'translateX(100%)' }), STATE_ANIMATION]),
            transition('hidden => visible', [style({ transform: 'translateX(100%)' }), STATE_ANIMATION]),
        ]),
        trigger('resultsState', [
            state('visible', style({})),
            state('hidden', style({})),
            transition('* => hidden', [style({}), STATE_ANIMATION]),
            transition('hidden => visible', [style({}), STATE_ANIMATION]),
        ]),
        trigger('fadeDown', [
            state('void', style({ opacity: 0, transform: 'translateY(-50px)' })),
            state('*', style({ opacity: 1, transform: 'translateY(0)' })),
            transition('void <=> *', animate('0.5s ease-out')),
        ]),
    ],
})
export class SearchComponent implements OnInit, OnDestroy, AfterViewInit {

    mapState = 'hidden';
    mapVisible = false;
    filtersVisibility = true;
    pendingRequest: Subscription;
    requesting = false;
    mobile = false;
    animatingMap: boolean;
    flatFilters: FlatFilters = new FlatFilters();
    searchFiltersUIUpdated: boolean;
    tutors: User[] = [];
    mapCenter: Coordinate;
    mapZoom = 14;
    searchText: string;

    private subscriptions: Subscription = new Subscription();
    private filtersComponent: SearchFiltersComponent;
    private map: MapComponent;
    private me: User;
    public triedOnline = false;
    private mapComponentRef: ComponentRef<SearchResultTutorComponent>;

    @ViewChildren('map')
    private mapQuery: QueryList<MapComponent>;

    @ViewChildren('filters')
    private filtersQuery: QueryList<SearchFiltersComponent>;

    @ViewChild('mapToggle', { static: true })
    mapToggle: ElementRef<HTMLAnchorElement>;

    @ViewChildren('searchResultTutor', { read: ViewContainerRef })
    searchResultTutors: QueryList<ViewContainerRef>;

    clearFilterButtons: ClearFilterButton[];

    focused: number | null = null;

    constructor(private ref: ElementRef,
                private auth: Auth,
                private backend: Backend,
                private media: Media,
                private router: Router,
                private alerts: AlertService,
                private route: ActivatedRoute,
                private cd: ChangeDetectorRef,
                private messengerService: MessengerFrontService,
                private panels: BookingPanelService,
                private layoutService: LayoutService,
                private componentFactory: ComponentFactoryResolver,
                private containerRef: ViewContainerRef,
                private searchService: SearchService,
                private dialog: DialogsFacade,
    ) {
    }

    ngOnInit(): void {
        this.layoutService.HideMenu();
        this.searchSubscriptions();

        this.mobile = !this.media.query('gt-sm');
        this.cd.detectChanges();

        this.subscriptions.add(this.auth.me.subscribe((me: User | null) => {
            // user just logged in
            if (me && !this.me) {
                this.tutors = this.tutors.filter(tutor => tutor._id !== me._id);
            }
            this.me = me;
        }));

        this.subscriptions.add(this.media.watch('gt-sm').subscribe(event => {
            this.mobile = !event.active;
            this.cd.detectChanges();
        }));

        this.subscriptions.add(this.route.queryParams.subscribe(query => this.onParamsChange(query)));

        this.mapInit();
    }

    private mapInit(): void {
        if (this.mapQuery.length) {
            this.onMapAvailable(this.mapQuery.first);
        }

        this.mapQuery.changes.subscribe(change => {
            if (change.length) {
                this.onMapAvailable(this.mapQuery.first);
            }
        });

        this.filtersQuery.changes.subscribe(change => {
            if (change.length) {
                this.filtersComponent = change.first;
                this.updateSearchFiltersComponent();
            } else {
                this.filtersComponent = null;
            }
        });

        this.search();
    }

    private searchSubscriptions(): void {
        //this.subscriptions.add(this.searchService.keyword.subscribe((keyword: string) => this.searchKeyword(keyword)));
        this.subscriptions.add(this.searchService.subject.subscribe((subject: Subject) => this.searchSubject(subject)));

        this.searchService.filterVisibility.subscribe((visibility: boolean) => {
            this.filtersVisibilityChange(visibility);

            setTimeout(() => {
                this.adjustMapIcon();
            });
        });

        this.searchService.filterClicked.subscribe(() => {
            setTimeout(() => {
                this.adjustMapIcon();
            });
        });
    }

    private adjustMapIcon(): void {
        if (!this.mapToggle) {
            return;
        }
        const el = this.mapToggle.nativeElement;
        el.style.top = this.filtersHeight + 'px';
        if (!this.cd['destroyed']) {
            this.cd.detectChanges();
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.adjustMapIcon();
        }, 50);
    }

    /**
     * Message a tutor from a result event.
     * @param {User} tutor
     */
    public messageTutor(tutor: User): void {
        this.dialog.showSendMessage(this.me, tutor);
    }

    /**
     * Get the number of columns for tutors.
     * @return {number}
     */
    public get columns(): number {
        if (this.mapVisible || this.lowResScreen) {
            return 3;
        }

        return 4;
    }

    /**
     * Get slider indexes for left & right neighbors.
     * @return {{left: number[], right: number[]}}
     */
    private getSliderIndexes(): { left: number[], right: number[] } {
        const index = this.focused;
        const column = index % this.columns;
        const left: number[] = [], right: number[] = [];

        // push to the left all items previous to the tutor
        for (let l = index - column; l < index; l++) {
            left.push(l);
        }

        // push to the right all items next to the tutor
        for (let r = index + 1; r < index + this.columns - column; r++) {
            right.push(r);
        }

        return { left, right };
    }

    /**
     * Slide the cards to the left or right upon hovering a tutor.
     * @param {number} clear - if true removes transformation
     */
    public slideCards(clear = false): void {
        const index = this.focused;
        const { left, right } = this.getSliderIndexes();

        const tutorsArray = this.searchResultTutors.toArray();
        let transformPx: string;

        // all items to push to the left
        for (const l of left) {
            switch (index % this.columns) {
                case this.columns - 1: // last column, don't move to the right
                    transformPx = '-40px';
                    break;
                default:
                    transformPx = '-40px';
            }

            const element = tutorsArray[l].element.nativeElement;
            element.style['transform'] = clear ? '' : `translate3d(${transformPx}, 0, 0)`;
        }

        // all items to push to the right
        for (const r of right) {
            if (r >= tutorsArray.length) {
                continue;
            }

            switch (index % this.columns) {
                case 0: // first column, don't move to the left
                    transformPx = '40px';
                    break;
                default:
                    transformPx = '40px';
            }

            const element = tutorsArray[r].element.nativeElement;
            element.style['transform'] = clear ? '' : `translate3d(${transformPx}, 0, 0)`;
        }
    }

    /**
     * Params change event.
     * @param query
     */
    private onParamsChange(query: any): void {
        const filters = new FlatFilters(query);

        if (!this.flatFilters) {
            this.flatFilters = filters;
            if (!filters.empty()) {
                this.search();
            }
        } else if (!this.flatFilters.equal(filters)) {
            this.flatFilters = filters;
            this.search();
        }
        if (filters.meetPlace && !this.mapVisible) {

            this.backend.getGeocodeByAddress(filters.meetPlace).subscribe(
                locations => {
                    if (locations && locations.length > 0) {
                        this.mapCenter = locations[0].position.coordinates;
                        this.mapVisible = true;
                        this.mapState = 'visible';
                        this.cd.detectChanges();
                    }
                },
            );
        }

        this.updateSearchFiltersComponent();
        this.onFiltersChange(this.flatFilters.toSearchFiltersComponentData());

        if (!this.cd['destroyed']) {
            this.cd.detectChanges();
        }
    }

    /**
     * Selected a tutor from the map.
     * @param {User} tutor
     */
    public onMapTutorSelect(tutor: User): void {
        const tutorArray = this.searchResultTutors.toArray();
        const tutorBlockIndex = tutorArray.findIndex(t => (<HTMLElement>t.element.nativeElement).dataset['userid'] === tutor._id);
        const tutorBlock = tutorArray[tutorBlockIndex];
        if (tutorBlock === undefined) {
            return;
        }

        const el: HTMLElement = tutorBlock.element.nativeElement;
        this.showDetails(tutorBlockIndex, el);
    }

    /**
     * Open details card.
     */
    private showDetails(index: number, el: HTMLElement): void {
        console.log('showdetails');
        const detailsElem: HTMLElement = <HTMLElement>el.children.namedItem('tutor').children.namedItem('details-card');
        detailsElem.style.opacity = '1';
        detailsElem.style.transform = 'scale(1)';

        switch (index % this.columns) {
            case 0: // first column, don't move to the left
                detailsElem.style.left = '0';
                break;
            case this.columns - 1: // last column, don't move to the right
                detailsElem.style.left = '-270px';
                break;
        }

        el.scrollIntoView();
        // const { left, right } = this.getSliderIndexes(index);
        // this.slideCards(index, { left, right, clear: false });
    }

    /**
     * Mouse over a tutor from the map.
     * @param {MapMouseOverEvent} mapEvent
     */
    public onMapTutorMouseOver(mapEvent: MapMouseOverEvent): void {
        const compFactory = this.componentFactory.resolveComponentFactory(SearchResultTutorComponent);
        this.mapComponentRef = this.containerRef.createComponent(compFactory);

        const arrowDirection: 'top' | 'bottom' = 'bottom';

        this.mapComponentRef.instance.arrow = true;
        this.mapComponentRef.instance.arrowDirection = arrowDirection;
        this.mapComponentRef.instance.tutor = mapEvent.user;

        const el: HTMLElement = this.mapComponentRef.location.nativeElement;
        const target: Element = mapEvent.event.srcElement as Element;
        const rect: DOMRect = <DOMRect>target.getBoundingClientRect();

        el.style.position = 'fixed';
        el.style.zIndex = '9999';
        el.style.left = rect.x - 125 + 20 + 'px'; // map market left - half of template height + half of map marker width, to center

        switch (<string>arrowDirection) {
            case 'top':
                el.style.top = rect.y + 40 + 5 + 'px'; // map marker top + marker height + padding
                break;
            case 'bottom':
                el.style.top = rect.y - 340 - 20 - 5 + 'px'; // map market left - template height - half of map marker height - padding
                break;
        }
    }

    /**
     * Mouse out a tutor from the map.
     * @param {User} tutor
     */
    public onMapTutorMouseOut(): void {
        if (this.mapComponentRef === undefined) {
            return;
        }
        this.mapComponentRef.destroy();
    }

    /**
     * Update the filters component.
     */
    private updateSearchFiltersComponent(): void {
        if (this.filtersComponent && !this.searchFiltersUIUpdated) {
            this.searchFiltersUIUpdated = true;
            setTimeout(() => {
                const flatFiltersToSearchFilters = this.flatFilters.toSearchFiltersComponentData();
                this.filtersComponent.setFilters(flatFiltersToSearchFilters);
            });
        }
    }

    private onMapAvailable(a: MapComponent) {
        this.map = a;
    }

    /**
     * Get filters height.
     * @return {number}
     */
    public get filtersHeight(): number {
        const e = document.getElementsByTagName('learnt-search-filters');
        let height = 0;
        if (e && e.length) {
            height = e[0].getBoundingClientRect().height;
        }
        return height + 10;
    }

    /**
     * Get map height.
     * @return {number}
     */
    public get mapHeight(): number {
        const scroller = document.getElementById('search-results-scroller');
        return scroller ? scroller.getBoundingClientRect().top : -1;
    }

    /**
     * Filters change event.
     * @param {SearchFilters} filters
     */
    public onFiltersChange(filters: SearchFilters): void {
        const flat: FlatFilters = new FlatFilters();
        this.clearFilterButtons = [];

        if (this.flatFilters.subject) {
            flat.subject = this.flatFilters.subject;
        }

        if (this.flatFilters.query) {
            flat.query = this.flatFilters.query;
            this.clearFilterButtons.push({ buttonText: this.flatFilters.query });
        }

        if (filters.when) {
            flat.when = filters.when + '';
            let whenFilterArray = [];
            if (filters.when.indexOf(',') > -1) {
                whenFilterArray = filters.when.split(',');
            } else {
                whenFilterArray = [filters.when];
            }
            whenFilterArray.map(v => {
                const vInt = parseInt(v, 10);
                if (vInt > 1 && vInt < 15) {
                    this.clearFilterButtons.push({
                        buttonText: 'Monday x',
                        clickAction: { dayNumber: 0, day: 'Monday', whenFilterValue: vInt },
                    });
                } else if (vInt > 15 && vInt < 113) {
                    this.clearFilterButtons.push({
                        buttonText: 'Tuesday x',
                        clickAction: { dayNumber: 1, day: 'Tuesday', whenFilterValue: vInt },
                    });
                } else if (vInt > 127 && vInt < 897) {
                    this.clearFilterButtons.push({
                        buttonText: 'Wednesday x',
                        clickAction: { dayNumber: 2, day: 'Wednesday', whenFilterValue: vInt },
                    });
                } else if (vInt > 1023 && vInt < 7169) {
                    this.clearFilterButtons.push({
                        buttonText: 'Thursday x',
                        clickAction: { dayNumber: 3, day: 'Thursday', whenFilterValue: vInt },
                    });
                } else if (vInt > 8191 && vInt < 57345) {
                    this.clearFilterButtons.push({
                        buttonText: 'Friday x',
                        clickAction: { dayNumber: 4, day: 'Friday', whenFilterValue: vInt },
                    });
                } else if (vInt > 65535 && vInt < 458753) {
                    this.clearFilterButtons.push({
                        buttonText: 'Saturday x',
                        clickAction: { dayNumber: 5, day: 'Saturday', whenFilterValue: vInt },
                    });
                } else if (vInt > 524287 && vInt < 3670017) {
                    this.clearFilterButtons.push({
                        buttonText: 'Sunday x',
                        clickAction: { dayNumber: 6, day: 'Sunday', whenFilterValue: vInt },
                    });
                }
            });
        }

        if (filters.specific) {
            flat.specific = filters.specific;
            const specificArray = filters.specific.split('_');
            const displayDateTime = moment(specificArray[0], 'YYYY-MM-DD').format('ddd MMM D') + ' ' +
                moment(specificArray[1], 'HH:mm').format('h:mm A') + '-' + moment(specificArray[2], 'HH:mm').format('h:mm A');
            this.clearFilterButtons.push({ buttonText: displayDateTime + ' x', clickAction: 'specific' });
        }

        if (filters.instantSession) {
            flat.instantSession = true;
            this.clearFilterButtons.push({ buttonText: 'Instant Session x', clickAction: 'instantSession' });
        }

        if (filters.price) {
            flat.price = filters.price.min + '-' + filters.price.max;
            this.clearFilterButtons.push(
                { buttonText: '$' + filters.price.min + ' - ' + '$' + filters.price.max + ' x', clickAction: 'price' },
            );
        }

        if (filters.where !== null && filters.where !== undefined) {
            if (this.mapVisible && filters.where.inperson === undefined) {
                this.toggleMap();
            }

            if (filters.where.online) {
                flat.meetOnline = '1';
                this.clearFilterButtons.push({ buttonText: 'Meet Online x', clickAction: 'meetOnline' });
            }

            if (filters.where.inperson) {
                if (filters.where.inperson.constructor === Array) {
                    // sometimes we get an array of two strings
                    const lat: number = parseFloat('' + filters.where.inperson[0]);
                    const lng: number = parseFloat('' + filters.where.inperson[1]);
                    this.mapCenter = new Coordinate({ lat, lng });

                    flat.meetPlace = (<number[]>filters.where.inperson).join(',');
                } else {
                    flat.meetPlace = filters.where.inperson;
                }
                this.clearFilterButtons.push({ buttonText: 'Meet In Person x', clickAction: 'meetPlace' });
            }
        }

        if (!this.cd['destroyed']) {
            this.cd.detectChanges();
        }
        this.router.navigate([], { queryParams: flat });
    }

    /**
     * Map animation complete event.
     * @param event
     */
    public onMapAnimationComplete(event: any): void {
        this.animatingMap = false;

        if (event.fromState === 'visible' && event.toState === 'hidden') {
            this.mapVisible = false;
        }

        this.cd.detectChanges();
    }

    /**
     * Toggles the map.
     */
    public toggleMap(): void {
        if (this.animatingMap) {
            return;
        }

        this.animatingMap = true;

        if (this.mapState === 'hidden') {
            if (this.mapCenter !== undefined) {
                this.mapVisible = true;
                this.mapState = 'visible';
            } else {
                this.getCoordinates();
            }
        } else {
            this.mapState = 'hidden';
        }

        this.cd.detectChanges();
    }

    private getCoordinates(): void {
        const notFound = () => {
            this.animatingMap = false;
            this.cd.detectChanges();
            this.alerts.alert(
                'Location error',
                'Your location can\'t be found. Go to "Where" filters and use browser location to find your location.',
            );
        };

        this.backend.getGeocodeByIp().subscribe((coords: Coordinate) => {
            if (coords === null || coords === undefined || coords.lat === 0 && coords.lng === 0) {
                navigator.geolocation.getCurrentPosition(({ coords: { latitude, longitude } }) => {
                    coords.lat = latitude;
                    coords.lng = longitude;
                }, (e) => {
                    console.log(e);
                    return notFound();
                });
            }

            this.mapCenter = coords;
            this.mapVisible = true;
            this.mapState = 'visible';

            const queryParams = getQueryString();
            queryParams.meetPlace = coords.lat + ',' + coords.lng;
            this.router.navigate([], { queryParams });
            this.cd.detectChanges();
        }, () => notFound());
    }

    /**
     * Get the tutors from the search results.
     * @param {any[]} results
     */
    private onResults(results: User[]) {
        this.requesting = false;
        this.cd.markForCheck();
        this.searchService.working.next(false);
        this.tutors = results;
    }

    searchSubject(subject: Subject) {
        if (subject === null || subject === undefined) {
            return;
        }
        this.flatFilters = new FlatFilters(this.flatFilters);
        this.flatFilters.subject = subject._id;
        delete this.flatFilters.query;
        this.router.navigate([], { queryParams: this.flatFilters });
        this.search();

        // FIXME: Subject
        // this.panels.DataItem('subject', this.flatFilters.subject);

        this.searchService.SearchSubject(null); // don't preserve queries
    }

    searchKeyword(keyword: string) {
        if (keyword === null || keyword === undefined || keyword === '') {
            return;
        }
        this.flatFilters = new FlatFilters(this.flatFilters);
        this.flatFilters.query = keyword;
        delete this.flatFilters.subject;
        this.router.navigate([], { queryParams: this.flatFilters });
        this.search();

        this.searchService.SearchKeyword(null); // don't preserve queries
    }

    /**
     * Search for tutors.
     */
    private search() {
        if (this.pendingRequest) {
            this.pendingRequest.unsubscribe();
            this.pendingRequest = null;
        }

        this.searchService.working.next(true);

        this.requesting = true;
        this.pendingRequest = this.backend.search(this.flatFilters).subscribe(
            (res: SearchResult) => {
                this.searchText = res.message;
                this.triedOnline = res.tried_online && this.flatFilters.meetOnline === undefined;
                this.onResults(res.tutors);
            },
            err => console.error(err));
    }

    filtersVisibilityChange(visible: boolean) {
        this.filtersVisibility = visible;
    }

    /**
     * Low resolution screens.
     * @return {boolean}
     */
    public get lowResScreen(): boolean {
        return document.documentElement.clientWidth <= 1200;
    }

    /**
     * Clear Chosen Search Filter.
     * @param {string | WhenFilterDayInfo} filterStringOrObject
     */
    private clearChosenSearchFilter(filterStringOrObject: string | WhenFilterDayInfo | null) {
        if (filterStringOrObject) {
            let filterKey, whenIndex, whenFilter;
            if (typeof filterStringOrObject === 'string') {
                whenIndex = null;
                whenFilter = null;
                filterKey = filterStringOrObject;
                delete this.flatFilters[filterKey];
            } else {
                // When filter has an object as it's clickAction
                filterKey = 'when';
                whenFilter = filterStringOrObject;
                if (this.flatFilters.when.indexOf(',') === -1) {
                    delete this.flatFilters[filterKey];
                    whenIndex = 0;
                } else {
                    const whenFilterArray = this.flatFilters.when.split(',');
                    whenIndex = whenFilterArray.indexOf(filterStringOrObject.whenFilterValue.toString(10));
                    this.flatFilters.when =
                        [...whenFilterArray.slice(0, whenIndex), ...whenFilterArray.slice(whenIndex + 1)].toString();
                }
            }
            // Reset SearchFiltersComponent sub-components
            this.filtersQuery.toArray()[0].clearFilterFromSearchingFor(filterKey, whenIndex, whenFilter);
            this.searchFiltersUIUpdated = false;
            this.updateSearchFiltersComponent();
            // Reset query params in url
            this.onFiltersChange(this.flatFilters.toSearchFiltersComponentData());
            this.search();
        }
    }

    tutorId(_, tutor: User): string {
        return tutor._id;
    }

    setFocus(i: number): void {
        if (this.mobile) return;

        this.focused = i;
        this.slideCards();
    }

    unFocused(): void {
        if (this.mobile) return;

        this.slideCards(true);
        this.focused = null;
    }
}
