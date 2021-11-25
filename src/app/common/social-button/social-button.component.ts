import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';

/**
 * Social login / sign up buttons
 * Input social - (string) facebook | google
 * Input action - (string, optional) login - to show as login button 
 */
type Action = 'login' | 'signup'

@Component({
    selector: 'learnt-social-button',
    templateUrl: './social-button.component.html',
    styleUrls: ['./social-button.component.scss']
})
export class SocialButtonComponent implements OnInit { 
    @Input() social: string;
    @Input() action: Action;
    @Input() disabled: boolean;
    @Output() clicked: EventEmitter<void>;
    @ViewChild('button', {static: true}) button: ElementRef<HTMLButtonElement>;

    constructor() {
        this.clicked = new EventEmitter();
    }

    ngOnInit(): void {
        const btn = this.button.nativeElement;
        btn.classList.add('btn--social-' + this.social);
    }

    getTextContent(): string {
        if (this.action === 'login') {
            if (this.social === 'facebook') {
                return 'Log in with Facebook';
            }
            if (this.social === 'google') {
                return 'Log in with Google';
            } 
        }
        if (this.social === 'facebook') {
            return 'Sign up with Facebook';
        }
        if (this.social === 'google') {
            return 'Sign up with Google';
        }
        return '';
    }
    
    getIcon(): string {
        if (this.social === 'facebook') {
            return 'facebook-login';
        }
        if (this.social === 'google') {
            return 'google-login';
        }
    }

    onClick(evt: MouseEvent): void {
        this.clicked.emit();
    }
}
