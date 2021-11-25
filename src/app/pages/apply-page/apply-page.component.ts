import { AlertRef, AlertService } from '@services/alerts';
import { Auth, Backend, TOKEN_STORAGE, TokenStorage } from '../../lib/core/auth';
import { fromEvent, Observable, Subscription } from 'rxjs';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
    ChangeDetectorRef,
    Component,
    ComponentRef,
    ElementRef,
    Inject,
    OnDestroy,
    OnInit,
    ViewChild,
} from '@angular/core';
import { Subject, Upload, UploadState, VideoData } from '../../models';
import { ROUTE_LOGIN, ROUTE_REDIRECT } from 'routes';
import {
    BirthDateValidator,
    ExpiryValidator,
    IsValidSSN,
    MinimumLengthValidator,
    PasswordMatchValidator,
    PasswordValidator,
    USZipCodeValidator,
    VideoDurationValidator,
    VideoSizeValidator,
    YouTubeUrlValidator,
    YouTubeVideoRegex,
} from '../../lib/helpers/validators';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import * as moment from 'moment';
import { Media } from '../../lib/core/media';
import { LocationService } from '@services/location.service';
import { environment } from '../../../environments/environment';
import _get from 'lodash-es/get';
import { convertToSecond } from 'duration-iso-8601';
import { getMaximumBirthdate, getMinimumBirthdate } from '../../lib/core/utils';
import { debounceTime, first } from 'rxjs/operators';
import { EmailAsyncValidator } from '@services/email-async-validator.service';
import { SocialService } from '@services/social-service';
import { MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

export interface SubjectsFormValue {
    subjects: Subject[]
}

export type CertificatesFormValue = {[k: string]: Upload};

export enum VideoMethod {
    upload = 'upload',
    youtube = 'youtube',
}

const MAX_PDF_SIZE = 52428800; // 50MB

@Component({
    selector: 'learnt-apply-page',
    templateUrl: './apply-page.component.html',
    styleUrls: ['./apply-page.component.scss'],
})
export class ApplyPageComponent implements OnInit, OnDestroy {
    // Current apply step
    private _stepIndex = 0;
    private lastStepIndex: number = this._stepIndex;

    videoNextEnabled = false;
    videoMethod: VideoMethod;

    mobile: boolean;

    profileForm: FormGroup;
    locationForm: FormGroup;

    resumeForm: FormGroup;

    // value: [{id, name, certificate: FormControl}...]
    certificatesForm: FormGroup;
    subjectsForm: FormGroup;
    legalForm: FormGroup;
    videoForm: FormGroup;
    agreeControl: FormControl;

    passwordForm: FormGroup;
    passwordFormErrors: any;

    /* Upload flag */
    uploadingVideo: boolean;
    videoUpload: Upload; // holds data after upload succeeded

    /* Submit flag */
    submitting: boolean;

    showRef: boolean;

    public minDate: Date;
    public maxDate: Date;

    /**
     * This is filled when user is activated by an admin
     * and user comes back to finalize the registration.
     * In this step a password need to be created
     */
    regtoken: string;

    selectedSubjectId: string;
    private subs = new Subscription();
    youtubeForm: FormGroup;
    loadingYoutube = false;
    youtubeClientInitialized = false;
    private socialCredentials = {
        facebook: environment.FacebookAppID,
        linkedin: environment.LinkedInAppID,
        google: environment.GoogleAppID,
    };

    private scopeOptions = {
        scope: ['email'],
    };

    private isSocial: boolean;

    private socialId: string;

    private network: string;

    private accessToken: string;

    @ViewChild('subjectsSearch', { static: true })
    subjectsSearchEl: ElementRef<HTMLInputElement>;
    @ViewChild('subjectsAuto', { static: true })
    subjectsAuto: ComponentRef<MatAutocomplete>;
    subjectOptions: Subject[] = [];
    subjectNames: {[k: string]: string};// <id, name>
    maxPDFSize = MAX_PDF_SIZE;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private backend: Backend,
        private alerts: AlertService,
        private auth: Auth,
        private media: Media,
        @Inject(TOKEN_STORAGE) private tokenProvider: TokenStorage,
        private cd: ChangeDetectorRef,
        public locationService: LocationService,
        public emailAsyncValidator: EmailAsyncValidator,
        private changeDetectorRef: ChangeDetectorRef,
        private socialService: SocialService
    ) {
        document.body.parentElement.classList.add('learnt-theme--2');

        this.socialService.init(this.socialCredentials, this.scopeOptions);
        this.youtubeForm = new FormGroup(
            {
                link: new FormControl('', [YouTubeUrlValidator]),
                data: new FormControl(null, Validators.required),
            },
            {
                validators: [VideoDurationValidator('data')],
            }
        );

        this.minDate = getMinimumBirthdate();
        this.maxDate = getMaximumBirthdate();

        this.initProfileForm();

        // Education
        const resumeFormLocalStorage = JSON.parse(localStorage.getItem('resumeForm') || '{}');
        this.resumeForm = new FormGroup({
            resume: new FormControl(null, [Validators.required, ExpiryValidator('expire', 5)]),
        });
        this.subs.add(
            this.resumeForm.valueChanges
                .pipe(debounceTime(1000))
                .subscribe(this.localStorageUpdate.bind(this, 'resumeForm'))
        );
        if ('resume' in resumeFormLocalStorage) {
            this.resumeForm.get('resume').setValue(resumeFormLocalStorage.resume);
        }

        const storageItem = localStorage.getItem('subjectsForm');
        const subjectsFormLocalStorage = storageItem ? JSON.parse(storageItem) : {};
        this.subjectsForm = new FormGroup({
            subjects: new FormArray([], MinimumLengthValidator(1)),
        });
        if (!this.isObjectEmpty(subjectsFormLocalStorage)) {
            subjectsFormLocalStorage.subjects.map((data) => {
                const subject = new Subject(data);
                this.subjectsField.push(new FormControl(subject, Validators.required));
            });
            this.subjectsForm.markAsDirty();
        }
        this.subjectsForm.valueChanges
            .pipe(debounceTime(1000))
            .subscribe(this.localStorageUpdate.bind(this, 'subjectsForm'));

        this.certificatesForm = new FormGroup({});  // keys will be subject id
        const certificatesFormStorage = localStorage.getItem('certificatesForm');
        const stored = certificatesFormStorage ? JSON.parse(certificatesFormStorage) : {};
        const subjects: string[] = this.subjectsField.getRawValue().map(s => s._id);
        for(const subjectId of Object.keys(stored)) {
            if (!subjects.includes(subjectId)) {
                continue;
            }
            let value = stored[subjectId];
            if (value) {
                value = new Upload(value);
            }
            this.certificatesForm.addControl(subjectId, this.makeCertificateControl(value, subjectId));
        }
        // End of education

        // Legal
        const legalFormLocalStorage = JSON.parse(localStorage.getItem('legalForm') || '{}');
        this.legalForm = new FormGroup({
            agree_terms_privacy: new FormControl(legalFormLocalStorage.agree_terms_privacy, Validators.requiredTrue),
            ssn: new FormControl(legalFormLocalStorage.ssn, Validators.compose([Validators.required, IsValidSSN])),
        });
        this.legalForm.valueChanges.pipe(debounceTime(1000)).subscribe(this.localStorageUpdate.bind(this, 'legalForm'));
        // End of Legal

        // Video
        this.videoForm = new FormGroup(
            {
                video: new FormControl('', [Validators.required, VideoSizeValidator]),
                data: new FormControl({ duration: 0 }, Validators.required),
            },
            { validators: [VideoDurationValidator('data')] }
        );
        // End of video

        // Permission to promote video
        this.agreeControl = new FormControl(true);

        this.passwordForm = new FormGroup(
            {
                password: new FormControl(
                    '',
                    Validators.compose([Validators.required, Validators.minLength(8), PasswordValidator])
                ),
                check: new FormControl('', Validators.compose([Validators.required])),
            },
            PasswordMatchValidator('password', 'check')
        );

        this.mobile = !media.query('gt-sm');
        media.watch('gt-sm').subscribe((event) => {
            this.mobile = !event.active;
        });
    }

    get ssnField(): FormControl {
        return this.legalForm.get('ssn') as FormControl;
    }

    get firstNameField(): FormControl {
        return this.profileForm.get('first_name') as FormControl;
    }

    get lastNameField(): FormControl {
        return this.profileForm.get('last_name') as FormControl;
    }

    get birthdayField(): FormControl {
        return this.profileForm.get('birthday') as FormControl;
    }

    get emailField(): FormControl {
        return this.profileForm.get('email') as FormControl;
    }

    get referrerField(): FormControl {
        return this.profileForm.get('referrer') as FormControl;
    }

    get cityField(): FormControl {
        return this.locationForm.get('city') as FormControl;
    }

    get subjectsField(): FormArray {
        return this.subjectsForm.get('subjects') as FormArray;
    }

    get certificatesFieldNames(): string[] {
        return Object.keys(this.certificatesForm.controls);
    }

    get resumeField(): FormControl {
        return this.resumeForm.get('resume') as FormControl;
    }

    get passwordField(): FormControl {
        return this.passwordForm.get('password') as FormControl;
    }

    get passwordCheckField(): FormControl {
        return this.passwordForm.get('check') as FormControl;
    }

    ngOnDestroy(): void {
        document.body.parentElement.classList.remove('learnt-theme--2');
        this.subs.unsubscribe();
    }

    ngOnInit(): void {
        if (!window.gapi) {
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            document.body.appendChild(script);
            script.onload = this.loadGoogleApiClient.bind(this);
        } else {
            this.loadGoogleApiClient();
        }

        // subject names
        this.subjectNames = JSON.parse(sessionStorage.getItem('subjectNames') || '{}');

        const linkControl = this.youtubeForm.get('link');
        this.subs.add(
            linkControl.valueChanges.subscribe(() => {
                this.youtubeForm.get('data').setValue(null);
                if (linkControl.valid) {
                    const result: RegExpExecArray = YouTubeVideoRegex.exec(linkControl.value);
                    if (result && result.groups?.id) {
                        this.getYoutubeVideoData(result.groups.id);
                    }
                }
            })
        );

        let initialRun = true; // only check for query email the first time
        this.subs.add(
            this.route.queryParams.subscribe((query) => {
                if (query.code !== null && query.code !== undefined && query.code !== '') {
                    this.referrerField.setValue(query.code);
                }

                // create password
                if (query.regtoken) {
                    this.regtoken = query.regtoken;
                    this._stepIndex = 6;
                    return;
                }

                let stepIndex = 0;
                if (query.step !== undefined) {
                    stepIndex = parseInt(query.step, 10) - 1;
                    const correctStepIndex = this.isCorrectStep(stepIndex);
                    if (correctStepIndex !== stepIndex) {
                        this.router.navigate([], {
                            queryParams: { step: correctStepIndex + 1 },
                        });
                        return;
                    }
                }

                this._stepIndex = stepIndex;

                if (initialRun && query.email !== null && query.email !== undefined && query.email !== '') {
                    this.emailField.setValue(query.email);
                }
                initialRun = false;

                if (stepIndex === 1) {
                    this.initStep2();
                }
            })
        );

        this.subs.add(
            Observable.merge(
                this.videoForm.valueChanges,
                this.youtubeForm.valueChanges,
                this.agreeControl.valueChanges
            ).subscribe(() => {
                // set method in use
                if (this.videoForm.value.video) {
                    this.videoMethod = VideoMethod.upload;
                } else if (this.youtubeForm.value.link) {
                    this.videoMethod = VideoMethod.youtube;
                } else {
                    this.videoMethod = null;
                }
                // update if next button is enabled in step 4
                this.videoNextEnabled = this.youtubeForm.valid || this.videoForm.valid;
            })
        );

        this.subs.add(
            this.cityField.valueChanges.pipe(debounceTime(400)).subscribe(async (value) => {
                await this.locationService.getCities(value);
            })
        );
    }

    initProfileForm(): void {
        const profileFormLocalStorage = JSON.parse(localStorage.getItem('profileForm') || '{}');
        const locationLocalStorage = profileFormLocalStorage.location || {};

        this.locationForm = new FormGroup({
            address: new FormControl(locationLocalStorage ? locationLocalStorage.address : '', Validators.required),
            city: new FormControl(locationLocalStorage.city, Validators.required),
            state: new FormControl(locationLocalStorage.state, Validators.required),
            postal_code: new FormControl(locationLocalStorage.postal_code, [Validators.required, USZipCodeValidator]),
        });

        if (!this.isObjectEmpty(locationLocalStorage)) {
            this.locationForm.markAllAsTouched();
            this.locationForm.markAsDirty();
            this.locationForm.updateValueAndValidity();
        }

        this.profileForm = new FormGroup({
            first_name: new FormControl(profileFormLocalStorage.first_name, Validators.required),
            last_name: new FormControl(profileFormLocalStorage.last_name, Validators.required),
            birthday: new FormControl(
                profileFormLocalStorage.birthday ? moment(profileFormLocalStorage.birthday).toDate() : null,
                [Validators.required, BirthDateValidator]
            ),
            email: new FormControl(profileFormLocalStorage.email, {
                validators: Validators.compose([Validators.required, Validators.email]),
                asyncValidators: this.emailAsyncValidator.validate,
            }),
            telephone: new FormControl(
                profileFormLocalStorage.telephone,
                Validators.compose([
                    Validators.required,
                    // Must be ##########, ###-###-#### or (###)-###-####
                    Validators.pattern('^[0-9]{10}$|^((\\([0-9]{3}\\) |[0-9]{3}-)[0-9]{3}-[0-9]{4})$'),
                ])
            ),
            location: this.locationForm,
            referrer: new FormControl('', Validators.pattern(/[0-9a-zA-Z]+/)),
        });

        if (!this.isObjectEmpty(profileFormLocalStorage)) {
            for (const key in profileFormLocalStorage) {
                const control = this.profileForm.get(key);
                if (control.value) {
                    control.markAsDirty({ onlySelf: true });
                    control.markAsTouched({ onlySelf: true });
                }
            }
        }

        this.profileForm.valueChanges.subscribe(this.localStorageUpdate.bind(this, 'profileForm'));
    }

    private initStep2() {
        this.subs.add(
            fromEvent(this.subjectsSearchEl.nativeElement, 'input')
                .pipe(debounceTime(500))
                .subscribe((evt: Event) => {
                    this.backend.getSubjects(this.subjectsSearchEl.nativeElement.value, 100).subscribe((subjects) => {
                        const selected = this.subjectsField.value as Subject[];
                        this.subjectOptions = subjects.filter((subject) => {
                            this.subjectNames[subject._id] = subject.name;
                            return !selected.find((s) => s._id === subject._id);
                        });
                        sessionStorage.setItem('subjectNames', JSON.stringify(this.subjectNames));
                    });
                })
        );
    }

    get stepIndex(): number {
        return this._stepIndex;
    }

    set stepIndex(stepIndex: number) {
        this.router.navigate([], { queryParams: { step: stepIndex + 1 } });
    }

    /**
     * Creates or removes form controls when subjectsForm value changes
     */
    updateCertificatesForm(): void {
        const subjects = this.subjectsForm.value.subjects as Subject[];
        const subjectIds = [];
        for(const subject of subjects) {
            subjectIds.push(subject._id);
            const control = this.certificatesForm.get(subject._id);
            // create new control for new subjects
            if (!control) {
                this.certificatesForm.addControl(subject._id, this.makeCertificateControl(null, subject._id));
            }
        }
        // remove controls whose corresponding subjects have been removed
        for(const key of Object.keys(this.certificatesForm.controls)) {
            if (!subjectIds.includes(key)) {
                this.certificatesForm.removeControl(key);
            }
        }
        this.localStorageUpdate('certificatesForm', this.certificatesForm.getRawValue());
        this.stepForward();
    }

    makeCertificateControl(initialValue: Upload | null, id: string): FormControl {
        const control = new FormControl(initialValue);
        control.valueChanges.subscribe((value) => {
            this.localStorageUpdate('certificatesForm', this.certificatesForm.getRawValue());
            this.subjectsField.value.forEach(subj => {
                if (subj._id === id) {
                    subj.certificate = value;
                }
            })
        });
        return control;
    }

    isObjectEmpty(obj: any): boolean {
        return Object.keys(obj).length === 0 && obj.constructor === Object;
    }

    localStorageUpdate(itemName: string, formRawValue: { [k: string]: any }): void {
        localStorage.setItem(itemName, JSON.stringify(formRawValue));
    }

    setData(data: VideoData): void {
        this.videoForm.get('data').setValue(data);
        if (data.duration === 0) {
            this.videoUpload = null;
            this.videoForm.reset();
        }
    }

    saveProfile(): void | boolean {
        if (!this.profileForm.valid) {
            return false;
        }
        const profile = this.profileForm.getRawValue();
        this.backend
            .tagNewApplication({
                email: profile.email,
                name: `${profile.first_name.trim()} ${profile.last_name.trim()}`,
                phone: profile.telephone,
            })
            .pipe(first())
            .subscribe();
        this.stepForward();
    }

    onCertificateClick(event, subjectId): void {
        this.selectedSubjectId = subjectId;
    }

    private isCorrectStep(stepIndex: number): number {
        if (stepIndex < 0) {
            return 0;
        }
        const stepValidations: boolean[] = [
            this.profileForm.valid,
            this.subjectsForm.valid && this.resumeForm.valid,
            this.certificatesForm.valid,
            this.videoForm.valid || this.youtubeForm.valid, // 4
            this.legalForm.valid,
        ];
        for (let i = 0; i < stepIndex; i++) {
            if (!stepValidations[i]) {
                return i;
            }
        }
        return stepIndex;
    }

    getVideoFileName(extension: string): string {
        const first_name: string = this.firstNameField.value.toLowerCase();
        const last_name: string = this.lastNameField.value.toLowerCase();
        return `${first_name}_${last_name}_${new Date().getTime()}.${extension}`;
    }

    private uploadVideo(): void {
        const raw: {
            video: Blob | File;
            data: { duration: number; extension: string };
        } = this.videoForm.getRawValue();
        this.uploadingVideo = true;
        const data = new FormData();
        data.append('file', raw.video, this.getVideoFileName(raw.data.extension));
        data.append('context', 'applying');

        const onSuccess = (upload: Upload) => {
            this.uploadingVideo = false;
            this.videoUpload = upload;
            this.stepForward();
        };

        const onFailure = (err: HttpErrorResponse) => {
            console.error(err)
            this.uploadingVideo = false;
            this.alerts.alert('Fail to upload');
        };

        this.backend.upload(data).subscribe(
            (upload) => {
                const check = () => setTimeout(() => {
                    this.backend.getUpload(upload._id).subscribe(up => {
                        if (up.state === UploadState.Succeeded) {
                            onSuccess(up);
                        }
                        else if (up.state === UploadState.Failed) {
                            onFailure(null);
                        }
                        else {
                            check();
                        }
                    });
                }, 3000);
                check();

            },
            onFailure,
        );
    }

    signUpFacebook(): void {
        const scope = ['email, basic, birthday'];
        this.signUpSocial('facebook', environment.API_HOST + '/proxy/facebook', scope);
    }

    signUpGoogle(): void {
        const scope = ['email, basic, birthday, phone'];
        this.signUpSocial('google', environment.API_HOST + '/proxy/google', scope);
    }

    private signUpSocial(network, proxy: string, scope: any): void {
        this.submitting = true;
        this.socialService
            .login(network, {
                scope: scope,
                response_type: 'code',
                oauth_proxy: proxy,
                redirect_uri: ROUTE_REDIRECT,
            })
            .subscribe(
                (res: any) => {
                    this.accessToken = res.authResponse.access_token;
                    this.backend.proxyUserInfo(network, res.authResponse.access_token).subscribe(
                        (data) => {
                            this.isSocial = true;
                            this.socialId = data.sub;
                            this.network = network;
                            this.profileForm.patchValue({
                                first_name: data.given_name,
                                last_name: data.family_name,
                                email: data.email,
                                birthday: data.birthday ? moment(data.birthday).toDate() : null,
                                telephone: data.phone,
                                address: data.address,
                            });

                            this.submitting = false;
                        },
                        (err) => {
                            this.submitting = false;
                            console.log(err.error);
                        }
                    );
                },
                (err) => {
                    this.submitting = false;
                    console.log(err.error);
                }
            );
    }

    submit(): void {
        if (this.legalForm.invalid) {
            this.alerts.alert('You need to tick all checkboxes!');
            return;
        }

        this.submitting = true;

        const subjectsParam = [];
        this.subjectsField.value.forEach(function (subject) {
            subjectsParam.push({
                Subject: subject._id,
                Certificate: subject.certificate || null,
            });
        });

        const profileForm = this.profileForm.getRawValue();
        profileForm.location.country = 'US';
        profileForm.birthday = moment(profileForm.birthday);
        profileForm.email = profileForm.email.toLowerCase();

        const payload = {
            ...profileForm,
            social_security_number: this.legalForm.get('ssn').value,
            subjects: subjectsParam,
            resume: this.resumeForm.get('resume').value,
            promote_video_allowed: this.agreeControl.value,
        };
        if (this.videoUpload) {
            payload.video = this.videoUpload;
        } else if (this.youtubeForm.valid && this.youtubeForm.get('link').value) {
            payload.youtube_video = this.youtubeForm.get('link').value;
        }
        if (this.isSocial) {
            payload.social_id = this.socialId;
            payload.network = this.network;
            payload.access_token = this.accessToken;
        }
        this.subs.add(
            this.backend.registerTutor(payload).subscribe(
                () => {
                    this.submitting = false;
                    this.stepForward();
                },
                (error: HttpErrorResponse) => {
                    this.submitting = false;

                    const err = error.error;
                    const alertOpts = {
                        lifetime: 0,
                        buttons: [{ label: 'OK', result: true }],
                    };
                    let alert: AlertRef;

                    if (err.error.message === null || err.error.message === undefined) {
                        const msg =
                            `We ran into a problem submitting the application.` +
                            `Please try again later. ` +
                            `If the error persists, please contact us.`;

                        alert = this.alerts.alert('Error submitting the application', msg, alertOpts);
                        alert.result.subscribe((r) => alert.dispose());
                        return;
                    }

                    if (err.error.fields !== undefined && err.error.fields !== null) {
                        this.profileForm.markAllAsTouched();
                        if (err.error.fields.email !== undefined && err.error.fields.email !== null) {
                            this.profileForm.get('email').setErrors({
                                apiError: err.error.fields.email,
                            });
                            this.stepIndex = 0;
                            return;
                        }

                        if (err.error.fields.location !== undefined && err.error.fields.location !== null) {
                            this.profileForm
                                .get('location')
                                .get('address')
                                .setErrors({ apiError: 'address is required' });
                            this.stepIndex = 0;
                            return;
                        }

                        if (err.error.fields.birthday !== undefined && err.error.fields.birthday !== null) {
                            this.profileForm.get('birthday').setErrors({
                                apiError: 'birthday is required',
                            });
                            this.stepIndex = 0;
                            return;
                        }

                        if (err.error.fields.telephone !== undefined) {
                            this.profileForm.get('telephone').setErrors({
                                apiError: 'The Phone Number is required',
                            });
                            this.stepIndex = 0;
                            return;
                        }

                        if (err.error.fields.social_security_number !== undefined) {
                            this.legalForm.get('ssn').setErrors({
                                apiError: 'The Social Security Number is required',
                            });
                            this.stepIndex = 3;
                            return;
                        }
                    }

                    let alertMessage = 'We ran into a problem submitting the application. The message returned is:<br>';
                    alertMessage += `<pre>${err.error.message}</pre>`;

                    if (err.error.data !== null && err.error.data !== undefined) {
                        alertMessage += `<br><br>Also include:<br>${err.error.data}`;
                    }

                    alert = this.alerts.alert('Error submitting the application', alertMessage, alertOpts);
                    alert.result.subscribe((r) => alert.dispose());
                }
            )
        );
    }

    createPassword(): void {
        const password = this.passwordForm.get('password').value;
        this.backend.createUserPassword(password, this.regtoken).subscribe(
            (token) => {
                if (!token.access_token) {
                    return this.alerts.alert('Access token expected on complete step!');
                }
                this.tokenProvider.put(token);
                this.alerts.alert('Please fill your profile to appear in search results!');
                setTimeout(() => (window.location.href = 'main/account'), 3000);
            },
            (error) => {
                if (error.error.code === 102) {
                    const alertOpts = {
                        lifetime: 0,
                        buttons: [
                            { label: 'Resend Email', result: true },
                            { label: 'Cancel', result: false },
                        ],
                    };
                    const alertMessage = '';
                    const alert = this.alerts.alert('Link has expired.', alertMessage, alertOpts);
                    alert.result.subscribe((res) => {
                        if (res === true) {
                            const payload = { resend_activation_email: true };
                            this.backend.resendActivationEmail(payload, this.regtoken).subscribe(
                                (r) => {
                                    if (r.email_sent) {
                                        this.alerts.alert('Email Sent!');
                                    }
                                },
                                (error) => {
                                    this.alerts.alert('Failed Sending email.');
                                    console.log(error);
                                }
                            );
                        }
                        alert.dispose();
                        this.router.navigateByUrl(ROUTE_LOGIN);
                    });
                } else {
                    this.alerts.alert('Failed to create password!');
                }
            }
        );
    }

    onPhoneChange(): void {
        const hasError = this.profileForm.get('telephone').hasError('pattern');

        if (hasError) {
            return;
        }

        const phoneNumber = this.profileForm.get('telephone').value;
        let formattedPhoneNumber = phoneNumber;

        // ########## convert to (###) ###-####
        let res = phoneNumber.match('^[0-9]{10}$');

        if (res != null && res.length > 0) {
            const city = phoneNumber.slice(0, 3);
            let number = phoneNumber.slice(3);
            number = number.slice(0, 3) + '-' + number.slice(3);
            formattedPhoneNumber = '(' + city + ') ' + number;
        }

        // ###-###-#### convert to (###) ###-####
        res = phoneNumber.match('^[0-9]{3}-[0-9]{3}-[0-9]{4}$');
        if (res != null && res.length > 0) {
            const city = phoneNumber.slice(0, 3);
            formattedPhoneNumber = '(' + city + ') ' + phoneNumber.slice(4);
        }

        // Formatted phone number should be (###) ###-####
        this.profileForm.get('telephone').setValue(formattedPhoneNumber);
    }

    cleanLocalStorage(): void {
        localStorage.removeItem('profileForm');
        localStorage.removeItem('resumeForm');
        localStorage.removeItem('subjectsForm');
        localStorage.removeItem('legalForm');
    }

    /**
     * Scroll to an element
     */
    scrollToElement(el: HTMLElement): void {
        el.scrollIntoView({ behavior: 'smooth' });
    }

    stepForward(): void {
        this.lastStepIndex = this.stepIndex;
        const step = this.stepIndex + 2;
        this.router
            .navigate([], { queryParams: { step } })
            .then(() => {
                if (step === 6) {
                    this.profileForm.reset();
                    this.resumeForm.reset();
                    this.certificatesForm.reset();
                    this.videoForm.reset();
                    this.youtubeForm.reset();
                    this.legalForm.reset();
                    this.cleanLocalStorage();
                }
            })
            .catch((er) => console.log(er));
    }

    stepBackward(): void {
        this.lastStepIndex = this.stepIndex;
        this.router.navigate([], { queryParams: { step: this.stepIndex } });
    }

    private loadGoogleApiClient(): void {
        window.gapi.load('client', {
            callback: () => {
                window.gapi.client
                    .init({
                        apiKey: environment.GOOGLE_API_KEY,
                        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest'],
                    })
                    .then(() => {
                        this.youtubeClientInitialized = true;
                    });
            },
        });
    }

    private getYoutubeVideoData(id: string): void {
        this.loadingYoutube = true;
        window.gapi.client['youtube'].videos
            .list({
                part: ['contentDetails', 'snippet'],
                id: [id],
            })
            .then(
                (res: HttpResponse<any>) => {
                    const items = _get(res, 'result.items', []);
                    let content = null;
                    if (items.length > 0) {
                        content = items[0];
                        content.duration = convertToSecond(_get(content, 'contentDetails.duration', 'PT0S')) as number;
                        this.youtubeForm.get('data').setValue(content);
                        this.youtubeForm.get('data').markAsDirty();
                        this.youtubeForm.get('data').markAsTouched();
                        this.cd.detectChanges();
                    }
                    this.loadingYoutube = false;
                },
                () => {
                    this.loadingYoutube = false;
                }
            );
    }

    resetYouTubeForm(): void {
        this.youtubeForm.reset({ link: '', data: null });
        this.youtubeForm.markAsUntouched();
        this.cd.detectChanges();
    }

    doneVideoStep(): void {
        if (this.youtubeForm.valid || (this.videoForm.valid && this.videoUpload)) {
            this.stepForward();
        } else if (this.videoForm.valid) {
            this.uploadVideo();
        }
    }

    getYouTubeVideoThumbnail(): string {
        const keys = ['standard', 'medium', 'high', 'default'];
        if (!this.youtubeForm.value.data) {
            return '';
        }
        for (const key of keys) {
            const val = _get(this.youtubeForm.value.data, `snippet.thumbnails.${key}`);
            if (val) return val.url;
        }
    }

    getSubjectName(subject: Subject): string {
        return subject ? subject.name : '';
    }

    addSubject(event: MatAutocompleteSelectedEvent): void {
        this.subjectsField.push(new FormControl(event.option.value, Validators.required));
        this.subjectsSearchEl.nativeElement.value = '';
        this.subjectOptions = [];
    }

    removeSubject(i: number): void {
        this.subjectsField.removeAt(i);
    }

    getCertificatePlaceholderText(key: string): string {
        return `Upload ${this.subjectNames[key]} certificate`;
    }
}
