import { Component } from '@angular/core';
import { SocialService } from '../../services/social-service';
import { BaseSocialComponent } from '../social/base-social.component';

@Component({
  selector: 'social-login-facebook',
  templateUrl: './social-login-facebook.component.html',
  styleUrls: ['./social-login-facebook.component.scss']
})
export class FacebookComponent extends BaseSocialComponent {

  protected network = 'facebook';

  constructor(socialService: SocialService) {
    super(socialService);
  }
}