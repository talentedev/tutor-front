import {Directive, HostBinding} from '@angular/core';

@Directive({
  selector: '[learntInput]'
})
export class InputDirective {

  constructor() { }

  @HostBinding('class.learnt-input') true;

}
