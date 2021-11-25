import { Observable } from 'rxjs/Observable';

export interface AutocompleteInputData {
  id: string;
  casNumber: string;
  productNames: string[];
}

export declare interface AutocompleteInputDataProvider {
  provide(filter: string): Observable<AutocompleteInputData[]>;
};

