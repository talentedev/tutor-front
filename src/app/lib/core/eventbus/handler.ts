export interface BusHandler {
  eventName?: string;
  args?: string[];
  priority?: number;
}

export interface BusHandlerDecorator {
    (eventName: string, args?: any[]): any;
    new (eventName: string, args?: any[]): any;
}

/**
 * @Annotation
 */
export function BusHandler(eventName: string, args?: any[]) {
    const Reflect: any = window['Reflect'];
    return function PropDecorator(target: any, name: string) {
        const meta = Reflect.getOwnMetadata('propMetadata', target.constructor) || {};
        meta[name] = meta.hasOwnProperty(name) && meta[name] || [];
        meta[name].unshift({
            isEventBusAnnotation: true,
            eventName,
            args
        });
        Reflect.defineMetadata('propMetadata', meta, target.constructor);
    };
}

BusHandler.prototype.toString = () => '@BusHandler';
(<any>BusHandler).annotationCls = BusHandler;
