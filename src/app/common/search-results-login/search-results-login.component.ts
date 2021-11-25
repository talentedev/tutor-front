import { SearchResultsComponent } from '../search-results/search-results.component';
import { NotificationsService } from '../../services/notifications';
import { AccountService } from '../../services/account';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertService } from '../../services/alerts';
import { ActivatedRoute, Router } from '@angular/router';
import { ChangeDetectorRef, Component, Injector, OnDestroy, OnInit } from '@angular/core';

@Component({
    selector: 'learnt-search-results-login',
    templateUrl: './search-results-login.component.html',
    styleUrls: ['./search-results-login.component.scss']
})
export class SearchResultsLoginComponent implements OnInit, OnDestroy {

    action: string;

    form: FormGroup;

    working: boolean;

    data: any;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private alerts: AlertService,
        private notifications: NotificationsService,
        private account: AccountService,
        private cdRef: ChangeDetectorRef,
        private injector: Injector,
        private fb: FormBuilder
    ) {
        this.form = fb.group({
            email: ['', Validators.email],
            password: ['', Validators.required],
        });
    }

    ngOnInit() {}

    ngOnDestroy() {}

    init(data: any) {
        this.data = data;
    }

    get results(): SearchResultsComponent {
        return this.injector.get('results');
    }

    login() {
        this.working = true;
        this.account.login(this.form.getRawValue()).then(
            () => {
                this.working = false;
                const results: SearchResultsComponent = this.injector.get('results');
                if (typeof(this.data) === 'function') {
                    setTimeout(() => this.data());
                } else {
                    results.setExpandView('book', {
                        ...this.data,
                        // FIXME: ?
                        //tutor: event.me,
                    });
                }
                this.notifications.notify('Authentication', 'You`re now authenticated!', 'security');
            },
            () => {
                this.working = false;
                this.cdRef.detectChanges();
            }
        );
    }
}
