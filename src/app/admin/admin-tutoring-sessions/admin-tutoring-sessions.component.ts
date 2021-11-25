import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { Lesson } from "../../models/lesson";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { AdminUserService } from "../services/admin-user.service";
import { MatTableDataSource } from '@angular/material/table';

@Component({
    selector: 'learnt-admin-tutoring-sessions',
    templateUrl: './admin-tutoring-sessions.component.html',
    styleUrls: ['./admin-tutoring-sessions.component.scss']
})
export class AdminTutoringSessionsComponent implements AfterViewInit {

    @ViewChild('matPaginator') paginator: MatPaginator;
    columnsToDisplay = ['startDate', 'tutorName', 'studentName', 'subject', 'tutorRate', 'sessionType', 'buttons'];
    footerToDisplay = [];
    dataSource: any;
    pageIndex = 0;
    pageSize = 10;
    
    constructor(public userService: AdminUserService) {
    }

    ngOnInit() {
        this.getCurrentTutoringLessonsData();
    }

    ngAfterViewInit(): void {
        if(this.dataSource) {
            this.dataSource.paginator = this.paginator;
        }  
    }

    onPaginatorChange(event: PageEvent) {
        this.pageSize = event.pageSize;
        this.pageIndex = event.pageIndex;
    }

    private getCurrentTutoringLessonsData() {
        this.footerToDisplay = ['spinner'];
        
        this.userService.getCurrentTutoringLessons().subscribe((response: any) => {
            this.dataSource = new MatTableDataSource<Lesson>([]); 

            if(response && response.lessons.length > 0) {

                const lessons = response.lessons.map(lesson => new Lesson(lesson));

                this.footerToDisplay = ['refresh'];
                this.dataSource.data = lessons;               
            }
            else {
                this.footerToDisplay = ['refresh', 'noResults'];
            }

            if(this.dataSource) {
                this.dataSource.paginator = this.paginator;
            }  
        })
    }

    refresh() {
        this.getCurrentTutoringLessonsData();
    }
}
