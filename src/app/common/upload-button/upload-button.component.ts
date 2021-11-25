import { Upload, UploadState } from '../../models';
import { Backend } from '../../lib/core/auth';
import { Component, ElementRef, forwardRef, Input, OnInit, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AlertService } from '@services/alerts';

@Component({
    selector: 'learnt-upload-button',
    templateUrl: './upload-button.component.html',
    styleUrls: ['./upload-button.component.scss'],
    providers: [
        {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UploadButtonComponent), multi: true}
    ]
})
export class UploadButtonComponent implements OnInit, ControlValueAccessor {

    @ViewChild('fileInput', {static: true}) input: ElementRef<HTMLInputElement>;

    private _uploadOnSelect = true;
    @Input()
    set uploadOnSelect(val: any) {
        this._uploadOnSelect = val;
    };

    @Input()
    context: string;

    @Input()
    placeholder: string;

    @Input()
    extensions: string[];

    @Input()
    mimes: string[];

    @Input()
    maxSize: number;  // size in bytes

    public accept: string;

    file: File;

    uploading: boolean;

    private _disabled = false;

    @Input()
    set disabled(val: boolean) {
        this._disabled = val;
    }

    get disabled(): boolean {
        return this._disabled;
    }

    upload: Upload;
    @ViewChild('button', {static: true}) button: ElementRef;

    onChangeFn: (upload: Upload | File) => void;

    onTouchedFn: () => void;

    constructor(
        private backend: Backend,
        private alerts: AlertService,
    ) {
    }

    ngOnInit() {
        if (!this.context) {
            this.disabled = true;
        }

        this.buildAccept();

        const events = ['drag', 'dragend', 'dragleave', 'drop'];
        this.button.nativeElement.addEventListener('dragenter', e => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.setData('text/plain', e.target.id);
            e.dataTransfer.effectAllowed = 'copy';
        });
        this.button.nativeElement.addEventListener('dragover', e => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
            this.button.nativeElement.classList.add('active');
        });
        events.map(eventName => {
            this.button.nativeElement.addEventListener(eventName, e => {
                e.preventDefault();
                e.stopPropagation();
                if (['dragleave', 'dragend', 'drop'].includes(e.type)) {
                    this.button.nativeElement.classList.remove('active');
                }
                if (e.type === 'drop') {
                    this.onFileChange(e.dataTransfer.files[0]);
                }
            });
        });
    }

    /**
     * Build the accepted filter with the extensions and mimes provided.
     */
    private buildAccept(): void {
        this.accept = '';

        if (Array.isArray(this.extensions)) {
            for (const extension of this.extensions) {
                if (typeof extension !== 'string') {
                    continue;
                }
                this.accept += '.' + extension + ', ';
            }
        }

        if (Array.isArray(this.mimes)) {
            for (const mime of this.mimes) {
                if (typeof mime !== 'string') {
                    continue;
                }
                this.accept += mime + ', ';
            }
        }

        this.accept = this.accept.replace(/[, ]+$/, '');
    }

    onFileChange(file: File) {
        if (!file) return;
        const extension = file.name.slice(file.name.lastIndexOf('.'));
        const type = file.type;
        if (!type && this.accept.length > 0) return;
        if (!(this.accept.includes(file.type) || this.accept.includes(extension))) {
            return;
        }
        if (this.maxSize && file.size > this.maxSize) {
            this.alerts.alert('Exceeds limit', 'File exceeds the maximum upload size');
            return;
        }

        this.onTouchedFn();

        if (!this._uploadOnSelect) {
            this.onChangeFn(file);
            return;
        }

        this.uploading = true;
        this.file = file;
        const data = new FormData();
        data.append('file', this.file);
        data.append('context', this.context);
        data.append('accept', this.accept)

        const onFailure = (err) => {
            console.error(err);
            this.uploading = false;
            this.alerts.alert('Failed upload', 'Failed to upload');
        }

        this.backend.upload(data).subscribe(
            upload => {
                console.log(upload);
                const onSuccess = (up) => {
                    this.upload = up;
                    this.onChangeFn(up);
                    this.uploading = false;
                };

                if (upload.state === UploadState.Succeeded) {
                    onSuccess(upload);
                    return;
                }

                // poll upload state
                const check = () => (setTimeout(() => {
                    this.backend.getUpload(upload._id).subscribe(up => {
                        console.log(up);
                        if (up.state === UploadState.Succeeded) {
                            onSuccess(up);
                        }
                        else if (up.state === UploadState.Initiated) {
                            check();
                        }
                        else {
                            onFailure(null);
                        }
                    }, onFailure);
                }, 2000));

                check();
            },
            onFailure,
        );
    }

    /**
     * Delete the selected file.
     */
    delete(event: Event) {
        event.preventDefault();
        event.stopPropagation();
        this.file = null;
        this.input.nativeElement.value = "";
        this.onChangeFn(null);
    }


    /**
     * Write a new value to the element.
     */
    writeValue(value: Upload): void {
        this.upload = value;
        if (value) {
            this.file = {name: value.name} as File;
        } else {
            this.input.nativeElement.value = '';
            this.file = null;
        }
    }

    /**
     * Set the function to be called when the control receives a change event.
     */
    registerOnChange(fn: any): void {
        console.log('registeronchange', fn, this.context);
        this.onChangeFn = fn;
    }

    /**
     * Set the function to be called when the control receives a touch event.
     */
    registerOnTouched(fn: any): void {
        this.onTouchedFn = fn;
    }

    /**
     * This function is called when the control status changes to or from "DISABLED".
     * Depending on the value, it will enable or disable the appropriate DOM element.
     *
     * @param isDisabled
     */
    setDisabledState?(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    onClick(): void {
        if (this.uploading || this.file) {
            return;
        }
        this.input.nativeElement.click();
    }

    reset(): void {
        this.input.nativeElement.value = "";
        this.file = null;
    }
}
