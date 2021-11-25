import { UserPresence } from './../../lib/core/userpresence';
import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Auth, Backend } from '../../lib/core/auth';
import { User } from '../../models';
import { BookingPanelService } from '../booking-panels/service';
import { fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { getTableDuplicateColumnNameError } from '@angular/cdk/table/table-errors';
import { Router } from '@angular/router';

@Component({
    selector: 'learnt-search-result-tutor',
    templateUrl: './search-result.component.html',
    styleUrls: ['./search-result.component.scss',
        'search-result.mobile.component.scss'],
})
export class SearchResultTutorComponent implements OnInit, OnDestroy {
    @Input()
    tutor: User;

    @Input()
    index: number;

    @Input()
    columns: number;

    @Input()
    arrow = false;

    @Input()
    arrowDirection: 'top' | 'bottom' = 'top';

    @Output()
    slideCards: EventEmitter<{ left: number[], right: number[], clear: boolean }> = new EventEmitter();

    @Output() onMessage: EventEmitter<User> = new EventEmitter<User>();

    @ViewChild('details', { read: ViewContainerRef })
    detailsContainer: ViewContainerRef;

    @ViewChild('mobileDetailsCard', { read: ViewContainerRef }) mobileDetailsCardContainer: ViewContainerRef;

    public loading: boolean;

    public showMobileDetailsActions: boolean;

    me: User | null;

    private subscriptions: Subscription;

    availableInstant: boolean;

    favoriteIcon: string;

    favoriteToolTip: string;

    isFavorite = false;

    @ViewChild('card', { static: true }) cardEl: ElementRef<HTMLDivElement>;

    @Input() focused: boolean;

    constructor(private auth: Auth,
                private userPresence: UserPresence,
                private cdref: ChangeDetectorRef,
                private panels: BookingPanelService,
                private backend: Backend,
								private router: Router) {
        this.subscriptions = new Subscription();
        this.availableInstant = false;
    }

    ngOnInit() {
        this.subscriptions.add(this.auth.me.subscribe((me: User | null) => this.me = me));
        this.subscriptions.add(this.userPresence.changes.subscribe(
            () => {
                this.userPresence.apply(this.tutor);
                this.cdref.detectChanges();
            },
        ));

        if (this.me) {
            this.isFavorite = this.tutor.isFavorite(this.me._id);
        }

        if (this.isFavorite) {
            this.favoriteIcon = 'favorite';
            this.favoriteToolTip = 'Unnotify';
        } else {
            this.favoriteIcon = 'favorite_outline';
            this.favoriteToolTip = 'Notify me when this Tutor is online';
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    /**
     * Whether the tutor has degrees added or not.
     * @return {boolean}
     */
    public get noDegrees(): boolean {
        return !this.tutor.tutoring || !this.tutor.tutoring.degrees || this.tutor.tutoring.degrees.length === 0;
    }

    /**
     * Whether the tutor has subjects added or not.
     * @return {boolean}
     */
    public get noSubjects(): boolean {
        return !this.tutor.tutoring || !this.tutor.tutoring.subjects || this.tutor.tutoring.subjects.length === 0;
    }

    /**
     * Open mobile details card.
     */
    public showMobileDetailsCard(): void {
        const elem = <HTMLElement>this.mobileDetailsCardContainer.element.nativeElement;
        const style = elem.style;

        style.opacity = '1';
        style.transform = 'scale(1)';

        this.showMobileDetailsActions = true;
    }

    /**
     * Close mobile details card.
     */
    public hideMobileDetailsCard(): void {
        const elem = this.mobileDetailsCardContainer.element.nativeElement;
        const style = elem.style;

        style['opacity'] = 0;
        style['transform'] = 'scale(0)';

        this.showMobileDetailsActions = false;
    }

    /**
     * Book now button.
     */
    public bookNow(): void {
        if (!this.me) {
            this.panels.openLoginPanel().then(() => {
                this.panels.openBookingPanel(this.tutor);
            });
            return;
        }
        this.panels.openBookingPanel(this.tutor);
    }

    /**
     * Instant Session button.
     */
    public instantSession(): void {
        if (!this.me) {
            this.panels.openLoginPanel().then(() => {
                this.panels.openInstantSessionPanel(this.tutor);
            });
            return;
        }
        this.panels.openInstantSessionPanel(this.tutor);
    }

    /**
     * Message Tutor button.
     */
    public messageTutor(): void {
        if (!this.me) {
            this.panels.openLoginPanel().then(() => {
                this.onMessage.next(this.tutor);
            });
            return;
        }

        this.onMessage.next(this.tutor);
    }

    /**
     * Get slider indexes for left & right neighbors.
     * @return {{left: number[], right: number[]}}
     */
    private getSliderIndexes(): { left: number[], right: number[] } {
        const column = this.index % this.columns;
        const left: number[] = [], right: number[] = [];

        // push to the left all items previous to the tutor
        for (let l = this.index - column; l < this.index; l++) {
            left.push(l);
        }

        // push to the right all items next to the tutor
        for (let r = this.index + 1; r < this.index + this.columns - column; r++) {
            right.push(r);
        }

        return { left, right };
    }

    public addRemoveFavorite(tutor_id: string) {
        this.isFavorite ? this.backend.removeFavorite(tutor_id).subscribe(() => {
            this.favoriteIcon = 'favorite_outline';
            this.favoriteToolTip = 'Notify me when this Tutor is online';
        }) : this.backend.addFavorite(tutor_id).subscribe(() => {
            this.favoriteIcon = 'favorite';
            this.favoriteToolTip = 'Unnotify';
        })  
        this.isFavorite = !this.isFavorite
    }

    public goToTutorProfile(tutorId: string) {
        this.router.navigate(['/main/tutor', tutorId], { queryParams: { search: true } });
    }

    get position(): string {
        const pos = this.index % this.columns;
        if (pos == 0) {
            return 'left'
        }
        if (pos === this.columns - 1) {
            return 'right';
        }
        return 'center';
    }
}
