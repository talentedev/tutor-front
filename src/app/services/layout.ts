import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';

@Injectable()
export class LayoutService {
    private _showMenu: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
    public readonly showMenu: Observable<boolean> = this._showMenu.asObservable();

    public Menu(v: boolean): void {
        if (v) {
            this.ShowMenu();
        } else {
            this.HideMenu();
        }
    }

    public HideMenu(): void {
        this._showMenu.next(false);
    }

    public ShowMenu(): void {
        this._showMenu.next(true);
    }
}
