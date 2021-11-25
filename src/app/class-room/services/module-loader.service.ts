import {Injectable, Injector, NgModuleFactory, NgModuleFactoryLoader, NgModuleRef} from '@angular/core';

@Injectable()
export class ModuleLoaderService {

    private cache: { [key: string]: NgModuleRef<any> } = {};

    constructor(private injector: Injector,
                private loader: NgModuleFactoryLoader) {
    }

    public get(path: string): Promise<NgModuleRef<any>> {
        console.log('Loading module', path, '...');

        return new Promise((next, fail) => {
            if (this.cache[path]) {
                console.log('Module loaded from cache');
                return next(this.cache[path]);
            }

            return this.loader.load(path)
                .then((factory: NgModuleFactory<any>) => {
                    console.log('Module loaded async');
                    this.cache[path] = factory.create(this.injector);
                    next(this.cache[path]);
                })
                .catch(err => fail(err));
        });
    }
}
