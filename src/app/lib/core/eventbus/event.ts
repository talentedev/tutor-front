export class BusEvent {

  private _propagationStopped = false;

  private _event: string;

  private _data: any;

  constructor(event: string, data) {
    this._event = event;
    this._data  = data;
  }

  get data(): any {
    return this._data;
  }

  get event(): string {
    return this._event;
  }

  stopPropagation() {
    this._propagationStopped = true;
  }

  isPropagationStopped() {
    return this._propagationStopped;
  }
}
