import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { CreditsGrantComponent } from 'app/admin/admin-credits/credits-grant/credits-grant.component';
import _isArray from 'lodash-es/isArray';
import { Observable } from 'rxjs';
import { debounceTime, first, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Rx';
import { Backend } from '../../../lib/core/auth';
import { getApprovalStatusDisplay } from '../../../lib/core/utils';
import { ApprovalStatus, Subject, User } from '../../../models';
import { MessengerFrontService } from '../../../services/messenger';
import { AdminTutorsService } from '../../services/admin-tutors.service';

@Component({
    selector: 'learnt-tutor-search',
    templateUrl: './tutor-search.component.html',
    styleUrls: ['./tutor-search.component.scss'],
})
export class TutorSearchComponent implements OnInit, AfterViewInit, OnDestroy {
    queryControl: FormControl;
    private prevQuery: string;
    pageIndex = 0;
    pageSize = 50;
    columnsToDisplay = ['username', 'firstName', 'lastName', 'registered', 'action'];
    footerToDisplay = [];
    count = 0;
    loading = false;
    private subs = new Subscription();
    @ViewChild('matPaginator') matPaginator: MatPaginator;
    includeDisapproved: FormControl;
    pendingTutors: User[] = [];
    activeTutors: User[] = [];
    declinedTutors: User[] = [];
    resultsCount = 0;
    ApprovalStatus = ApprovalStatus;
    subjectFilter: FormControl;
    subjects: Subject[] = [];

    get pageSizeOptions(): Array<number>{
        return [10, 50, 100];
    }

    constructor(
        private router: Router,
        private tutorService: AdminTutorsService,
        private messengerFrontService: MessengerFrontService,
        private backend: Backend,
        private dialog: MatDialog
    ) {
        this.queryControl = new FormControl('');
        this.includeDisapproved = new FormControl(false);
        this.subjectFilter = new FormControl('');
    }

    ngOnInit(): void {
        this.fetch();
        this.subs.add(this.subjectFilter.valueChanges.pipe(debounceTime(500)).subscribe(val => {
            if (typeof val === 'string' && val.length) {
                this.backend.getSubjects(val, 50).pipe(first()).subscribe(subjects => this.subjects = subjects);
            } else if ((val._id && val instanceof Subject) || val === "") {
                this.fetch();
            }
        }));
    }

    ngAfterViewInit(): void {
        this.subs.add(Observable.merge(
            this.queryControl.valueChanges,
            this.includeDisapproved.valueChanges,
            this.matPaginator.page.asObservable().pipe(tap((event: PageEvent) => {
                this.pageSize = event.pageSize;
                this.pageIndex = event.pageIndex;
            })),
        ).pipe(debounceTime(600)).subscribe(() => this.fetch()));
    }

    ngOnDestroy() {
        this.subs.unsubscribe();
    }

    fetch() {
        const q = this.queryControl.value;
        if (this.prevQuery !== q) {
            this.pageIndex = 0;
        }
        this.loading = true;
        this.prevQuery = q;
        this.tutorService.getTutors(this.pageIndex, this.pageSize, q, !this.includeDisapproved.value, this.subjectFilter.value)
            .subscribe((d: {count: number, tutors: any[]}) => {
                let tutors = [];
                if (d && d.tutors && _isArray(d.tutors) && d.tutors.length) {
                    this.count = d.count;
                    tutors = d.tutors.map(r => new User(r)).sort((tutorA, tutorB) => {
                        return tutorA.registered_date < tutorB.registered_date ? -1 : 1;
                    });
                } else {
                    this.count = 0;
                }
                this.resultsCount = tutors.length;
                this.pendingTutors = tutors.filter(t => (
                    [ApprovalStatus.ApprovalStatusNew,
                     ApprovalStatus.ApprovalStatusBackgroundCheckCompleted,
                     ApprovalStatus.ApprovalStatusBackgroundCheckRequested].includes(t.approval)));
                this.activeTutors = tutors.filter(t => t.approval === ApprovalStatus.ApprovalStatusApproved)
                this.declinedTutors = tutors.filter(t => t.approval === ApprovalStatus.ApprovalStatusRejected);
                this.loading = false;
            }, err => {
                console.error(err);
                this.loading = false;
            });
    }

    setUser(event: MouseEvent, tutor: User) {
        event.preventDefault();
        this.tutorService.selectedUser = tutor;
        this.tutorService.editMode = false;
        this.router.navigateByUrl(`/admin/tutors/${tutor._id}`);
    }

    messageTutor(event: MouseEvent, tutor: User) {
        event.preventDefault();
        window.open(`https://app.intercom.com/a/apps/${tutor.intercom.workspace}/users/${tutor.intercom.contact}/all-conversations`);
    }

    editTutor(event: Event, user: User) {
        event.preventDefault();
        this.tutorService.editMode = true;
        this.tutorService.selectedUser = user;
        this.router.navigateByUrl(`/admin/tutors/${user._id}`);
    }

    approvalStatusDisplay(approval: number): string {
        return getApprovalStatusDisplay(approval);
    }

    getSubjectName(subject: Subject) {
        return subject ? subject.name : '';
    }

    grantCreditsDialog(user: User): MatDialogRef<CreditsGrantComponent> {
        const mdr = this.dialog.open(CreditsGrantComponent, {width: '825px'})
        mdr.componentInstance.init(user);

        return mdr;
    }
}
