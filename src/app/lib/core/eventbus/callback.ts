import { BusEvent } from './event';
import { BusHandler } from './handler';

export class Callback {

  constructor( private _fn: Function, private _context: any, private _annotation: BusHandler ) {}

  private getExecutionParams(event: BusEvent): any[] {

    const params = [];

    if (!this._annotation.args || this._annotation.args.length === 0) {
      return params;
    }

    this._annotation.args.forEach(param => {

      if (param === '$event') {
        params.push(event);
        return true;
      }

      if (param === '$data') {
        params.push(event.data);
        return true;
      }

      const parts = param.split('.');

      if (parts.shift() !== '$event') {
        throw new Error('Invalid BusHandler argument. Use like: $event.title');
      }

      const path = parts.slice(0);

      if (!event.data[parts[0]]) {
        throw new Error('BusHandler param "' + parts.join('.') + '" not found');
      }

      const ref = event.data[parts.shift()];

      if (typeof(ref) === 'undefined') {
        params.push(ref);
        return true;
      }

      if (parts.length && Object.prototype.toString.call(ref) !== '[object Object]') {
        throw new Error('Path "' + path.join('.') + '" not found in event data: ' + JSON.stringify(event.data));
      }

      if (parts.length === 0) {
        params.push(ref);
        return true;
      }

      throw new Error('Not implemented');

    });

    return params;
  }

  get priority(): number {
    return this._annotation.priority || 0;
  }

  execute( event: BusEvent ) {
    this._fn.apply(
      this._context,
      this.getExecutionParams(event)
    );
  }

  equals(fn: Function): boolean {
    return fn === this._fn;
  }
}
