import { AlertService } from '../../services/alerts';
import { Auth, Backend } from '../../lib/core/auth';
import { FormControl, Validators } from '@angular/forms';
import { Component, Injector, OnInit } from '@angular/core';

@Component({
    selector: 'learnt-search-results-recover-password',
    templateUrl: './search-results-recover-password.component.html',
    styleUrls: ['./search-results-recover-password.component.scss']
})
export class SearchResultsRecoverPasswordComponent implements OnInit {

    email: FormControl;

    saving: boolean;

    data: any;

    constructor(
        private auth: Auth,
        private backend: Backend,
        private alerts: AlertService,
        private injector: Injector
    ) {
        this.email = new FormControl('', Validators.email);
    }

    ngOnInit() {}

    cancel() {
        this.injector.get('results').setExpandView('login');
    }

    init(data: any) {
        this.data = data;
    }

    save() {
        this.backend.recoverPassword(this.email.value).subscribe(
            () => {
                this.injector.get('results').closeExpandView();
                this.alerts.alert('If your email exists in our system you will receive an email with recover url.');
            },
            () => this.alerts.alert('Recover password email failed'),
        );
    }
}
