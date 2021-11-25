
import { User } from '../../models';
import { AlertService } from '../../services/alerts';
import { Auth, Backend } from '../../lib/core/auth';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ChangeDetectorRef, Component, Injector, OnInit } from '@angular/core';

@Component({
    selector: 'learnt-search-results-credit-card',
    templateUrl: './search-results-credit-card.component.html',
    styleUrls: ['./search-results-credit-card.component.scss']
})
export class SearchResultsCreditCardComponent implements OnInit {

    tutor: User;

    form: FormGroup;

    saving: boolean;

    state = 'form';

    me: User;

    data: any;

    constructor(
        private auth: Auth,
        private fb: FormBuilder,
        private injector: Injector,
        private backend: Backend,
        private alerts: AlertService,
        private cdRef: ChangeDetectorRef
    ) {
        auth.me.subscribe((me: User) => {

            this.me = me;

            if (me.cc) {
                return this.continue();
            }

            this.form = fb.group({
                name: [ me.profile.first_name + ' ' + me.profile.last_name ],
                number: [],
                year: [],
                month: [],
                cvc: [],
            });
        });
    }

    ngOnInit() {}

    get years(): number[] {
        const now = (new Date()).getUTCFullYear();
        const years = [];
        for (var i = now; i < now + 10; i++) {
            years.push(i);
        }
        return years;
    }

    get months(): string[] {
        return ['January', 'February', 'March', 'April', 'May',
        'June', 'July', 'August', 'September', 'October',
        'November', 'December'];
    }

    continue() {
        this.injector.get('results').setExpandView('book', this.data);
    }

    cancel() {
        this.injector.get('results').closeExpandView();
    }

    init(data: any) {
        this.data = data;
        this.tutor = data.tutor;
    }

    save() {
        this.saving = true;
        this.backend.createCreditCard(this.form.getRawValue()).subscribe(
            () => {
                this.me.cc = true;
                this.saving = false;
                this.state = 'completed';
                this.cdRef.detectChanges();
            },
            err => {
                this.saving = false;
                this.alerts.alert('Error', err.json().error);
                this.cdRef.detectChanges();
            }
        );
    }
}
