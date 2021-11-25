import { FormControl, FormGroup } from '@angular/forms';
import { ApprovalStatus } from "../../models";
import deepDiff from 'deep-diff';
import subYears from 'date-fns/subYears';
import startOfDay from 'date-fns/startOfDay';

export function setFormValue(form: FormGroup, data: any) {
    for (const key in data) {
        const control = form.get(key);
        if (control instanceof FormControl) {
            control.setValue(data[key]);
        }
        if (control instanceof FormGroup) {
            setFormValue(control, data[key]);
        }
    }
}

export const getApprovalStatusDisplay = (approval: number): string =>{
    switch (approval) {
        case ApprovalStatus.ApprovalStatusNew:
            return "New";
        case ApprovalStatus.ApprovalStatusBackgroundCheckRequested:
            return "Pending Background Check";
        case ApprovalStatus.ApprovalStatusBackgroundCheckCompleted:
            return "Pending Approval";
        case ApprovalStatus.ApprovalStatusApproved:
            return "Approved";
        case ApprovalStatus.ApprovalStatusRejected:
            return "Rejected";
    }
}

export const getFunctionName = function (fn: Function): string {
    const result = /^function\s+([\w\$]+)\s*\(/.exec( fn.toString() );
    return result  ?  result[ 1 ]  :  '';
};

/**
 * Returns a deep object given a string. zoo['animal.type']
 * @param {object} obj
 * @param {string} path
 */
export function deepValueGetter(obj: Object, path: string) {
  if (!obj || !path) { return obj; }

  let current = obj;
  const split = path.split('.');

  if (split.length) {
    for (let i = 0, len = split.length; i < len; i++) {
      current = current[split[i]];

      // if found undefined, return empty string
      if (current === undefined || current === null) { return ''; }
    }
  }

  return current;
}

/**
 * Creates a unique object id.
 * http://stackoverflow.com/questions/6248666/how-to-generate-short-uid-like-ax4j9z-in-js
 */
export function id() {
  return ('0000' + (Math.random() * Math.pow(36, 4) << 0).toString(36)).slice(-4);
}

export function debounce(func: Function, wait: number, immediate?: boolean): Function {
    let timeout;
    return function() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias,prefer-rest-params
        const context = this, args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) { func.apply(context, args); }
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) { func.apply(context, args); }
    };
};

export function loadStyle(url: string, callback?: Function): Function {
    // HTMLLinkElement
    const link = document.createElement('link') as HTMLLinkElement;
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = url;
    link.onload = function () {
        if (callback) {
            callback();
        }
    };
    link.onerror = function () {};
    document.getElementsByTagName('head')[0].appendChild(link);

    return function removeStyle() {
        link.parentElement.removeChild(link);
    };
}

export function loadScript(url: string | string[], callback?: ()=>void ): ()=>any {

    function load(uri: string, cb: ()=>void): ()=>void {

      const node = document.createElement('script') as HTMLScriptElement;

      node.src = uri;
      node.type = 'text/javascript';
      node.async = true;

      node.onload = function(): void {
        if (cb) { cb(); }
      };

      document.getElementsByTagName('head')[0].appendChild(node);

      return function removeScript(): void {
        node.parentNode.removeChild(node);
      };

    } // - END OF LOAD FN

    if ( typeof(url) === 'string' ) {
      return load(url, callback);
    }

    let loaded = 0;
    const removeFns: (()=>void)[] = [];

    for (let i = 0; i < url.length; i++) {
      removeFns.push(load(url[i], function() {

        if (loaded === url.length - 1 && callback) {
            callback();
        }

        loaded++;
      }));
    }


    return function removeScriptComposite(): void {
      for (let i = 0; i < removeFns.length; i++) {
          removeFns[i]();
      }
    };
}

export function getQueryString(except: string[] = []): any {
    const query = window.location.search.substring(1);
    const vars = query.split('&');
    const out = {};

    for (let i = 0; i < vars.length; i++) {
        const parts = vars[i].split('=');
        if (parts.length !== 2) { continue; }
        const prop = decodeURIComponent(parts[0]);
        if (except && except.length && except.indexOf(prop) !== -1) {
            continue;
        }
        out[prop] = decodeURIComponent(parts[1]);
    }
    return out;
}

export function deepClone (obj) {
    const _out = new obj.constructor;
    const getType = function (n) {
        return Object.prototype.toString.call(n).slice(8, -1);
    };

    for (const _key in obj) {
        if (obj.hasOwnProperty(_key)) {
            _out[_key] = getType(obj[_key]) === 'Object' || getType(obj[_key]) === 'Array' ? deepClone(obj[_key]) : obj[_key];
        }
    }
    return _out;
}

/**
 * returns a new object reflecting the new values and omiting unchanged values
 * @param oldObj
 * @param newObj
 */
export function getChanges(oldObj: {[k:string]: any}, newObj: {[k:string]: any}) {
    const result = {};
    const changes = deepDiff.diff(oldObj, newObj);
    for (const change of changes) {
        deepDiff.applyChange(result, newObj, change);
    }
    return result;
}

export const ObjectId = (m = Math, d = Date, h = 16, s = s => m.floor(s).toString(h)) => {
    return s(d.now() / 1000) + ' '.repeat(h).replace(/./g, () => s(m.random() * h));
}

/**
 * converts object to query string with URL encoding
 */
export const toQueryString = (obj: { [key: string]: string | number | boolean | null}) => {
    return Object.entries(obj).map(keyVal => `${encodeURIComponent(keyVal[0])}=${encodeURIComponent(keyVal[1])}`).join('&');
}

export const getMinimumBirthdate = (): Date => {
    return startOfDay(subYears(new Date(), 100));
}

export const getMaximumBirthdate = (): Date => {
    return subYears(new Date(), 18);
}

export const getFileUrl = (path: string): string => {
    return `https://s3.amazonaws.com/learnt/${path}`;
}

export const getMimeTypeCategory = (mime: string): string => {
    const [type, subtype] = (mime.split(';')[0]).split('/')
    let category = type;
    if (subtype === 'pdf') {
        category = subtype;
    }
    return category;
}
