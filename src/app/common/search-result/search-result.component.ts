import {Auth, Backend} from '../../lib/core/auth';
import {
    SearchResultsProfileDetailsComponent,
} from '../search-results-profile-details/search-results-profile-details.component';
import {SearchResultsComponent} from '../search-results/search-results.component';
import {getQueryString} from '../../lib/core/utils';
import {Router} from '@angular/router';
import {User} from '../../models';
import {
    ChangeDetectorRef,
    Component,
    ComponentFactoryResolver,
    ComponentRef,
    HostBinding,
    Inject,
    Input,
    OnChanges,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';
import { map } from 'rxjs/operators';
import { APP_ROUTES, IRoutes } from 'routes';

@Component({
    selector: 'learnt-search-result',
    templateUrl: './search-result.component.html',
    styleUrls: ['./search-result.component.scss'],
})
export class SearchResultComponent implements OnChanges {

    @Input()
    tutor: User;

    @Input()
    @HostBinding('class.disabled')
    disabled: boolean;

    @Input()
    @HostBinding('class.focused')
    focused: boolean;

    @Input()
    @HostBinding('attr.data-index')
    index: number;

    profileLoading = true;

    cached: boolean;

    @ViewChild('details', {read: ViewContainerRef})
    detailsContainer: ViewContainerRef;

    profileComponentRef: ComponentRef<SearchResultsProfileDetailsComponent>;

    me: User;

    constructor(@Inject('resultsExpand') private resultsExpand: (view: string, data: any) => void,
                private resolver: ComponentFactoryResolver,
                private backend: Backend,
                private router: Router,
                private auth: Auth,
                private cdRef: ChangeDetectorRef,
                @Inject(APP_ROUTES) private routes: IRoutes) {
        auth.me.subscribe(me => this.me = me);
    }

    ngOnChanges(changes) {
        if (changes.focused && !this.focused) {
            this.detailsContainer.clear();
            this.profileLoading = true;
        }
    }

    showMore() {
        const q = getQueryString();
        q.tutor = this.tutor._id;
        q.view = 'profile';
        this.router.navigate([this.routes.ROUTE_TUTORS], {queryParams: q});
    }

    createProfileComponent() {
        this.profileComponentRef = this.detailsContainer.createComponent(
            this.resolver.resolveComponentFactory(SearchResultsProfileDetailsComponent)
        );

        this.profileComponentRef.instance.tutor = this.tutor;
        this.profileComponentRef.instance.book.subscribe(
            instant => {
                this.resultsExpand('book', {tutor: this.tutor, instant});
            }
        );

        this.profileLoading = false;

        this.cdRef.detectChanges();
    }

    showProfile() {
        if (this.cached) {
            this.profileComponentRef.instance.tutor = this.tutor;
            return this.cdRef.detectChanges();
        }

        this.profileLoading = true;
        this.backend.getUser(this.tutor._id).subscribe(
            user => {
                this.tutor = user;
                this.cached = true;
                this.createProfileComponent();
            }
        );
    }
}
