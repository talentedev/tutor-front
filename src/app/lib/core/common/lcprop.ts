export function LocalStorageBind(property?: string) {
    return function(target: any, propertyKey: string | symbol) {

        const allowed = ['boolean', 'number', 'string'];

        let type: any;

        const _ref_ = window['Reflect'] as any;
        const meta = _ref_.getMetadata('design:type', target, propertyKey);
        const result = /^function\s+([\w\$]+)\s*\(/.exec( meta.toString() );
        const fnName = result  ?  result[ 1 ]  :  '';

        if (fnName && fnName.length) {
            type = fnName.toLowerCase();
        }

        if (!property) {
            property = propertyKey.toString();
        }

        if (allowed.indexOf(type) === -1) {
            return console.error(
                'Allowed types for local storage bind are: [', allowed.join(', '), ']',
                'Please set the type of property', propertyKey, ('( ' + propertyKey.toString() + ': boolean )')
            );
        }

        Object.defineProperty(target, propertyKey, {
            get: function() {
                let val: any = localStorage.getItem(property);
                switch (type) {
                    case 'boolean':
                        val = (val === 'true' || val === '1');
                        break;
                    default:
                        break;
                }
                return val;
            },
            set: function(value: any) {
                localStorage.setItem(property, value);
            }
        });
    };
}
