import { Injectable, EventEmitter } from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

export const MEDIA: {[k:string]: string} = {
  'xs'        : '(max-width: 599px)'                         ,
  'gt-xs'     : '(min-width: 600px)'                         ,
  'sm'        : '(min-width: 600px) and (max-width: 959px)'  ,
  'gt-sm'     : '(min-width: 960px)'                         ,
  'md'        : '(min-width: 960px) and (max-width: 1279px)' ,
  'gt-md'     : '(min-width: 1280px)'                        ,
  'lg'        : '(min-width: 1280px) and (max-width: 1919px)',
  'gt-lg'     : '(min-width: 1920px)'                        ,
  'xl'        : '(min-width: 1920px)'                        ,
  'landscape' : '(orientation: landscape)'                   ,
  'portrait'  : '(orientation: portrait)'                    ,
  'print' : 'print'
};

export const MEDIA_PRIORITY: string[] = [
  'xl',
  'gt-lg',
  'lg',
  'gt-md',
  'md',
  'gt-sm',
  'sm',
  'gt-xs',
  'xs',
  'landscape',
  'portrait',
  'print'
];

export declare interface MediaChange {
  query: string;
  active: boolean;
}

export class MediaWatcher extends EventEmitter<{query: string, active: boolean}> {

  private media: MediaQueryList;
  private query: string;
  private sub: Subscription;

  constructor(query: string) {

    super();

    this.query = query;

    if (!MEDIA[query]) {
      throw new Error(`Media query '${query}' not found`);
    }

    this.media = window.matchMedia(MEDIA[query]);
    this.sub = fromEvent(window, 'resize').pipe(debounceTime(100)).subscribe(() => {
      const queryResult = window.matchMedia(MEDIA[query]);
      this.onQueryChange(queryResult)
    });
  }

  isActive() {
    return !!this.media.matches;
  }

  private onQueryChange(query: MediaQueryList): void {
    this.next({
      query: this.query,
      active: !!query.matches,
    });
  }

  complete(): void {
    this.sub?.unsubscribe();
    super.complete();
  }
}

@Injectable({providedIn: 'root'})
export class Media {

  private queries: any = {};
  private results: any = {};
  private mqls: any = {};

  query(q: string): boolean {

    let validated = this.queries[q];

    if (validated === undefined) {
      validated = this.queries[q] = this.validate(q);
    }

    let result = this.results[validated];
    if (result === undefined) {
      result = this.add(validated);
    }

    return result;
  }

  watch(query: string): MediaWatcher {
    return new MediaWatcher(query);
  }

  private add(query) {

    let result = this.mqls[query];

    if ( !result ) {
      result = this.mqls[query] = window.matchMedia(query);
    }

    fromEvent(window, 'resize').pipe(debounceTime(100)).subscribe(() => {
      this.onQueryChange(window.matchMedia(MEDIA[query]));
    });
    return (this.results[result.media] = !!result.matches);
  }

  private onQueryChange(query: MediaQueryList) {
    this.results[query.media] = !!query.matches;
  }

  private validate(query) {
    return MEDIA[query] || ((query.charAt(0) !== '(') ? ('(' + query + ')') : query);
  }
}
