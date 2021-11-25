import { Location } from '@angular/common';
import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { VerifiedComponent } from '../../common/verified/verified.component';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { APP_ROUTES, IRoutes, ROUTE_TUTORS } from 'routes';
import { BehaviorSubject, Observable } from 'rxjs/Rx';
import { BookingPanelService } from '../../common/booking-panels/service';
import { TutorRateDialog } from '../../common/tutor-rate/tutor-rate.component';
import { Backend, ReviewsResponse } from '../../lib/core/auth';
import { Media } from '../../lib/core/media';
import { Coordinate, OverallReview, Review, User } from '../../models';
import { LayoutService } from '../../services/layout';
import { MessengerFrontService } from '../../services/messenger';
import { NotificationsService } from '../../services/notifications';
import { FacebookShare, SocialSharing } from '../../services/social';
import _get from 'lodash-es/get';

@Component({
    selector: 'learnt-tutor-profile',
    templateUrl: './public-profile.component.html',
    styleUrls: ['./public-profile.component.scss'],
})
export class PublicProfileComponent implements OnInit {

    user: User;
    videourl
    checkVideo = false;
    userCoords: Coordinate;
    alreadyReviewed = false;

    hasReviews = false;
    reviews: Review[];
    reviewsTotal = 0;
    reviewsOverall: OverallReview;

    facebookLink: string;
    twitterLink: string;

    @ViewChild('messageInput')
    messageInput: ElementRef;
    messageInputPristine = true;

    fromSearch = false;
    headless = false;

    private limit = 3;
    offset = 0;

    me: User;

    public mobile: boolean;
    isSearch: boolean;
    profileLink: string;

    favoriteIcon: string;
    favoriteToolTip: string;
    isFavorite = false;

    @ViewChild('videoPlayer') videoplayer: ElementRef;
    @ViewChild('playBtn') playBtn: ElementRef;
    

    constructor(
        private backend: Backend,
        private route: ActivatedRoute,
        private router: Router,
        private location: Location,
        private notifications: NotificationsService,
        private layoutService: LayoutService,
        private rateDialog: TutorRateDialog,
        private social: SocialSharing,
        private messenger: MessengerFrontService,
        private panels: BookingPanelService,
        private media: Media,
        public dialog: MatDialog,
        @Inject(APP_ROUTES) public routes: IRoutes
    ) {
        this.me = this.route.parent.snapshot.data.me
        this.mobile = !media.query('gt-sm');

        media.watch('gt-sm').subscribe(event => {
            this.mobile = !event.active;
        });
    }

    ngOnInit(): void {
        this.getRouteData();
    }

    public get hasUser(): boolean {
        return this.me !== undefined && this.me !== null;
    }

    private buildSocialLinks(): void {
        this.getTwitterShareLink();
        this.getFacebookShareLink();
    }

    private goBackAndNotify(m?: string): void {
        this.location.back();
        this.notifications.notify('Can\'t show page', m ? m : 'The profile page is only available for tutors', 'close');
    }

    private getRouteData(): void {
        // catch URL hash fragments & scroll to element, emulate URL anchors
        this.router.events.subscribe(event => {
            if (!(event instanceof NavigationEnd)) {
                return;
            }

            const tree = this.router.parseUrl(this.router.url);
            if (tree.fragment) {
                const element = document.querySelector(`[name="${tree.fragment}"]`);
                if (element !== null && element !== undefined) {
                    element.scrollIntoView({behavior: 'smooth', block: 'start'});
                }
            }
        });

        // if we're here from search, hide the menu
        this.route.queryParams.subscribe(p => {
            this.isSearch = p.search;
            if (p.search !== null && p.search !== undefined) {
                this.fromSearch = true;
                setTimeout(() => this.layoutService.HideMenu());
                // this.layoutService.HideMenu();
            }

            if (p.headless !== null && p.headless !== undefined) {
                this.headless = true;
            }
        });

        // get user data
        this.route.params.subscribe(params => {
            if (params.id !== null && params.id !== undefined) {
                this.getUserData(params.id);
            } else {
                if (!this.me.isTutor()) {
                    this.goBackAndNotify();
                    return;
                }
                this.getUserData();
            }
        });
    }

    private getUserData(id: string = this.me._id): void {
        if (id === null || id === undefined) {
            throw new Error('null or undefined ID provided to getUserData');
        }

        this.backend.getUser(id).subscribe(user => {

            console.log(user);
            
            if (!user.isTutor()) {
                this.goBackAndNotify();
                return;
            }

            if (user.tutoring === null || user.tutoring === undefined) {
                this.goBackAndNotify('The tutor didn\'t complete his profile yet.');
                return;
            }

            if (user.tutoring.degrees === null || user.tutoring.degrees === undefined) {
                user.tutoring.degrees = [];
            }

            if (user.tutoring.subjects === null || user.tutoring.subjects === undefined) {
                user.tutoring.subjects = [];
            }

            this.user = user;
            if(user.tutoring.video) {
                this.videourl = user.tutoring.video.href
                this.checkVideo = true
            } else {
                this.videourl = ""
                this.checkVideo = false
            }
            this.profileLink = `${location.protocol}//${location.host}/main/tutor/${this.user._id}${this.me && this.me.refer ? '?referrer=' +
                this.me.refer.referral_code : ''}`
            this.getUserCoords().subscribe(c => this.userCoords = c);

            this.buildSocialLinks();
            this.getMyReview();
            this.getReviews();

            this.isFavorite = this.user.isFavorite(this.me?._id);

            if(this.isFavorite) {
                this.favoriteIcon = 'favorite';
                this.favoriteToolTip = 'Unnotify';
            }
            else {
                this.favoriteIcon = 'favorite_outline';
                this.favoriteToolTip = 'Notify me when this Tutor is online';
            }
        });
    }

    private getMyReview(): void {
        if (this.me === null || this.me === undefined) {
            return;
        }

        if (this.user._id === this.me._id) {
            this.alreadyReviewed = true;
            return;
        }

        this.backend.getSubmittedReviews(this.user._id).subscribe(() => {
            this.alreadyReviewed = true;
        }, () => {
            this.alreadyReviewed = false;
        });
    }

    private getReviews(): void {
        if (!this.reviews) {
            this.reviews = [];
        }

        this.backend.getReviews(this.user._id, this.limit, this.offset).subscribe((d: ReviewsResponse) => {
            if (d.average === null || d.average === undefined ||
                d.reviews === null || d.reviews === undefined) {
                return;
            }

            this.reviews.push(...d.reviews);
            this.reviewsTotal = d.total;
            this.reviewsOverall = new OverallReview(d.average);

            this.hasReviews = true;
        }, (e: any) => {
            console.error('Couldn\'t load reviews for tutor.', e);
        });
    }

    public loadMore(): void {
        this.offset += this.limit;
        this.getReviews();
    }

    public getUserCoords(): Observable<Coordinate> {
        const coordinates = _get(this.user, 'location.position.coordinates');
        if (this.user !== undefined && this.user.hasLocation) {
            return <Observable<Coordinate>> (new BehaviorSubject(coordinates));
        }

        return new Observable<Coordinate>(sub => {
            this.backend.getGeocodeByIp().subscribe(coords => {
                if (!coords.lat && !coords.lng) {
                    return sub.next(new Coordinate({lat: 0, lng: 0}));
                }
                sub.next(coords);
                sub.complete();
            });
        });
    }

    videoPlay() {
        this.videoplayer.nativeElement.play();
        this.playBtn.nativeElement.style.display='none'
    }

    openDialog(): void {
        // console.log('test');
        
        // const dialogRef = this.dialog.open(VerifiedComponent, {
        //     maxHeight: '90vh',
        //     width: '95vw',
        //     maxWidth: '500px',
        //     panelClass: 'custom-dialog'
        //     // height: '100%',
        // });
    
        // dialogRef.afterClosed().subscribe(result => {
        //   console.log('The dialog was closed');
        // });
    }

    public tutorRate(rate: number): void {
        this.rateDialog.show(this.user, rate).subscribe(() => {
            this.alreadyReviewed = true;
            this.getReviews();
        });
    }

    public clearMessageIfPristine(): void {
        if (this.messageInputPristine) {
            (<HTMLDivElement>this.messageInput.nativeElement).innerText = '';
        }
    }

    public changedMessage(event: any): void {
        const message = (<HTMLDivElement>this.messageInput.nativeElement).innerText.trim();
        this.messageInputPristine = message === '';
    }

    public sendMessage(): void {
        const message = (<HTMLDivElement>this.messageInput.nativeElement).innerText.trim();
        if (message === '') {
            return;
        }

        this.messenger.createConversationWithTutor(this.me, this.user, message);
        this.messageInputPristine = true;
    }

    public instantSession(): void {
        this.panels.openInstantSessionPanel(
            this.user
        )
    }

    public copyLinkToClipboard(): void {
        if ((<any>navigator).clipboard !== undefined) {
            (<any>navigator).clipboard.writeText(this.profileLink).then(() => {
                this.notifications.notify('Profile link copied to clipboard', '', 'tick');
            }, (err) => {
                this.notifications.notify(`Couldn't copy profile link to clipboard`, '', 'close');
            });
        } else {
            const textarea = document.createElement('textarea');
            textarea.innerText = this.profileLink;
            textarea.focus();
            textarea.select();

            try {
                const success = document.execCommand('copy');
                if (success) {
                    document.removeChild(textarea);
                    this.notifications.notify('Profile link copied to clipboard', '', 'tick');
                } else {
                    this.notifications.notify(`Couldn't copy profile link to clipboard`, '', 'close');
                }
            } catch (err) {
                this.notifications.notify(`Couldn't copy profile link to clipboard`, '', 'close');
            }
        }
    }

    public getFacebookShareLink(): void {
        if (!this.user) {
            return;
        }
        let facebookShare: FacebookShare;
        facebookShare = {
            url: this.profileLink,
            quote: ` ${this.user.name}${this.user.location ? ', ' + this.user.location.city : ''}.
Book a session with this tutor and save $${this.user.tutoring.rate} via my link! @learnt_io`
        }
        this.facebookLink = this.social.FacebookByLink(facebookShare, window.location.href);
    }

    public getTwitterShareLink(): void {
        if (!this.user) {
            return;
        }
        const shareData = ` ${this.user.name}${this.user.location ? ', ' + this.user.location.city : ''}.
Book a session with this tutor and save $${this.user.tutoring.rate} via my link! @learnt_io`;
        this.twitterLink = this.social.TwitterByText(this.profileLink + shareData);
    }

    public addRemoveFavorite(tutor_id: string) {

        if(this.isFavorite) {
            this.backend.removeFavorite(tutor_id).subscribe(() => {
                this.favoriteIcon = 'favorite_outline';
                this.favoriteToolTip = 'Notify me when this Tutor is online';
            });
        }
        else {
            this.backend.addFavorite(tutor_id).subscribe(() => {
                this.favoriteIcon = 'favorite';
                this.favoriteToolTip = 'Unnotify';
            });
        }
    }

    scrollTo(evt: Event, location: string) {
        evt.preventDefault();
        const element  = document.querySelector(location) as HTMLElement;
        const prev = element.previousElementSibling;
        if (prev && prev.classList.contains('panel-title')) {
            prev.scrollIntoView({behavior: 'smooth'});
            return;
        }
        if (element) {
            element.scrollIntoView({behavior: 'smooth'});
        }
    }

		public backToSearch() {
			this.router.navigate(['/main/tutors']);
		}
}
