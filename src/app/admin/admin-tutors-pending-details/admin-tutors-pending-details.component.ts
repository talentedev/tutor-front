import { AlertService } from '../../services/alerts';
import { Backend } from '../../lib/core/auth';
import { ApprovalStatus, TutoringDegree, TutoringSubject, User } from '../../models';
import { AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AdminUserService } from "../services/admin-user.service";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { RejectTutorComponent } from "../../dialogs/reject-tutor/reject-tutor.component";
import { Subscription } from "rxjs/Rx";
import { first } from "rxjs/operators/first";
import { loadScript } from "../../lib/core/utils";
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { YouTubeVideoRegex } from '../../lib/helpers/validators';

const SCRIPTS = [
    'https://cdn.jsdelivr.net/npm/web-streams-polyfill@2.0.2/dist/ponyfill.min.js',
    'https://cdn.jsdelivr.net/npm/streamsaver@2.0.3/StreamSaver.min.js',
]

declare global {
    interface Window {
        streamSaver: any;
    }
}

@Component({
    selector: 'learnt-admin-tutors-pending-details',
    templateUrl: './admin-tutors-pending-details.component.html',
    styleUrls: ['./admin-tutors-pending-details.component.scss']
})
export class AdminTutorsPendingDetailsComponent implements OnInit, AfterViewInit {
    public tutor: User;

    private tutorId: string;

    private userData: { candidate_id: string; report_id: string; finished: boolean };

    public candidate: { [key: string]: any };
    public report: { [key: string]: any };
    public requestedReport: any;

    // vars for Checkr background check
    public ssnTrace: { [key: string]: any };
    public sexOffenderSearch: { [key: string]: any };
    public nationalCriminalSearch: { [key: string]: any };
    public countyCriminalSearches: { [key: string]: any }[];

    // vars for Turn background check
    public ssnStatus: string;
    public sexOffenderStatus: string;
    public criminalSearchStatus: string;

    public readonly isProd = environment.production;
    private rejectDialog: MatDialogRef<RejectTutorComponent>;
    downloading = false;

    @ViewChild('video')
    public videoEl: ElementRef;

    @ViewChild('videoOverlay')
    videoOverlay: ElementRef;

    public dataLoading = false;

    public ApproveStatus = ApprovalStatus;
    public approvalStatus: number;
    videoError = false;
    videoLoaded = false;

    constructor(
        private backend: Backend,
        private dialog: MatDialog,
        private router: Router,
        private alerts: AlertService,
        private route: ActivatedRoute,
        private userService: AdminUserService,
        private renderer: Renderer2,
        private sanitizer: DomSanitizer
    ) { }

    ngOnInit() {
        loadScript(SCRIPTS, () => { });
    }

    ngAfterViewInit() {
        this.route.params.pipe(first()).subscribe((params: Params) => {
            this.tutorId = params.tutor;
            this.fetch();
        });

        if (this.videoEl) {
            this.videoEl.nativeElement.onerror = (err) => {
                this.videoError = true;
            }
        }
    }

    public get canGetSearches(): boolean {
        if (this.report === undefined) {
            return false;
        }

        return !this.dataLoading;
    }

    private createVideoElement(): void {
        if (!this.tutor.tutoring.video) {
            return;
        }
        const src = document.createElement('source') as HTMLSourceElement;
        src.setAttribute('src', this.tutor.tutoring.video.href);
        src.setAttribute('type', AdminTutorsPendingDetailsComponent.getVideoSourceType(this.tutor.tutoring.video.mime));
        src.onerror = () => {
            this.videoError = true;
        }
        this.videoEl.nativeElement.addEventListener('loadedmetadata', () => {
            this.videoLoaded = true;
        });
        this.renderer.appendChild(this.videoEl.nativeElement, src);
    }

    private fetch(): void {
        this.userService.getUser(this.tutorId).subscribe(user => {
            this.tutor = user;
            this.createVideoElement();
            this.approvalStatus = this.tutor.approval;
            if (this.tutor.has_checkr_data) {
                this.getUserData("checkr");
            } else if (this.tutor.has_bgcheck_data) {
                this.getUserData("bgcheck");
            }
        });
    }

    public approve(): void {
        this.backend.approveTutor(this.tutorId).subscribe(
            response => {
                this.alerts.alert(`Tutor ${this.tutor.shortName} approved!`);
                this.router.navigate(['/admin/tutors']);
            },
            err => {
                this.alerts.alert('Failed to approve tutor');
            }
        );
    }

    public verify(item): void {
        let type, id, successMessage;

        if (item instanceof TutoringSubject) {
            type = 'subject';
            id = item._id;
            successMessage = `Subject '${item.subject.name}' approved!`;
        }

        if (item instanceof TutoringDegree) {
            type = 'degree';
            id = item._id;
            successMessage = `Degree ${item.degree} @ ${item.university} verified`;
        }

        this.backend.verifyTutorResource(this.tutorId, type, id).subscribe(response => {
            item.verified = true;
            this.alerts.alert(successMessage);
        });
    }

    private getUserData(source: "checkr" | "bgcheck"): void {
        let endpoint: string = "";
        if (source === "checkr") {
            endpoint = `@api/checkr/user/${this.tutorId}`
        }
        if (source === "bgcheck") {
            endpoint = `@api/bgcheck/candidate/${this.tutorId}`
        }

        this.backend.get(endpoint).subscribe(
            (res) => {

                if (res === null) {
                    this.alerts.alert('No data available');
                    return;
                }

                this.userData = {
                    candidate_id: res["candidate_id"],
                    report_id: res["report_id"],
                    finished: res["finished"]
                };
            },
            (err: HttpErrorResponse) => {
                if (err.status === 404) {
                    console.error(err);
                    this.alerts.alert('User not found');
                    return;
                }
            }
        );
    }

    public createBGCheckInvitation() {
        this.dataLoading =  true;
        const candidate = {
            "reference_id": this.tutor._id,
            "first_name": this.tutor.profile.first_name,
            "last_name": this.tutor.profile.last_name,
            "email": this.tutor.email,
            "phone": this.tutor.profile.telephone,
        };
        this.backend.post(`@api/bgcheck/candidate`, candidate)
            .subscribe(
                (response: HttpResponse<any>) => {
                    this.dataLoading = false;
                    this.approvalStatus = ApprovalStatus.ApprovalStatusBackgroundCheckRequested;
                },
                (err: HttpErrorResponse) => {
                    this.dataLoading = false;
                    console.error(err);
                }
            );
    }

    public getCheckrCandidate(): void {
        this.dataLoading = true;
        this.backend.get(`@api/checkr/candidates/${this.userData.candidate_id}`).subscribe(
            (res: HttpResponse<any>) => {
                this.dataLoading = false;
                this.candidate = res;

                this.getCheckrReport();
            },
            (err: HttpErrorResponse) => {
                this.dataLoading = false;
                if (err.status === 404) {
                    this.alerts.alert('Candidate not found');
                    return;
                }
            }
        );
    }

    public getCheckrReport(): void {
        this.dataLoading = true;
        this.backend.get(`@api/checkr/reports/${this.candidate.report_ids[0]}`).subscribe(
            (res: HttpResponse<any>) => {
                this.dataLoading = false;
                this.report = res;

                this.getSSNTrace();
                this.getSexOffenderSearch();
                this.getCriminalSearch();
            },
            (err: HttpErrorResponse) => {
                console.log(err);
            },
            () => {
                this.dataLoading = false;
            }
        );
    }

    public getBGCheckReport(): void {
        this.dataLoading = true;
        this.backend.get(`@api/bgcheck/report/${this.tutor._id}`).subscribe(
            (res: any) => {
                this.dataLoading = false;
                this.ssnStatus = res.checks?.ssn?.status == "valid" ? "valid" : "failed";
                this.sexOffenderStatus = res.checks?.sex_offender == "clear" ? "clear" : this.getCounts(res.checks?.sex_offender);
                this.criminalSearchStatus = res.checks?.criminal == "clear" ? "clear" : this.getCounts(res.checks?.criminal?.value);
            },
            (err: HttpErrorResponse) => {
                console.log(err);
            },
            () => {
                this.dataLoading = false;
            }
        )
    }

    private getCounts(list: any[]): string {
        if(!Array.isArray(list)){
            return "clear";
        }
        const count = list.length;
        return count > 0 ? `${count} count${count > 1 ? 's' : ''}` : "clear"
    }

    public getSSNTrace(): void {
        if (this.report.ssn_trace_id === undefined) {
            this.alerts.alert('SSN Trace not found in the report');
            return;
        }

        this.backend.get(`@api/checkr/ssn_trace/${this.report.ssn_trace_id}`).subscribe(
            (res: HttpResponse<any>) => {
                this.ssnTrace = res;
            },
            (err: HttpErrorResponse) => {
                console.log(err);
            }
        );
    }

    public getSexOffenderSearch(): void {
        if (this.report.sex_offender_search_id === undefined) {
            this.alerts.alert('Sex Offender Search not found in the report');
            return;
        }

        this.backend.get(`@api/checkr/sex_offender_search/${this.report.sex_offender_search_id}`).subscribe(
            (res: HttpResponse<any>) => {
                this.sexOffenderSearch = res;
            },
            (err: HttpErrorResponse) => {
                console.log(err);
            }
        );
    }

    public getCriminalSearch(): void {
        if (this.report.national_criminal_search_id !== undefined) {
            const id: string = this.report.national_criminal_search_id;
            this.backend.get(`@api/checkr/criminal_search/national/${id}`).subscribe(
                (res: HttpResponse<any>) => {
                    this.nationalCriminalSearch = res;
                },
                (err: HttpErrorResponse) => {
                    console.log(err);
                }
            );
        }

        if (this.report.county_criminal_search_ids !== undefined) {
            this.countyCriminalSearches = [];
            (<string[]>this.report.county_criminal_search_ids).forEach(id => {
                this.backend.get(`@api/checkr/criminal_search/county/${id}`).subscribe(
                    (res: HttpResponse<any>) => {
                        this.countyCriminalSearches.push(res.body);
                    },
                    (err: HttpErrorResponse) => {
                        console.log(err);
                    }
                );
            });
        }
    }

    notApprovedOrRejected(approval: number | undefined) {
        return ![ApprovalStatus.ApprovalStatusRejected, ApprovalStatus.ApprovalStatusApproved].includes(approval);
    }

    reject() {
        const subs = new Subscription();
        this.rejectDialog = this.dialog.open(RejectTutorComponent, {
            width: '500px',
            maxWidth: '90vw',
        });

        subs.add(this.rejectDialog.componentInstance.confirmed.subscribe((reason: string) => {
            this.backend.rejectTutor(this.tutorId, reason).subscribe(
                response => {
                    this.rejectDialog.close();
                    this.alerts.alert(`Tutor ${this.tutor.shortName} has been rejected!`);
                    this.router.navigate(['/admin/tutors']);
                },
                err => {
                    this.alerts.alert('Failed to reject tutor');
                }
            );
        }));
        subs.add(this.rejectDialog.componentInstance.cancelled.subscribe(() => {
            this.rejectDialog.close();
        }));
        subs.add(this.rejectDialog.afterClosed().subscribe(() => {
            subs.unsubscribe();
        }));
    }

    downloadVideo(): void {
        this.downloading = true;
        const name = this.tutor.tutoring.video.name;
        const extension = this.tutor.tutoring.video.mime.split(';')[0].split('/')[1];
        let filename = name.slice(0, name.lastIndexOf('.')).concat('.', extension);
        const filestream = window.streamSaver.createWriteStream(filename);
        fetch(this.tutor.tutoring.video.href).then(res => {
            if (res.status !== 200) {
                this.downloading = false;
                return
            }
            const readableStream = res.body;
            if (window.WritableStream && readableStream.pipeTo) {
                return readableStream.pipeTo(filestream).then(() => {
                    this.downloading = false;
                });
            }
            const writer = filestream.getWriter();
            const reader = res.body.getReader();
            const pump = () => reader.read().then(res => {
                if (res.done) {
                    this.downloading = false;
                    writer.close();
                } else {
                    writer.write(res.value).then(pump);
                }
            });
            pump();
        })
    }

    getYoutubeEmbedUrl(): SafeResourceUrl | string {
        if (!this.tutor?.tutoring?.youtube_video) {
            return "";
        }
        const match = this.tutor.tutoring.youtube_video.match(YouTubeVideoRegex);
        if (match && match.groups?.id) {
            const id = match.groups.id;
            return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${id}`);
        }
        return "";
    }

    private static getVideoSourceType(mime: string): string {
        switch (mime) {
            case 'video/quicktime':
                return 'video/mp4';
            default:
                return mime;
        }
    }
}
