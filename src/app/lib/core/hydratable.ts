import * as moment from 'moment-timezone';

export class Hydratable {

    constructor(raw?: any) {
        if (raw) {
            this.hydrate(raw);
        }
    }

    hydrate(raw: any) {

        const r: any = window['Reflect'];

        for (const property in raw) {

            const meta: any = r.getMetadata('hydrate', this, property) || {};
            const type = meta.type;
            const array = meta.array || false;

            if (!type) { continue; }

            const setProp = (name: string, value: any) => {
                if (typeof(this[name]) === 'function') {
                    this[name](value);
                }
                this[name] = value;
            };

            if (type.prototype instanceof Hydratable) {


                if (array && raw[property]) {

                    if (
                        Object.prototype.toString.call(raw[property]) !== '[object Array]'
                    ) {
                        console.warn(`Property ${property} is not array. Type of value is '${typeof raw[property]}'`);
                        continue;
                    }

                    if (raw[property].length === 0) {
                        continue;
                    }

                    setProp(property, raw[property].map(i => {
                        const v = new type();
                        v.hydrate(i);
                        return v;
                    }));

                    continue;
                }

                if (raw[property]) {
                    const v = new type();
                    v.hydrate(raw[property]);
                    setProp(property, v);
                }

                continue;
            }

            if (typeof(type) === 'function') {
                setProp(property, type(raw[property]))
                continue
            }


            switch (type) {
                case 'DEFAULT':
                    setProp(property, raw[property]);
                    break;
                case 'moment':
                    setProp(property, raw.zone ? moment.tz(raw[property], raw.zone) : moment(raw[property]));
                    break;
                case 'boolean':
                    setProp(property, Boolean(raw[property]));
                    break;
                case 'number':
                    setProp(property, parseInt(raw[property], 10));
                    break;
                case 'string':
                    setProp(property, raw[property] + '');
                    break;
                default:
                    if (typeof (type) === 'string' && type.indexOf('@') === 0) {
                        const bind = type.substr(1);
                        if (raw[bind]) {
                            setProp(bind, raw[bind]);
                        }
                    } else {
                        console.log('Unknown type:', type);
                    }
            }
        }
    }
}

export function  HydrateProperty(xtype?: any, array?: boolean) {
    return (target: any, propertyKey: string) => {
        const r: any = Reflect;
        if (typeof (xtype) === 'undefined') {
            xtype = 'DEFAULT';
        }
        r.defineMetadata('hydrate', { type: xtype, array: array }, target, propertyKey);
    };
}
