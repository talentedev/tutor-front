import { Injectable } from '@angular/core';
import { Auth, TokenLocalStorage } from './lib/core/auth';

@Injectable()
export class AppInitService {

    constructor(
    ) {
    }

    Init(auth: Auth, tokenStorage: TokenLocalStorage): Promise<void> {
        return new Promise<void>((resolve) => {
            const token = tokenStorage.get();
            if (token) {
                auth.refresh().then(resolve);
                return;
            }
            resolve();
        });
    }
}