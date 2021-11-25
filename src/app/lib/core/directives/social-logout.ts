import { Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { SocialService } from '../../../services/social-service';
import { SocialResponseEntity } from '../entities/social-response.entity';
import { SocialErrorEntity } from '../entities/social-error.entity';

@Directive({
  selector: '[social-logout]'
})
export class SocialLogoutDirective {

  @Input('social-logout') socialLogout: string;
  @Input() configs: {};

  @Output() successEvent: EventEmitter<SocialResponseEntity> = new EventEmitter<SocialResponseEntity>();
  @Output() errorEvent: EventEmitter<{ error: { code, message }, network }> = new EventEmitter<{ error: { code, message }, network }>();

  constructor(private socialService: SocialService) {
  }

  @HostListener('click') onClick() {
    this.socialService.logout(this.socialLogout, this.configs)
        .subscribe((response: SocialResponseEntity) => {
          this.successEvent.emit(response);
        }, (error: SocialErrorEntity) => {
          this.errorEvent.emit(error);
        });
  }

}