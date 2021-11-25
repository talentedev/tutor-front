import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import { SocialResponseEntity } from '../lib/core/entities/social-response.entity';
import { SocialErrorEntity } from '../lib/core/entities/social-error.entity';
import * as hello from 'hellojs-learnt';

@Injectable({providedIn:'root'})
export class SocialService {

  // noinspection JSMethodCanBeStatic
  init(credentials: {}, options?: {}) {
    hello.init(credentials, options);
  }

  // noinspection JSMethodCanBeStatic
  getAuthResponse(network: string): {} {
    return hello(network).getAuthResponse();
  }

  login(network: string, options?: {}): Observable<SocialResponseEntity> {
    return new Observable(observer => {
      hello(network).login(options).then(data => {
        const response = new SocialResponseEntity(data);
        observer.next(response);
        observer.complete();
      }, error => {
        const response = new SocialErrorEntity(error);
        observer.error(response);
      });
    });
  }

  logout(network: string, options?: {}): Observable<SocialResponseEntity> {
    return new Observable(observer => {
      hello(network).logout(options).then(data => {
        const response = new SocialResponseEntity(data);
        observer.next(response);
        observer.complete();
      }, error => {
        const response = new SocialErrorEntity(error);
        observer.error(response);
      });
    });
  }

  api(network: string, path: string, method?: string, configs?: Object): Observable<{}> {
    return new Observable(observer => {
      hello(network).api(path, method, configs).then(data => {
        observer.next(data);
        observer.complete();
      }, error => {
        const response = new SocialErrorEntity(error);
        observer.error(response);
      });
    });
  }

  // noinspection JSMethodCanBeStatic
  on(event, callback) {
    hello.on(event, callback);
  }

  // noinspection JSMethodCanBeStatic
  off(event, callback) {
    hello.off(event, callback);
  }

}