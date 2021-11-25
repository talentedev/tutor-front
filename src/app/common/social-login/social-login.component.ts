import {Platform} from '../../services/platform';
import {AlertService} from '../../services/alerts';
import {Component, HostBinding, OnInit} from '@angular/core';
import {Auth, Backend} from '../../lib/core/auth';
import { HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { Cookie } from 'app/lib/core/common/cookie';
import { environment } from 'environments/environment';

@Component({
    selector: 'learnt-social-login',
    templateUrl: './social-login.component.html',
    styleUrls: ['./social-login.component.scss']
})
export class SocialLoginComponent implements OnInit {
    authToken: string;
    authVerifier: string;
    socials: string[] = [];

    constructor(private alerts: AlertService,
                private platform: Platform,
                private backend: Backend,
                private auth: Auth,
                private route: ActivatedRoute) {

        if (platform.setting('login_with_facebook', false) === true) {
            this.socials.push('facebook');
        }
        if (platform.setting('login_with_twitter', false) === true) {
            this.socials.push('twitter');
        }
        if (platform.setting('login_with_google', false) === true) {
            this.socials.push('google');
        }
        if (platform.setting('login_with_tumblr', false) === true) {
            this.socials.push('linkedin');
        }

    }

    @HostBinding('style.display')
    get styleDisplaly(): string {
        return this.socials.length > 0 ? '' : 'none';
    }

    ngOnInit() {
    }

    serviceLogin(social: string) {
        this.alerts.alert(
            `Login with ${social} is not implemented yet!`
        );
    }

}
