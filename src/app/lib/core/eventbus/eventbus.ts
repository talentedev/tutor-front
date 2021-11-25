import { Callback } from './callback';
import { BusEvent } from './event';

const MAX_HANDLERS_NUM = 5;

export class EventBus {

  private events: {[key: string]: Callback[]; } = {};

  on(name: string, callback: Callback): void {
    this.events[name] = this.events[name] || [];

    if (this.events[name].length > MAX_HANDLERS_NUM) {
      throw new Error('BUS_MAX_HANDLERS_REACHED(' + MAX_HANDLERS_NUM + ') for ' + name);
    }

    this.events[name].push(callback);
    this.events[name].sort((a: Callback, b: Callback) => a.priority - b.priority);
  }

  emit(event: BusEvent): void {
    if (this.events[event.event]) {
        for (let i = 0; i < this.events[event.event].length; i++) {
            this.events[event.event][i].execute(event);
            if (event.isPropagationStopped()) {
              break;
            }
        }
    }
  }

  off(event: string, handler: Function): void {
    if (this.events[event]) {
      for (let i = 0; i < this.events[event].length; i++) {
        if (this.events[event][i].equals(handler)) {
          this.events[event].splice(i, 1);
        }
      }
    }
  }

  length(event?: string) {
    if (!event) {
      let count = 0;
      for (const ename in this.events) {
        count += (this.events[ename] || []).length;
      }
      return count;
    }
    return (this.events[event] || []).length;
  }
}
