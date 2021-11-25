import {BusHandler} from './handler';
import {Callback} from './callback';
import {getFunctionName} from '../utils';
import {Injectable} from '@angular/core';
import {BusEvent} from './event';
import {EventBus} from './eventbus';

const bus = new EventBus();

@Injectable()
export class Bus {
    emit(event: string, data?: any): BusEvent {
        const e: BusEvent = new BusEvent(event, data);
        bus.emit(e);
        return e;
    }
}

export function BindBus(constructor: any) {

    if (!constructor.prototype.ngOnDestroy) {
        console.error(
            'You must implement OnDestroy in order to avoid memory leaks on ' +
            getFunctionName(constructor.toString())
        );
    }

    // const r = new ɵReflector(new ɵReflectionCapabilities());

    const noop = () => {
    };

    const handlers: { [key: string]: BusHandler } = {};
    // const annotations = r.propMetadata(constructor);

    const ngOnInit = constructor.prototype.ngOnInit || noop;
    const ngOnDestroy = constructor.prototype.ngOnDestroy || noop;
    const count = 0;

    /*for (const prop in annotations) {
        annotations[prop].forEach(item => {
            if (item && item.isEventBusAnnotation) {
                handlers[prop] = item;
                count++;
            }
        });
    }*/

    if (!count && console.error) {
        console.error(
            'There are no bus handlers in ' + getFunctionName(constructor) + '. @BindBus can be removed!'
        );
    }

    constructor.prototype.ngOnInit = function () {
        for (const prop in handlers) {
            bus.on(handlers[prop].eventName, new Callback(this[prop], this, handlers[prop]));
        }
        ngOnInit.apply(this);
    };

    constructor.prototype.ngOnDestroy = function () {
        for (const prop in handlers) {
            bus.off(handlers[prop].eventName, this[prop]);
        }
        ngOnDestroy.apply(this);
    };

}
