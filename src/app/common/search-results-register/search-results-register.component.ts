import { Backend } from '../../lib/core/auth';
import { NotificationsService } from '../../services/notifications';
import { AlertService } from '../../services/alerts';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';

@Component({
    selector: 'learnt-search-results-register',
    templateUrl: './search-results-register.component.html',
    styleUrls: ['./search-results-register.component.scss']
})
export class SearchResultsRegisterComponent implements OnInit, OnDestroy {

    action: string;

    form: FormGroup;

    working: boolean;

    data: any;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private alerts: AlertService,
        private notifications: NotificationsService,
        private injector: Injector,
        private fb: FormBuilder,
        private backend: Backend,
    ) {

        this.form = fb.group({
            referral: [],
            first_name: [],
            last_name: [],
            email: ['', Validators.email],
            password: [],
            password_verify: ['', this.verifyPassword.bind(this)],
        });

    }

    verifyPassword(control: FormControl) {

        if (!this.form) {
            return;
        }

        if (this.form.get('password').value !== control.value) {
            return {passwordMatch: true};
        }

        return;
    }

    ngOnInit() {}

    ngOnDestroy() { }

    init(data: any) {
        this.data = data;
    }

    login() {
        this.injector.get('results').setExpandView('login');
    }

    register() {
        const raw = this.form.getRawValue();
        this.working = true;
        this.backend.registerStudent(raw).subscribe(
            resoonse => {
                this.working = false;
                this.injector.get('results').setExpandView('login', this.data);
                this.alerts.alert('You are now registered! Please verify your email to continue.');
            },
            err => {
                this.working = false;
                this.alerts.alert('Failed to register', err.error);
            }
        );
    }
}
