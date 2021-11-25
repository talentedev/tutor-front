import {Logger} from '../lib/core/common/logger';
import {HttpResponse, HttpErrorResponse} from '@angular/common/http';
import {ErrorHandler, Injectable} from '@angular/core';
import {isUndefined} from 'util';
import { AlertService } from './alerts';

let errors = 0;

@Injectable()
export class NerdlyErrorHandler implements ErrorHandler {

    constructor(private logger: Logger, private alerts: AlertService) {}

    handleError(error: Error) {
        
        if (!error) {
            return;
        }

        if (error instanceof Response) {

            if (error.status === 0) {
                return;
            }

            error = new Error(`Status ${error.status} while accesing: ${error.url}`);
        }

        if (error instanceof Error) {
            console.log(error);
            const a = this.alerts.alert(
                'An error occurred',
                error.message,
                {
                    lifetime: 0,
                    buttons: [
                        { label: 'OK', result: true}
                    ]
                }
            );

            a.result.subscribe(() => a.dispose())
        }
    }
}
