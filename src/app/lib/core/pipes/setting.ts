import { Pipe, PipeTransform } from '@angular/core';
import { Platform } from './../../../services/platform';

@Pipe({name: 'setting'})
export class SettingPipe implements PipeTransform {

  constructor(private platform: Platform) {}

  transform(name: string, def?: any): any {
    return this.platform.setting(name, def);
  }
}
