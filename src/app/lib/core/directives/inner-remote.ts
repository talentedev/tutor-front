import { Input, ElementRef, OnInit, Directive } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';

// tslint:disable-next-line:directive-selector
@Directive({selector: '[innerRemote]'})
export class InnerRemoteDirective implements OnInit {

    @Input()
    innerRemote: string;

    @Input()
    contentType: string;

    constructor(private ref: ElementRef, private http: HttpClient) {}

    ngOnInit() {
        this.http.get(this.innerRemote).subscribe(
            (response: HttpResponse<string> ) => {
                if (this.contentType && this.contentType !== response.headers.get('Content-Type')) {
                    return console.error('Expected content type for inner remote data of ', this.innerRemote, 'is', this.contentType);
                }
                this.ref.nativeElement.innerHTML = response.body;
            },
            error => console.error('Fail getting remote endpoint as content from', this.innerRemote)
        );
    }
}
