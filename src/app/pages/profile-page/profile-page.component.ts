import { ROUTE_TUTORS } from './../../../routes';
import { Location } from '@angular/common';
import {
    Component,
    HostBinding,
    OnInit
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { ROUTE_ANIMATION_DEFAULT } from '../../app.animation';
import { TutorRateDialog } from '../../common/tutor-rate/tutor-rate.component';
import { Auth, Backend } from '../../lib/core/auth';
import { Bus } from '../../lib/core/eventbus';
import { Coordinate, Review, User } from '../../models';
import { AlertService } from '../../services/alerts';
import { LayoutService } from '../../services/layout';
import { MessengerFrontService } from '../../services/messenger';
import { HttpResponse } from '@angular/common/http';
import _get from 'lodash-es/get';

@Component({
    selector: 'learnt-profile-page',
    templateUrl: './profile-page.component.html',
    styleUrls: ['./profile-page.component.scss'],
    animations: [ROUTE_ANIMATION_DEFAULT]
})
export class ProfilePageComponent implements OnInit {

    @HostBinding('class.page-component')
    isPageComponent = true;

    @HostBinding('@routeAnimation')
    routeAnimation = true;

    tutor: User;
    me: User;

    reviewsOffset = 0;
    totalReviews = 0;
    reviews: Review[] = [];
    averageReviews: Review;
    reviewsEndpoint: string;
    userLocationCoords: Coordinate;

    fetchingReviews: boolean;

    public fromSearch = false;

    constructor(private bus: Bus,
                private auth: Auth,
                private backend: Backend,
                private route: ActivatedRoute,
                private router: Router,
                private rate: TutorRateDialog,
                private alerts: AlertService,
                private messenger: MessengerFrontService,
                private location: Location,
                private layoutService: LayoutService) {

        this.layoutService.ShowMenu();
        this.route.queryParams.subscribe(p => {
            if (p.search === null || p.search === undefined) {
                return;
            }
            if (p.search === 'true') {
                this.fromSearch = true;
                this.layoutService.HideMenu();
            }
        });

        this.route.params.subscribe(params => {
            let endpoint = '@api/me';
            if (params.id) {
                endpoint = '@api/users/id/' + params.id;
            }
            this.reviewsEndpoint = endpoint;
            this.fetchReviews();
        });

        this.auth.me.subscribe(me => this.me = me);
    }

    fetchReviews() {
        this.fetchingReviews = true;
        this.backend.get(this.reviewsEndpoint).subscribe(
            (response: HttpResponse<any>) => {

                const search = {
                    limit: 10,
                    offset: this.reviewsOffset,
                };

                this.tutor = new User(response.body);
                if (!this.tutor.isTutor() && !this.isMyProfile) {
                    this.location.back();
                    return;
                }

                this.getUserLocationCoords().subscribe(coords => this.userLocationCoords = coords);

                this.backend.getReviews(this.tutor._id, 10, this.reviewsOffset).subscribe(
                    data => {
                        this.totalReviews = data.total || 0;
                        //FIXME: This line should be verified and fixed
                        this.averageReviews = data.average ? new Review(data.average) : null;
                        this.reviews.push(...data.reviews);
                        this.reviewsOffset += 10;
                        this.fetchingReviews = false;
                    }
                );
            },
            response => {
                if (response.status === 404) {
                    this.alerts.alert('Tutor with this id not found');
                    this.router.navigateByUrl(ROUTE_TUTORS);
                }
            }
        );
    }

    ngOnInit(): void {
        this.layoutService.HideMenu();
    }

    public back(): void {
        this.location.back();
    }

    public get ready(): boolean {
        return this.tutor !== undefined;
    }

    public get isMyProfile(): boolean {
        if (!this.tutor || !this.me) {
            return false;
        }

        return this.tutor._id === this.me._id;
    }

    onRatingSelect(rating: number): void {
        this.rate.show(this.tutor);
    }

    message() {
        this.messenger.createConversationWithTutor(
            this.me,
            this.tutor
        );
    }

    book(instant = false) {
        if (this.auth.isLoggedIn()) {
            const alertRef = this.alerts.alert(
                'Authentication',
                'You need to be logged in in order to book this tutor.',
                {
                    backdropClose: false,
                    lifetime: 0,
                    buttons: [
                        {label: 'Login', result: true},
                        {label: 'Cancel', result: false},
                    ]
                }
            );

            alertRef.result.subscribe(
                login => {
                    alertRef.dispose();
                    if (login) {
                        this.router.navigateByUrl(
                            '/account/login?redirect=' + encodeURIComponent(location.pathname.toString() + location.search)
                        );
                    }
                }
            );
        }
        return;
    }

    getUserLocationCoords(): Observable<Coordinate> {
        const coordinates = _get(this.tutor, 'location.position.coordinates');
        if (coordinates) {
            return <Observable<Coordinate>> (new BehaviorSubject(coordinates));
        }

        return new Observable<Coordinate>(sub => {
            this.backend.getGeocodeByIp().subscribe(
                coords => {
                    if (!coords.lat && !coords.lng) {
                        return sub.next(
                            new Coordinate({lat: 0, lng: 0})
                        );
                    }
                    sub.next(coords);
                    sub.complete();
                }
            );
        });
    }
}
