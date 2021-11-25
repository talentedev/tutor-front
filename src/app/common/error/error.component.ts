import {Component, HostBinding, OnInit} from '@angular/core';

@Component({
  selector: 'learnt-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.scss']
})
export class ErrorComponent implements OnInit {

  constructor() { }

  @HostBinding('class.learnt-error')

  ngOnInit(): void {
  }

}
