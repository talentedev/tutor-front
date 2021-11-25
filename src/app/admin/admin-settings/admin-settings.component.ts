import { NotificationsService } from '../../services/notifications';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs/Rx';
import { Backend } from '../../lib/core/auth';
import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';

@Component({
    selector: 'learnt-admin-settings',
    templateUrl: './admin-settings.component.html',
    styleUrls: ['./admin-settings.component.scss']
})
export class AdminSettingsComponent implements OnInit {

    settings: any;
    form: FormGroup;
    intv: any;

    keyword: string;

    constructor(
        private backend: Backend,
        private formBuilder: FormBuilder,
        private notifications: NotificationsService
    ) {}

    ngOnInit() {
        this.backend.getPlatformSettings().subscribe(
            settings => {

                this.settings = settings;

                const controls = {};

                for (let i = 0; i < settings.length; i++ ) {
                    controls[settings[i].name] = settings[i].value;
                }

                this.form = this.formBuilder.group(controls);

                this.form.valueChanges.subscribe(
                    this.valuesChanged.bind(this)
                );
            }
        );
    }

    typeofValue(value: any): string {
        return typeof(value);
    }

    filter(items: any[]) {

        if (!this.keyword) {
            return items;
        }

        return items.filter(i => {
            if (i.name.indexOf(this.keyword) !== -1) {
                return true;
            }
            if (i.description.indexOf(this.keyword) !== -1) {
                return true;
            }
            return false;
        });
    }

    valuesChanged() {
        if (this.intv) { clearTimeout(this.intv); }
        this.intv = setTimeout(this.save.bind(this), 1000);
    }

    save() {
        this.backend.setPlatformSettings(this.form.getRawValue()).subscribe(
            response => this.notifications.notify('Platform Settings', 'Settings Update', 'tick', 1000),
            err => this.notifications.notify('Error', err.json().error, 'users', 10000),
        );
    }
}
