import {EventEmitter, Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {Subject} from '../models';

@Injectable()
export class SearchService {
    private _searchKeyword: BehaviorSubject<string> = new BehaviorSubject<string>('');
    public keyword: Observable<string> = this._searchKeyword.asObservable();

    private _searchSubject: BehaviorSubject<Subject> = new BehaviorSubject<Subject>(null);
    public subject: Observable<Subject> = this._searchSubject.asObservable();

    public filterVisibility: EventEmitter<boolean> = new EventEmitter<boolean>();
    public working: EventEmitter<boolean> = new EventEmitter<boolean>();

    public filterClicked: EventEmitter<boolean> = new EventEmitter<boolean>();

    public SearchKeyword(keyword: string): void {
        this._searchKeyword.next(keyword);
    }

    public SearchSubject(subject: Subject): void {
        this._searchSubject.next(subject);
    }
}
