import { AbstractControl, FormArray, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import * as usBankAccountValidator from 'us-bank-account-validator';
import {
    addSeconds,
    differenceInHours,
    differenceInMinutes,
    differenceInYears,
    isAfter,
    isBefore,
    parse,
} from 'date-fns';
import * as moment from 'moment';

/**
 * Password validator. Implements logic for: at least a lowercase character, one uppercase,
 * and a digit.
 * @param {AbstractControl} control
 * @return {ValidationErrors|null}
 */
export function PasswordValidator(control: AbstractControl): ValidationErrors | null {
    const password: string = control.value;
    const failedTasks: { [key: string]: string } = {};

    if (!/[a-z]/.test(password)) {
        failedTasks['lowerChar'] = 'Password must contain at least a lowercase character.';
    }

    if (!/[A-Z]/.test(password)) {
        failedTasks['upperChar'] = 'Password must contain at least an uppercase character.';
    }

    if (!/[0-9]/.test(password)) {
        failedTasks['digit'] = 'Password must contain at least a digit.';
    }

    if (Object.keys(failedTasks).length > 0) {
        return { passwordValidator: failedTasks };
    }

    return null;
}

export function HasLowercase(control: AbstractControl): ValidationErrors | null {
    return !/[a-z]/.test(control.value) ? {hasLowercase: 'Password must contain at least a lowercase character.'} : null;
}

export function HasUppercase(control: AbstractControl): ValidationErrors | null {
    return !/[A-Z]/.test(control.value) ? {hasUppercase: 'Password must contain at least an uppercase character.'} : null;
}

export function HasDigit(control: AbstractControl): ValidationErrors | null {
    return !/[0-9]/.test(control.value) ? {hasDigit: 'Password must contain at least a digit.'} : null;
}

/**
 * Form wide validator for password confirmation. Optional fields for specifying field names.
 * Defaults to 'password' for the password field and 'confirmPassword' for the confirmation field.
 * @param {string} passField
 * @param {string} passConfirmField
 * @return {ValidatorFn}
 */
export function PasswordMatchValidator(
    passField: string = 'password',
    passConfirmField: string = 'confirmPassword'
): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const password = control.get(passField);
        const confirmPassword = control.get(passConfirmField);

        if (password === undefined || password === null || confirmPassword === undefined || confirmPassword === null) {
            return null;
        }

        if (password.value !== confirmPassword.value) {
            confirmPassword.setErrors({
                confirmPassword: 'passwords must be identical',
            });
        } else {
            return null;
        }
    };
}

const mod97 = (s: string): number => {
    let checksum: string | number = s.slice(0, 2);
    let fragment;
    for (let offset = 2; offset < s.length; offset += 7) {
        fragment = String(checksum) + s.substring(offset, offset + 7);
        checksum = parseInt(fragment, 10) % 97;
    }
    return parseInt('' + checksum, 10);
};

/**
 * US Bank account number validator. Implements Braintree's open sourced validator (https://github.com/braintree/us-bank-account-validator).
 * It only checks for valid length, as they don't limit to digits only.
 * @param {AbstractControl} control
 * @return {ValidationErrors | null}
 */
export function USBankNumberValidator(control: AbstractControl): ValidationErrors | null {
    return usBankAccountValidator.accountNumber(control.value).isValid
        ? null
        : { usBankNumber: 'US bank number is invalid' };
}

/**
 * US Bank routing number validator. Implements Braintree's open sourced validator (https://github.com/braintree/us-bank-account-validator).
 * @param {AbstractControl} control
 * @return {ValidationErrors | null}
 */
export function USBankRoutingValidator(control: AbstractControl): ValidationErrors | null {
    return usBankAccountValidator.routingNumber(control.value).isValid
        ? null
        : { usBankRouting: 'US bank routing number is invalid' };
}

/**
 * Mutual exclusive validator. Checks if only one of two fields is set.
 * @param {string} first
 * @param {string} second
 * @return {ValidatorFn}
 * @constructor
 */
export function MutualExclusiveValidator(first: string, second: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const firstField = control.get(first);
        const secondField = control.get(second);

        if (firstField === undefined || firstField === null || secondField === undefined || secondField === null) {
            return null;
        }

        let firstFieldErrors = firstField.errors;
        let secondFieldErrors = secondField.errors;

        const hasFirstFieldValue = firstField.value !== undefined && firstField.value !== null,
            hasSecondFieldValue = secondField.value !== undefined && secondField.value !== null;

        if ((firstField.value !== '' && secondField.value === '') || (hasFirstFieldValue && !hasSecondFieldValue)) {
            if (firstFieldErrors !== null) {
                delete firstFieldErrors.mutualExclusive;
                delete firstFieldErrors.apiError;
                if (Object.keys(firstFieldErrors).length === 0) {
                    firstFieldErrors = null;
                }
                firstField.setErrors(firstFieldErrors);
            }
            secondField.setErrors(null);
            return null;
        }

        if ((firstField.value === '' && secondField.value !== '') || (!hasFirstFieldValue && hasSecondFieldValue)) {
            if (secondFieldErrors !== null) {
                delete secondFieldErrors.mutualExclusive;
                delete secondFieldErrors.apiError;
                if (Object.keys(secondFieldErrors).length === 0) {
                    secondFieldErrors = null;
                }
                secondField.setErrors(secondFieldErrors);
            }
            firstField.setErrors(null);
            return null;
        }

        firstField.setErrors({ mutualExclusive: true });
        secondField.setErrors({ mutualExclusive: true });
    };
}

/**
 * IsSSN checks if the provided control offers a valid Social Security Number.
 * @link http://rion.io/2013/09/10/validating-social-security-numbers-through-regular-expressions-2/
 * @param control
 * @return {ValidationErrors|null}
 */
export const IsValidSSN = (control: AbstractControl): ValidationErrors | null => {
    if (control === undefined || control === null) {
        return null;
    }

    const value: string = control.value;
    if (!value) {
        return null;
    }

    const ssnPattern = new RegExp('^(?!219-09-9999|078-05-1120)(?!666|000|9\\d{2})\\d{3}-(?!00)\\d{2}-(?!0{4})\\d{4}$');

    if (!ssnPattern.test(value)) {
        return { isSSN: 'invalid ssn' };
    }

    return null;
};

export const HasTrue = (control: AbstractControl): ValidationErrors | null => {
    const controls = control as FormArray;
    return controls.getRawValue().includes(true) ? null : { hasTrue: 'No value is truthy.' };
};

/**
 * returns an error if start date is greater than end date
 * @param startControlName - formControlName of start date
 * @param endControlName - formControlName of end date
 */
export const StartDateValidator = (startControlName: string, endControlName: string): ValidatorFn => (
    group: FormGroup
): ValidationErrors | null => {
    const startDate: moment.Moment = group.get(startControlName).value;
    const endDate: moment.Moment = group.get(endControlName).value;
    if (startDate && endDate && isAfter(startDate.toDate(), endDate.toDate())) {
        return { startDate: 'Start date cannot be after end date.' };
    }
    return null;
};

/**
 * returns an error if end date is less than start date
 * @param endControlName - formControlName of end date
 * @param startControlName - formControlName of start date
 */
export const EndDateValidator = (endControlName: string, startControlName: string): ValidatorFn => (
    group: FormGroup
): ValidationErrors | null => {
    const startDate: moment.Moment = group.get(startControlName).value;
    const endDate: moment.Moment = group.get(endControlName).value;
    if (startDate && endDate && isBefore(endDate.toDate(), startDate.toDate())) {
        return { endDate: 'End date cannot be before start date' };
    }
    return null;
};

/**
 * returns an error if start time and date is before 1 hour from current time
 * @param startTimeControlName
 * @param startDateControlName
 * @constructor
 */
export const StartTimeValidator = (startTimeControlName: string, startDateControlName: string): ValidatorFn => (
    group: FormGroup
): ValidationErrors | null => {
    const startTime: string = group.get(startTimeControlName).value;
    const endDate: moment.Moment = group.get(startDateControlName).value;

    if (startTime && endDate && endDate.isValid()) {
        const startDateTime: Date = parse(startTime, 'h:mm a', endDate.toDate());
        if (isBefore(startDateTime, addSeconds(new Date(), 3540))) {
            return { startTime: 'Should be at least an hour from now.' };
        }
    }
    return null;
};

/**
 * returns an error if end datetime is before start datetime or time range is less than an hour
 * @param endTimeControlName
 * @param endDateControlName
 * @param startTimeControlName
 * @param startDateControlName
 * @constructor
 */
export const EndTimeValidator = (
    endTimeControlName: string,
    endDateControlName: string,
    startTimeControlName: string,
    startDateControlName: string
): ValidatorFn => (group: FormGroup): ValidationErrors | null => {
    const startTime: string = group.get(startTimeControlName).value;
    const startDate: moment.Moment = group.get(startDateControlName).value;
    const endTime: string = group.get(endTimeControlName).value;
    const endDate: moment.Moment = group.get(endDateControlName).value;
    if (startTime && startDate && endTime && endDate) {
        const start = parse(startTime, 'h:mm a', startDate.toDate());
        const end = parse(endTime, 'h:mm a', endDate.toDate());
        if (isBefore(end, start) || differenceInHours(end, start) < 1) {
            return {
                endTime: 'Should be at least an hour after start time',
            };
        }
    }
    return null;
};

/**
 * Validates US Zip code
 * @param control
 * @constructor
 */
export const USZipCodeValidator = (control: AbstractControl): ValidationErrors | null => {
    if (/(^\d{5}$)|(^\d{5}-\d{4}$)/.test(control.value)) {
        return null;
    }
    return {
        zipCode: 'Invalid US ZIP code',
    };
};

/**
 * Validates birthdate field or datepicker using native Date object
 */
export const BirthDateValidator = (control: AbstractControl): ValidationErrors | null => {
    if (differenceInYears(new Date(), control.value) >= 18) {
        return null;
    }
    return { birthdate: 'Age should be at least 18' };
};

export const YouTubeVideoRegex = new RegExp(
    '^(https:\\/\\/)(www\\.youtube\\.com|youtu\\.?be)\\/(watch\\?v=)?(?<id>[\\w-]+)'
);

export const YouTubeUrlValidator = (control: AbstractControl): ValidationErrors | null => {
    return YouTubeVideoRegex.test(control.value?.trim()) ? null : { url: 'Invalid YouTube video url' };
};

export const VideoDurationValidator = (controlName: string): ValidatorFn => {
    return (form: FormGroup): ValidationErrors | null => {
        return form.get(controlName).value?.duration < 90 ? { duration: 'Video should be at least 90 seconds' } : null;
    };
};

export const VideoSizeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const MAX_UPLOAD_SIZE_BYTES = 500000000;
    return (control.value?.size || 0) > MAX_UPLOAD_SIZE_BYTES
        ? { size: 'Video exceeds 500 MB maximum upload size' }
        : null;
};

export const ExpiryValidator = (propertyName: string, minimum: number): ValidatorFn => (
    control: AbstractControl
): ValidationErrors | null => {
    if (!control.value) {
        return null;
    }
    const expiry = new Date(control.value[propertyName]);
    const expiresIn = differenceInMinutes(expiry, new Date());
    return expiresIn > minimum ? null : { expiry: 'Upload is expired' };
};

export const MinimumLengthValidator = (minimum: number): ValidatorFn => (
    control: AbstractControl
): ValidationErrors | null => {
    return control.value.length < minimum ? { length: `Should be at least ${minimum} in length` } : null;
};
