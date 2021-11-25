import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { Observable } from "rxjs";
import { User } from "../../../models";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { FormControl } from "@angular/forms";
import { Backend } from "../../../lib/core/auth";
import { debounceTime, tap } from "rxjs/operators";
import { AdminStudentsService } from "../../services/admin-students.service";
import { Subscription } from "rxjs/Rx";
import { MessengerFrontService } from "../../../services/messenger";
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CreditsGrantComponent } from 'app/admin/admin-credits/credits-grant/credits-grant.component';

@Component({
    selector: 'learnt-student-search',
    templateUrl: './student-search.component.html',
    styleUrls: ['./student-search.component.scss']
})
export class StudentSearchComponent implements AfterViewInit {
    count = 0;
    dataSource: User[];
    columnsToDisplay = ['username', 'firstName', 'lastName', 'action'];
    query = '';
    @ViewChild('MatPaginator') paginator: MatPaginator;
    queryControl: FormControl;
    loading = false;
    footerToDisplay: string[] = [];
    subs = new Subscription();

    constructor(
        private backend: Backend,
        public studentService: AdminStudentsService,
        private messengerFrontService: MessengerFrontService,
        private dialog: MatDialog
    ) {
        this.queryControl = new FormControl('');
    }

    ngOnInit() {
        this.studentService.getStudentList(this.queryControl.value.trim());
        this.subs.add(this.studentService.list$.subscribe(d => {
            if (d?.count === 0) {
                this.footerToDisplay = ['notFound']
            } else {
                this.footerToDisplay = [];
            }
            if (this.loading) {
                this.loading = false;
            }
            this.dataSource = d?.students;
            this.count = d?.count;
        }));
    }

    ngAfterViewInit(): void {
        this.updateList();
    }

    ngOnDestroy() {
        this.subs.unsubscribe();
    }

    updateList() {
        this.subs.add(Observable.merge(this.paginator.page, this.queryControl.valueChanges)
            .pipe(
                tap((e: any) => {
                    if (e.pageIndex || e.pageSize) {
                        this.studentService.pageSize = e.pageSize;
                        this.studentService.pageIndex = e.pageIndex;
                    }
                    this.loading = true;
                }),
                debounceTime(500),
            ).subscribe(() => {
                this.studentService.getStudentList(this.queryControl.value.trim());
            }));
    }

    onPaginatorChange(event: PageEvent) {
        this.studentService.pageSize = event.pageSize;
        this.studentService.pageIndex = event.pageIndex;
        this.updateList();
    }

    messageStudent(event: Event, student: User) {
        event.preventDefault();
        window.open(`https://app.intercom.com/a/apps/${student.intercom.workspace}/users/${student.intercom.contact}/all-conversations`);
    }

    grantCreditsDialog(user: User): MatDialogRef<CreditsGrantComponent> {
        const mdr = this.dialog.open(CreditsGrantComponent, {width: '825px'})
        mdr.componentInstance.init(user);

        return mdr;
    }
}
