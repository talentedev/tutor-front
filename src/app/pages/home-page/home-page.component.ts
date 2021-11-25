import { animate, state, style, transition, trigger } from '@angular/animations';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Inject,
    OnDestroy,
    OnInit,
    Renderer2,
    ViewChild,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ActivatedRoute, Router } from '@angular/router';
import _debounce from 'lodash-es/debounce';
import { APP_ROUTES, IRoutes, ROUTE_REGISTER_STUDENT, ROUTE_TUTORS } from 'routes';
import { BehaviorSubject, fromEvent, Subscription } from 'rxjs';
import { debounceTime, throttleTime } from 'rxjs/operators';
import { Auth, Backend } from '../../lib/core/auth';
import { Media } from '../../lib/core/media';
import { Subject } from '../../models';

@Component({
    selector: 'learnt-home-page',
    templateUrl: './home-page.component.html',
    styleUrls: ['./home-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger('scrollAnimation', [
            state('visible', style({transform: 'translateY(0)', opacity: 1, zIndex: 3})),
            state('hidden', style({transform: 'translateY(100%)', opacity: 0, zIndex: 1})),
            state('hidden-up', style({transform: 'translateY(-150%)', opacity: 1, zIndex: 2})),
            state('mobile', style({transform: 'translateY(0)', opacity: 1, position: 'relative'})),
            transition('* => visible', [
                animate('0.8s'),
            ]),
            transition('visible => hidden', [
                animate('1s'),
            ]),
            transition('visible => hidden-up', [
                animate('1.5s'),
            ]),
        ]),
    ]
})
export class HomePageComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('main', {static: true}) mainEl: ElementRef;
    public signUpRole: 'student' | 'tutor' = 'student';
    public signUpForm: FormGroup;
    scrollStep$ = new BehaviorSubject<number>(0);
    private _prevStep = this.scrollStep$.value;
    public mobile: boolean;
    private subs = new Subscription();
    subjectSearchResults: Subject[] = [];
    subjectField: FormControl;

    private transition = _debounce((delta: number): void => {
        console.log('test');
        
        const step = this.scrollStep$.value;
        if (step === 0 && delta === -1) {
            return;
        }
        if (step === 5 && delta === 1) {
            return;
        }

        // this.scrolling = true;
        this._prevStep = step;
        this.scrollStep$.next(step + delta);
    }, 500, {leading: true});

    constructor(
        private route: ActivatedRoute,
        private auth: Auth,
        private router: Router,
        private media: Media,
        private elRef: ElementRef<HTMLElement>,
        private cdRef: ChangeDetectorRef,
        private renderer: Renderer2,
        private backend: Backend,
        @Inject(APP_ROUTES) private routes: IRoutes) {
        this.mobile = !media.query('gt-sm');
        this.subs.add(media.watch('gt-sm').subscribe((media) => {
            this.mobile = !media.active;
            this.cdRef.detectChanges();
        }));
        document.body.parentElement.classList.add('learnt-theme--2');
        this.subjectField = new FormControl('');
    }

    ngOnInit(): void {
        this.route.fragment.subscribe((val: string | null) => {
            if (val === 'vc') {
                this.scrollStep$.next(4);
                if (this.mobile) {
                    this.mainEl.nativeElement.scrollTo(0, this.mainEl.nativeElement.querySelector('.page--4').offsetTop);
                }
            }
            else {
                this.scrollStep$.next(0);
                if (this.mobile) {
                    this.mainEl.nativeElement.scrollTo(0, this.mainEl.nativeElement.querySelector('.page--0').offsetTop);
                }
            }
        });

        this.subs.add(this.subjectField.valueChanges.pipe(debounceTime(500)).subscribe(this.searchSubject.bind(this)));
    }

    ngAfterViewInit(): void {
        this.subs.add(fromEvent<WheelEvent>(this.mainEl.nativeElement, 'wheel')
            .pipe(throttleTime(500))
            .subscribe(e => {
                const el = this.mainEl.nativeElement;
                if (e.deltaY > 0 && el.offsetHeight + el.scrollTop >= el.scrollHeight) {
                    this.transition(1);
                } else if (e.deltaY < 0 && el.scrollTop === 0) {
                    this.transition(-1);
                }
            }));
    }

    ngOnDestroy(): void {
        this.subs.unsubscribe();

        // TODO: remove when new theme is applied to all pages
        document.body.parentElement.classList.remove('learnt-theme--2');
    }

    onStart(): void {
        this.transition(1);
    }

    onPan($event: any) {
        console.log($event);
    }

    searchSubject(): void {
        if (!this.subjectField.value) {
            return;
        }
        this.backend.getSubjects(this.subjectField.value, 100).subscribe((subjects: Subject[]) => {
           this.subjectSearchResults = subjects;
           this.cdRef.detectChanges();
        });
    }

    subjectName(subject: Subject | null): string | null {
        return subject ? subject.name : null;
    }

    state(page: number) {
        const current = this.scrollStep$.getValue();
        console.log(current);
        switch (current) {
            case 0:
                document.getElementById("page--0").style.display = "flex";
                document.getElementById("page--1").style.display = "none";
                document.getElementById("page--2").style.display = "none";
                document.getElementById("page--3").style.display = "none";
                document.getElementById("page--4").style.display = "none";
                document.getElementById("page--5").style.display = "none";
                break;
            case 1:
                document.getElementById("page--0").style.display = "none";
                document.getElementById("page--1").style.display = "flex";
                document.getElementById("page--2").style.display = "none";
                document.getElementById("page--3").style.display = "none";
                document.getElementById("page--4").style.display = "none";
                document.getElementById("page--5").style.display = "none";
                break;
            case 2:
                document.getElementById("page--1").style.display = "none";
                document.getElementById("page--0").style.display = "none";
                document.getElementById("page--2").style.display = "flex";
                document.getElementById("page--3").style.display = "none";
                document.getElementById("page--4").style.display = "none";
                document.getElementById("page--5").style.display = "none";
                break;
            case 3:
                document.getElementById("page--1").style.display = "none";
                document.getElementById("page--2").style.display = "none";
                document.getElementById("page--0").style.display = "none";
                document.getElementById("page--3").style.display = "flex";
                document.getElementById("page--4").style.display = "none";
                document.getElementById("page--5").style.display = "none";
                break;
            case 4:
                document.getElementById("page--1").style.display = "none";
                document.getElementById("page--2").style.display = "none";
                document.getElementById("page--3").style.display = "none";
                document.getElementById("page--0").style.display = "none";
                document.getElementById("page--4").style.display = "flex";
                document.getElementById("page--5").style.display = "none";
                break;
            case 5:
                document.getElementById("page--1").style.display = "none";
                document.getElementById("page--2").style.display = "none";
                document.getElementById("page--3").style.display = "none";
                document.getElementById("page--4").style.display = "none";
                document.getElementById("page--0").style.display = "none";
                document.getElementById("page--5").style.display = "grid";
                break;
        
            default:
                break;
        }
        
        if (this.mobile) {
            return 'mobile';
        }
        if (page === current) {
            return 'visible';
        }
        if (page > current) {
            return 'hidden';
        }
        return 'hidden-up';
    }

    onSelectSubject(evt: MatAutocompleteSelectedEvent): void {
        this.router.navigateByUrl(`${ROUTE_TUTORS}?query=${(evt.option.value as Subject).name}`)
    }

    signupSocial(social: string): void {
        this.router.navigateByUrl(`${ROUTE_REGISTER_STUDENT}?social=${social}`);
    }

    navigate(url: string): void {
        this.router.navigateByUrl(url);
    }
}
