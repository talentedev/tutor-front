import {Notification, User} from '../../models';
import {Component, ComponentRef, ElementRef, EventEmitter, Injectable, Injector, OnInit, Output, ViewChild} from '@angular/core';
import {Overlay, OverlayConfig} from '@angular/cdk/overlay';
import {ComponentPortal} from '@angular/cdk/portal';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Auth, Backend} from '../../lib/core/auth';
import {HttpResponse, HttpErrorResponse} from '@angular/common/http';
import {AlertService} from '../../services/alerts';
import {NewAlertService} from '../../services/new-alert';
import {NotificationsService} from '../../services/notifications';

@Component({
    selector: 'learnt-tutor-rate',
    templateUrl: './tutor-rate.component.html',
    styleUrls: ['./tutor-rate.component.scss']
})
export class TutorRateComponent implements OnInit {

    @ViewChild('publicReview')
    publicReview: ElementRef;

    @ViewChild('privateReview')
    privateReview: ElementRef;

    @Output()
    close: EventEmitter<any> = new EventEmitter(true);

    @Output()
    done: EventEmitter<boolean> = new EventEmitter<boolean>();

    public rating = 0;
    public rateForm: FormGroup;

    private me: User;
    private _tutor: User;
    private _notification: Notification;

    private notificationsService: NotificationsService;

    constructor(private backend: Backend,
                private alerts: AlertService,
                private newalerts: NewAlertService,
                private injector: Injector,
                private auth: Auth) {

        this.notificationsService = this.injector.get(NotificationsService);

        this.rateForm = new FormGroup({
            communication: new FormControl(0, Validators.compose([Validators.required, Validators.min(1)])),
            clarity: new FormControl(0, Validators.compose([Validators.required, Validators.min(1)])),
            helpfulness: new FormControl(0, Validators.compose([Validators.required, Validators.min(1)])),
            patience: new FormControl(0, Validators.compose([Validators.required, Validators.min(1)])),
            professionalism: new FormControl(0, Validators.compose([Validators.required, Validators.min(1)])),
        });
    }

    public get tutor(): User {
        return this._tutor;
    }

    public set tutor(value: User) {
        this._tutor = new User(value);
    }

    public get notification(): Notification {
        return this._notification;
    }

    public set notification(value: Notification) {
        this._notification = value;
    }

    ngOnInit() {
        this.newalerts.alert('Tutor reviewed', 'Thank you for leaving a review!');
        for (const c in this.rateForm.controls) {
            this.rateForm.get(c).setValue(this.rating);
        }

        this.auth.me.subscribe((u: User) => {
            this.me = u;
            this.getMyReview();
        });
    }

    private getMyReview(): void {
        if (this.me === null || this.me === undefined) {
            return;
        }

        if (this.tutor._id === this.me._id) {
            this.removeNotification();
            return;
        }

        this.backend.getSubmittedReviews(this.tutor._id).subscribe(
            () => this.removeNotification(),
            () => false
        );
    }

    private removeNotification(): void {
        this.close.next();

        if (this.notification === undefined) {
            return;
        }

        this.notificationsService.remove(this.notification).subscribe(
            () => true,
            (err: HttpErrorResponse) => console.log('[!] Error removing notification', err));
    }

    public getRating(name: string): number {
        const formEntry = this.rateForm.get(name);
        if (formEntry === null || formEntry === undefined) {
            return;
        }
        return formEntry.value;
    }

    public setRating(name: string, rating: number): void {
        if (isNaN(rating)) {
            return;
        }

        const formEntry = this.rateForm.get(name);
        if (formEntry === null || formEntry === undefined) {
            return;
        }
        formEntry.setValue(rating);
    }

    public get canSendReview(): boolean {

        const publicReview = this.publicReview ? (<HTMLDivElement>this.publicReview.nativeElement).innerText.trim() : '';
        
        return this.rateForm.valid && publicReview !== '';
    }

    public sendReview(): void {
        const payload: any = {
            communication: this.getRating('communication'),
            clarity: this.getRating('clarity'),
            professionalism: this.getRating('professionalism'),
            patience: this.getRating('patience'),
            helpfulness: this.getRating('helpfulness'),
            title: '',
            public: '',
            private: '',
        };

        const publicReview = (<HTMLDivElement>this.publicReview.nativeElement).innerText.trim();
        const privateReview = (<HTMLDivElement>this.privateReview.nativeElement).innerText.trim();

        if (publicReview === '') {
            return;
        }

        payload.title = 'Review';
        payload.public = publicReview;
        payload.private = privateReview;

        this.backend.createReview(this.tutor._id, payload).subscribe((r: Response) => {
            this.removeNotification();
            this.newalerts.alert('Tutor reviewed', 'Thank you for leaving a review!');
            this.done.next(true);
        }, (e: HttpErrorResponse) => {
            const err = e.error; // TEST

            switch (err.error_type) {
                case 0: // invalid user id
                case 1: // user not found
                case 2: // not a tutor
                    break;
                case 3: // already reviewed
                    this.alerts.alert('Couldn\'t post review', `You already sent a review for ${this.tutor.name}.`);
                    break;
                case 4: // invalid form
                    const invalidFormMessage = 'Invalid form provided, please refresh the page and try again';
                    this.alerts.alert('Couldn\'t post review', invalidFormMessage);
                    break;
                case 5: // error on insert
                case 6: // error on update
                default:
                    let defaultMessage = 'We encountered an error while trying to post the review. ';
                    defaultMessage += 'Please try again later.';
                    this.alerts.alert('Couldn\'t post review', defaultMessage);
            }
        });
    }
}

@Injectable()
export class TutorRateDialog {

    private _notification: Notification;

    constructor(private overlay: Overlay) {
    }

    public fromNotification(n: Notification) {
        this._notification = n;
    }

    public show(tutor: User, rating: number = 0): EventEmitter<boolean> {
        const state = new OverlayConfig();
        state.hasBackdrop = true;
        state.positionStrategy = this.overlay.position().global().centerHorizontally().centerVertically();

        const overlayRef = this.overlay.create(state);
        const portal: ComponentPortal<TutorRateComponent> = new ComponentPortal(TutorRateComponent);
        const componentRef: ComponentRef<TutorRateComponent> = overlayRef.attach(portal);

        componentRef.instance.notification = this._notification;
        componentRef.instance.tutor = tutor;
        componentRef.instance.rating = rating;
        componentRef.instance.close.subscribe(() => overlayRef.dispose());

        return componentRef.instance.done;
    }
}
