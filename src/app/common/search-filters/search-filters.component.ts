import { MapsAPILoader } from '@agm/core';
import { Overlay } from '@angular/cdk/overlay';
import {
    ChangeDetectorRef,
    Component, ElementRef,
    EventEmitter,
    HostBinding,
    NgZone,
    OnDestroy,
    Output, QueryList, ViewChild, ViewChildren
} from '@angular/core';
import { } from 'google-maps';
import { Subscription } from 'rxjs/Subscription';
import { Auth, Backend } from '../../lib/core/auth';
import { Media } from '../../lib/core/media';
import { User } from '../../models';
import { WhenFilterDayInfo } from '../../pages/search/search.component';
import { AccountService } from '../../services/account';
import { NotificationsService } from '../../services/notifications';
import { Platform } from '../../services/platform';
import { SearchService } from '../../services/search';
import { BookingPanelService } from '../booking-panels/service';
import { CheckboxComponent } from '../checkbox/checkbox.component';
import { GeneralAvailabilityComponent } from '../general-availability/general-availability.component';
import { PriceIntervalValue } from '../price-interval/price-interval.component';
import { SpecificAvailabilityComponent } from '../specific-availability/specific-availability.component';

export declare interface SearchFilters {
    price: PriceIntervalValue;
    instantSession: boolean;
    where: { online: boolean, inperson: number[] | string };
    when: string;
    specific: string;
}

@Component({
    selector: 'learnt-search-filters',
    templateUrl: './search-filters.component.html',
    styleUrls: [
        './search-filters.component.scss',
        './search-filters.component.mobile.scss',
        './search-filters.component.desktop.scss'
    ]
})
export class SearchFiltersComponent implements OnDestroy {

    @HostBinding('attr.id')
    id = 'learnt-search-filters';

    @ViewChild('searchInput')
    public searchElementRef: ElementRef;

    menuExpanded = false;

    mobile: boolean;

    state: string;

    filters: SearchFilters = <SearchFilters>{};

    timezone = 'Select One';

    whereOnline: boolean;
    whereInPerson: boolean;
    whereBoth: boolean;
    whereInPersonZipCode: string;
    latestFoundLocation: number[];

    public availabilityType: 'general' | 'specific' = 'general';

    /**
     * Indicate that locate button from where section is
     * pressed and locating in progress
     */
    locating: boolean;

    @Output()
    public readonly change: EventEmitter<any> = new EventEmitter();

    /* Tries for getting the location input */
    private searchInputTry = 0;

    private subscription: Subscription = new Subscription();

    @ViewChildren(GeneralAvailabilityComponent) generalAvailabilityComp: QueryList<GeneralAvailabilityComponent>;
    @ViewChildren(SpecificAvailabilityComponent) specificAvailabilityComp: QueryList<SpecificAvailabilityComponent>;

    @ViewChildren('instantSession') private instantSessionCheckboxComp: QueryList<CheckboxComponent>;

    constructor(private media: Media,
                private account: AccountService,
                private backend: Backend,
                private platform: Platform,
                private auth: Auth,
                private ngZone: NgZone,
                private overlay: Overlay,
                private cd: ChangeDetectorRef,
                private notifications: NotificationsService,
                private mapsApiLoader: MapsAPILoader,
                private panels: BookingPanelService,
                private searchService: SearchService) {

        this.auth.me.subscribe((me: User) => {
            if (me !== null) {
                this.timezone = me.timezone;
            }
        });

        this.mobile = !media.query('gt-sm');
        this.subscription.add(media.watch('gt-sm').subscribe(event => this.mobile = !event.active));
    }

    /**
     * Unsubscribe all subscriptions created during the filters' lifetime.
     */
    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    public toggleAvailability(): void {
        this.availabilityType = this.availabilityType === 'general' ? 'specific' : 'general';
        this.searchService.filterClicked.next(true);
    }

    /**
     * Switch state to the active tab.
     * @param {MouseEvent} event
     */
    public onTabClick(event: MouseEvent): void {
        const e: HTMLElement = <HTMLElement>event.target;
        switch (e.nodeName) {
            case 'A': // clicked on tab parent
                if (e.dataset.state) {
                    this.state = e.dataset.state;
                }
                break;
            case 'DIV': // clicked on tab child
                if (e.parentElement.dataset.state) {
                    this.state = e.parentElement.dataset.state;
                }
                break;
        }

        this.searchService.filterClicked.next(true);
    }

    /**
     * Clear the filters.
     */
    public clear(): void {
        this.filters = <SearchFilters>{};
        this.state = null;
        this.whereOnline = false;
        this.whereInPerson = false;
        this.whereBoth = false;
        this.instantSessionCheckboxComp.toArray()[0].clearCheckbox();
        this.notifyChange();
    }

    /**
     * General Availability time event.
     */
    public onGeneralAvailabilityChange(event: any): void {
        if (this.filters.specific !== undefined) {
            delete this.filters.specific;
        }
        this.filters.when = event;
        this.notifyChange();
    }

    /**
     * Specific Availability time event.
     * @param event
     */
    public onSpecificAvailabilityChange(event: any): void {
        if (this.filters.when !== undefined) {
            delete this.filters.when;
        }
        this.filters.specific = event;
        this.notifyChange();
    }

    /**
     * Returns whether user has selected a filter for the specified category.
     * @param {string} section
     * @return {boolean}
     */
    public hasFilterFor(section: string): boolean {
        switch (section) {
            case 'when':
                const general = this.filters.when !== undefined && this.filters.when !== '';
                const specific = this.filters.specific !== undefined;
                return general || specific;
            case 'where':
                return this.filters.where !== undefined && Object.keys(this.filters.where).length > 0;
            case 'price':
                return this.filters.price !== undefined;
        }
        return false;
    }

    /**
     * Location type and state event.
     */
    private onWhereChanged(kind: string, state: boolean) {
        if (this.whereOnline && !this.whereInPerson) {
            this.panels.globals.set('meet', 2);
            this.panels.globals.set('meet', 2);
        } else if (!this.whereOnline && this.whereInPerson) {
            this.panels.globals.set('meet', 4);
        } else {
            this.panels.globals.set('meet', 2);
        }

        switch (kind) {
            case 'online':
                if (state) {
                    this.filters.where = this.filters.where || <any>{};
                    this.filters.where.online = true;
                } else {
                    delete this.filters.where.online;
                }
                break;
            case 'inperson':
                if (state) {
                    this.filters.where = this.filters.where || <any>{};
                    this.filters.where.inperson = this.latestFoundLocation || this.whereInPersonZipCode;
                    this.initGoogleLocations();
                } else {
                    delete this.filters.where.inperson;
                }
                break;
        }

        if (Object.keys(this.filters.where).length === 0) {
            delete this.filters.where;
        }
        this.notifyChange();
    }

    /**
     * Return whether autolocation is available.
     * @return {boolean}
     */
    public isLocationAvailable() {
        return Boolean(navigator.geolocation);
    }

    /**
     * Get the current location.
     */
    public getMyLocation() {
        this.locating = true;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(({coords}) => {
                this.latestFoundLocation = [
                    coords.latitude,
                    coords.longitude,
                ];

                this.filters.where.inperson = this.latestFoundLocation;
                this.locating = false;
                this.notifyChange();
                this.updateAddressFromLocation(this.filters.where.inperson);
            }, error => {
                this.locating = false;
                this.notifications.notify('Failed retrieving location', 'Couldn\'t retrieve location.');
            });
        } else {
            this.notifications.notify('Failed retrieving location', 'Retrieving location isn\'t available.');
        }
    }

    /**
     * Where filter 'online' event.
     * @param event
     */
    public onWhereOnlineChange(event: boolean) {
        this.onWhereChanged('online', event);
        if (!event) {
            this.whereBoth = false;
        }
        if (event && this.whereInPerson) {
            this.whereBoth = true;
        }
    }

    /**
     * Where filter 'in person' event.
     * @param event
     */
    public onWhereInPersonChange(event: boolean) {
        this.onWhereChanged('inperson', event);
        if (!event) {
            this.whereBoth = false;
        } else {
            this.whereInPersonZipCode = '';
        }
        if (event && this.whereOnline) {
            this.whereBoth = true;
        }
    }

    /**
     * Where filter 'both' event.
     * @param event
     */
    public onBothWhereChange(event: boolean) {
        this.whereOnline = event;
        this.onWhereOnlineChange(event);
        this.whereInPerson = event;
        this.onWhereInPersonChange(event);
    }

    /**
     * Clear when, where or instant session filter from searching for buttons in SearchComponent.
     * @param filterKey
     * @param whenIndex
     * @param whenFilter
     */
    public clearFilterFromSearchingFor(filterKey: string, whenIndex: number | null, whenFilter: WhenFilterDayInfo | null) {
        if (whenIndex || whenIndex === 0) {
            const localGeneralAvailabilityComp = this.generalAvailabilityComp.toArray();
            if (localGeneralAvailabilityComp.length > 0) {
                localGeneralAvailabilityComp[0].clearGeneralAvailabilityFilter(whenIndex, whenFilter);
            }
            this.notifyChange();
        } else {
            switch (filterKey) {
                case 'specific':
                    const localSpecificAvailabilityComp = this.specificAvailabilityComp.toArray();
                    if (localSpecificAvailabilityComp.length > 0) {
                        localSpecificAvailabilityComp[0].date = null;
                    }
                    break;
                case 'meetOnline':
                    this.whereOnline = false;
                    break;
                case 'meetPlace':
                    this.whereInPerson = false;
                    break;
                case 'instantSession':
                    this.instantSessionCheckboxComp.toArray()[0].clearCheckbox();
                    break;
            }
            this.whereBoth = this.whereOnline && this.whereInPerson;
        }
    }

    /**
     * Price change event.
     * @param event
     */
    public onPriceChange(event: any) {
        this.filters.price = event;
        this.notifyChange();
    }

    /**
     * Instant session change event.
     * @param event
     */
    public onInstantSessionChange(event: any): void {
        if (event === true) {
            this.filters.instantSession = event;
        } else if (event === false && this.filters.instantSession === true) {
            delete this.filters.instantSession;
        }
        this.notifyChange();
    }

    /**
     * Whether filters are set or not.
     * @return {boolean}
     */
    public get hasFilters(): boolean {
        return Object.keys(this.filters).length > 0;
    }

    /**
     * Apply filters.
     * @param {SearchFilters} filters
     */
    public setFilters(filters: SearchFilters): void {
        this.filters = filters;

        if (filters.where && filters.where.online) {
            this.whereOnline = true;
        }

        if (filters.where && filters.where.inperson) {
            this.whereInPerson = true;

            this.latestFoundLocation = <number[]>filters.where.inperson;
            this.updateAddressFromLocation(<number[]>filters.where.inperson);

            this.initGoogleLocations();
        }

        // prevent errors from rapidly toggling instant session
        if (!this.cd['destroyed']) {
            this.cd.detectChanges();
        }
    }

    /**
     * Update user address from location.
     * @param {number[]} coords
     */
    private updateAddressFromLocation(coords: number[]): void {
        if (coords === null || coords === undefined || !Array.isArray(coords)) {
            return;
        }

        if (coords.length === 0) {
            return;
        }

        this.backend.getGeocodeByAddress(coords.join(',')).subscribe(locations => {
            if (locations && locations.length > 0) {
                this.whereInPersonZipCode = locations[0].toString();
            }
        });
    }

    /**
     * Return default price interval.
     * @return {PriceIntervalValue}
     */
    public get defaultPriceInterval(): PriceIntervalValue {
        return new PriceIntervalValue(30, 60);
    }

    /**
     * Output changes made to filters.
     */
    private notifyChange(): void {
        this.change.next(this.filters);
        this.searchService.filterClicked.next(true);
    }

    /**
     * Initialize Google map locations.
     */
    private initGoogleLocations(): void {
        if (this.searchInputTry > 20) {
            // can't get the search input after 6 seconds, something bad happened
            return;
        }

        if (!this.searchElementRef) {
            // the DOM wasn't updated yet, wait a bit
            this.searchInputTry++;

            setTimeout(() => this.initGoogleLocations(), 300);
            return;
        }

        this.mapsApiLoader.load().then(() => {
            const autocomplete = new google.maps.places.Autocomplete(this.searchElementRef.nativeElement, {
                    // types: ['address']
                });

            autocomplete.addListener('place_changed', () => {
                this.ngZone.run(() => {
                    const place: google.maps.places.PlaceResult = autocomplete.getPlace();

                    if (place.geometry === undefined || place.geometry === null) {
                        return;
                    }

                    this.latestFoundLocation = [
                        place.geometry.location.lat(),
                        place.geometry.location.lng()
                    ];

                    this.filters.where = this.filters.where || <any>{};
                    this.filters.where.inperson = this.latestFoundLocation;
                    this.notifyChange();
                });
            });
        });
    }

    /**
     * Toggle filters on mobile.
     */
    public toggleFilters() {
        if (!this.mobile) {
            return;
        }
        this.menuExpanded = !this.menuExpanded;
        this.searchService.filterClicked.next(true);
    }
}
