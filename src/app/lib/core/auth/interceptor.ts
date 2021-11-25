import { HttpErrorResponse, HttpEvent, HttpEventType, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Inject, Injectable } from "@angular/core";
import { environment } from "environments/environment";
import { Observable } from "rxjs";
import { TOKEN_STORAGE } from "./auth";
import { TokenStorage } from './storage';

@Injectable({providedIn: 'root'})
export class HttpAuthorizationInterceptor implements HttpInterceptor {

    constructor(@Inject(TOKEN_STORAGE) private tokenProvider: TokenStorage) {}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return new Observable(sub => {
            this.tokenProvider.get().then(token => {

                let noredirect: boolean;

                if (request.url.indexOf('@api') === 0) {

                    let headers = {}

                    if (token) {
                        headers = {
                            'Authorization': `Bearer ${token}`,
                        }
                    }

                    if (request['skipRedirect']) {
                        noredirect = true;
                    }

                    request = request.clone({
                        url: environment.API_HOST + request.url.substring(4),
                        setHeaders: headers,
                    });
                }

                next.handle(request).subscribe(
                    
                    (response: HttpResponse<any>) => {
                        
                        if (response instanceof HttpResponse && response.type == HttpEventType.Response) {
                            sub.next(response)
                            sub.complete()
                        }
                    },

                    (response: HttpErrorResponse) => {
                        sub.error(response)
                        sub.complete()
                    },

                    () => {
                        sub.complete()
                    }
                );

            }).catch((err) => {
                sub.error(err)
                sub.complete()
            })
        });
    }
}