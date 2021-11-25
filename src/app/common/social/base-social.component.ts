import { SocialResponseEntity } from '../../lib/core/entities/social-response.entity';
import { SocialErrorEntity } from '../../lib/core/entities/social-error.entity';
import { SocialService } from '../../services/social-service';

export abstract class BaseSocialComponent {

  protected network = '';

  constructor(protected socialService: SocialService) {
  }

  // noinspection JSMethodCanBeStatic
  loginSuccessfullyAction(response: SocialResponseEntity) {
    console.log('Login successfully:', response);
  }

  // noinspection JSMethodCanBeStatic
  loginFailedAction(error: SocialErrorEntity) {
    console.log('Login failed:', error);
  }

  // noinspection JSMethodCanBeStatic
  logoutSuccessfullyAction(response: SocialResponseEntity) {
    console.log('Logout successfully:', response);
  }

  // noinspection JSMethodCanBeStatic
  logoutFailedAction(error: SocialErrorEntity) {
    console.log('Logout failed:', error);
  }

  getAuthResponse() {
    const result = this.socialService.getAuthResponse(this.network);
    console.log(result);
  }
}