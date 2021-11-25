import { Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { NotificationsService } from "../../services/notifications";
import { Backend } from "../../lib/core/auth";
import { LibraryFile } from "../../models/library";
import { MatCheckbox, MatCheckboxChange } from "@angular/material/checkbox";
import { BehaviorSubject, Observable, Subscription } from "rxjs/Rx";
import { concatMap, take, toArray } from "rxjs/operators";
import { FormControl } from "@angular/forms";
import { getFileUrl, getMimeTypeCategory } from "../../lib/core/utils";
import { AlertService } from "../../services/alerts";

const MAX_FILE_SIZE_KB = 50 * 1000 * 1000;
enum Views {
    TableView = 'table',
    GridView = 'grid',
}

@Component({
    selector: 'learnt-file-library',
    templateUrl: './file-library.component.html',
    styleUrls: ['./file-library.component.scss']
})
export class FileLibraryComponent implements OnInit, OnDestroy {
    @ViewChild('file', {read: ElementRef, static: true}) fileInput: ElementRef;
    @ViewChildren('checkbox') checkboxes: QueryList<MatCheckbox>;
    @ViewChild('selectAll') selectAll: MatCheckbox;

    private files_: LibraryFile[] = [];
    files: LibraryFile[] = [];
    columnsToDisplay = ['select', 'filename', 'date', 'uploader'];
    view = Views.TableView;
    Views = Views;
    uploading = false;
    selectedCount$ = new BehaviorSubject(0);
    private subs = new Subscription();
    search: FormControl;
    deleting = false;

    constructor(private notifs: NotificationsService,
                private backend: Backend,
                private alerts: AlertService) {
        this.search = new FormControl('');
    }

    ngOnInit(): void {
        this.fileInput.nativeElement.addEventListener('change', this.uploadFile.bind(this));
        this.getFiles();
        this.subs.add(this.search.valueChanges.subscribe(val => {
           this.files = this.files_.filter(file => file.name.toLowerCase().includes(val.toLowerCase()));
        }));
        this.subs.add(this.selectedCount$.subscribe((count) => {
            if (this.selectAll) {
                this.selectAll.checked = count === this.checkboxes.length && count > 0;
            }
        }));
    }

    ngOnDestroy(): void {
        this.fileInput.nativeElement.removeEventListener('change', this.uploadFile.bind(this));
        this.subs.unsubscribe();
    }

    private getFiles(): void {
        this.subs.add(this.backend.getFileLibrary().subscribe((data: {files: LibraryFile[]}) => {
            this.files_ = data.files.map(file => {
                file.category = getMimeTypeCategory(file.mime);
                return file;
            });
            this.files = this.files_.filter(file => file.name.toLowerCase().includes(this.search.value.toLowerCase()));
        }));
    }

    private uploadFile(): void {
        const files = this.fileInput.nativeElement.files;
        if (files.length) {
            const fileBlob = new Blob(files, {type: files[0].type || 'application/octet-stream'});
            if (fileBlob.size > MAX_FILE_SIZE_KB) {
                this.notifs.notify('Error', 'File exceeds 50 MB in size');
                return;
            }
            const formData = new FormData();
            formData.append('file', fileBlob, files[0].name);
            this.uploading = true;
            this.subs.add(this.backend.uploadToLibrary(formData).subscribe(upload => {
                this.getFiles();
            }, (err) => {
                this.notifs.notify('Error uploading', 'File upload failed: ' + err.error.message || 'Unexpected error occured');
                console.error(err.error);
            }, () => {
                this.uploading = false;
            }));
            this.fileInput.nativeElement.value = null;
        }
    }

    delete(id): void {
        const alertOpts = {lifetime: 60000, buttons: [{label: 'Yes', result: true}, {label: 'Cancel', result: false}]};
        const alertMessage = 'Are you sure you want to delete this file?';
        const alert = this.alerts.alert('Confirm deletion', alertMessage, alertOpts);

        alert.result.pipe(take(1)).subscribe((proceed) => {
            if (proceed) {
                this.deleting = true;
                this.subs.add(this.backend.deleteLibraryFile(id)
                    .subscribe(() => this.getFiles(),
                                err => this.notifs.notify('Error', err.error.message)));
            }
            alert.dispose();
        });
    }

    download(url) {
        window.open(getFileUrl(url));
    }

    getFileUrl = getFileUrl;
}
