export function check(against: any): Function {
    return data => {
        against = against || {};
        for (const key in against) {

            if (typeof(data[key]) === 'undefined') {
                throw new Error(key + ' missing');
            }

            const type = against[key];
            const value = data[key];

            let valid = true;

            switch (type) {
                case 'string':
                case 'boolean':
                case 'number':
                case 'function':
                    valid = (typeof value === type);
                    break;
                case 'date':
                    valid = Object.prototype.toString.call(value) === '[object Date]';
                    break;
                case 'object':
                    valid = (typeof value === 'object' && value.constructor === Object);
                    break;
                case 'array':
                    valid = (Object.prototype.toString.call(value) === '[object Array]');
                    break;
                case 'any':
                    valid = true;
                    break;
            }

            if (!valid) {
                throw new Error(key + ' must be ' + type);
            }
        }
    };
}
