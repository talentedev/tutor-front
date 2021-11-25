import {Logger} from '../../lib/core/common/logger';
import {Coordinate, User} from '../../models';
import {environment} from '../../../environments/environment';
import {loadScript, loadStyle} from '../../lib/core/utils';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    NgZone,
    OnChanges,
    OnInit,
    Output,
    ViewChild,
} from '@angular/core';

const MAPBOX_LIBRARY_JS = 'https://api.mapbox.com/mapbox.js/v3.1.1/mapbox.js';
const MAPBOX_LIBRARY_CSS = 'https://api.mapbox.com/mapbox.js/v3.1.1/mapbox.css';

let L: any;

@Component({
    selector: 'learnt-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapComponent implements OnInit, OnChanges {

    @ViewChild('container')
    public container: ElementRef;

    private disposeMapBoxScript: Function;
    private disposeMapBoxStyles: Function;

    public loading = false;

    private map: any;

    private markersLayer: any;

    private initialRender = true;

    @Input()
    public tutors: User[] = [];

    @Input()
    public center: Coordinate = new Coordinate();

    @Input()
    public zoom: number;

    @Output()
    public select: EventEmitter<User> = new EventEmitter();

    @Output()
    public over: EventEmitter<{ user: User, event: MouseEvent }> = new EventEmitter();

    @Output()
    public out: EventEmitter<User> = new EventEmitter();

    @Input()
    public interactive = false;

    public readonly ready: EventEmitter<any> = new EventEmitter(true);

    constructor(private ngZone: NgZone,
                private logger: Logger,
                private cd: ChangeDetectorRef) {
    }

    ngOnInit(): void {
        this.disposeMapBoxScript = loadScript(MAPBOX_LIBRARY_JS, this.onMapBoxLoaded.bind(this));
        this.disposeMapBoxStyles = loadStyle(MAPBOX_LIBRARY_CSS, this.disposeMapBoxScript.bind(this));
    }

    private onMapBoxLoaded(): void {
        if (this.loading) {
            return;
        }

        this.loading = true;
        L = window['L'];
        L.mapbox.accessToken = environment.MAPBOX_TOKEN;

        // initialize our map
        this.map = L.mapbox.map(this.container.nativeElement, 'mapbox.streets', {
            zoomControl: false,
            maxZoom: 15,
            minZoom: 7,
        });

        if (!this.interactive) {
            // this.map.dragging.disable();
            this.map.touchZoom.disable();
            this.map.doubleClickZoom.disable();
            this.map.scrollWheelZoom.disable();
            this.map.keyboard.disable();
        }

        this.markersLayer = L.mapbox.featureLayer().addTo(this.map);

        this.markersLayer.on('layeradd', (e) => {
            const marker = e.layer,
                feature = marker.feature;
            marker.setIcon(L.divIcon(feature.properties.icon));
        });

        this.markersLayer.on('mouseover', (e) => {
            this.ngZone.run(() => {
                this.over.next({
                    user: e.layer.feature.properties.tutor,
                    event: e.originalEvent
                });
            });
        });

        this.markersLayer.on('mouseout', (e) => {
            this.ngZone.run(() => {
                this.out.next(e.layer.feature.properties.tutor);
            });
        });

        this.markersLayer.on('click', (e) => {
            this.ngZone.run(() => {
                this.select.next(e.layer.feature.properties.tutor);
            });
        });

        try {
            this.renderMarkers();
        } catch (e) {
            console.log({renderMarkersErr: e});
        }

        this.ready.next();

        this.loading = false;
        if (!this.cd['destroyed']) {
            this.cd.detectChanges();
        }
    }

    ngOnChanges(change) {
        if (this.loading || this.map === null || this.map === undefined) {
            return;
        }

        if (change.tutors) {
            this.renderMarkers();
        }

        if (change.center || change.zoom) {
            this.initialRender ? this.renderMarkers() : this.map.setView([this.center.lng, this.center.lat], this.zoom);
        }
    }

    private renderMarkers(): void {
        if (this.tutors === null || this.tutors === undefined) {
            return;
        }

        if (this.center === undefined) {
            this.logger.warn('No center for the map');
            return;
        }

        const features = [];
        let coords;

        for (let i = 0; i < this.tutors.length; i++) {
            const user = this.tutors[i];
            const location = user.location;

            if (location === undefined || location.position === undefined || location.position.coordinates === undefined) {
                continue;
            }

            coords = location.position.coordinates;

            if (coords === undefined) {
                this.logger.warn(
                    'User has no coordinates on his position!',
                    this.logger.data('location', location),
                );

                continue;
            }

            if (!coords.lat || !coords.lng) {
                this.logger.warn(
                    'Lat/Lng missing from user coordinates!',
                    this.logger.data('coords', coords),
                );

                continue;
            }

            features.push({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [coords.lng, coords.lat],
                },
                properties: {
                    tutor: user,
                    icon: {
                        className: 'map-user-marker',
                        html: `<div><img src="${user.avatar}" alt="${user.shortName}'s profile picture"/></div>`,
                        iconSize: null,
                    },
                },
            });
        }

        this.map.setView([this.center.lat, this.center.lng], this.zoom);

        this.markersLayer.setGeoJSON({
            type: 'FeatureCollection',
            features: features
        });

        this.initialRender = false;
    }
}
