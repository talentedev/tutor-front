import { SocialBaseEntity } from './social-base.entity';

export class SocialErrorEntity extends SocialBaseEntity {

  private _network: string;
  private _error: { code, message };

  get network(): string {
    return this._network;
  }

  set network(value: string) {
    this._network = value;
  }

  get error(): { code; message } {
    return this._error;
  }

  set error(value: { code; message }) {
    this._error = value;
  }

}