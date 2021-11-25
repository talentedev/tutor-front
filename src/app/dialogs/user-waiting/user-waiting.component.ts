import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { User } from 'app/models';

@Component({
  selector: 'learnt-user-waiting',
  templateUrl: './user-waiting.component.html',
  styleUrls: ['./user-waiting.component.scss']
})
export class UserWaitingDialogComponent implements OnInit {

  @Output() complete: EventEmitter<void> = new EventEmitter();
  @Output() end: EventEmitter<void> = new EventEmitter();

  public user: User
  public countdown: number;
  private intv: any;

  constructor() { }

  ngOnInit() {}

  init(user: User, duration: number) {
    
    if (!duration || duration < 5) {
      throw new Error('User waiting expects a duration greather than 5')
    }

    this.user = user;
    this.countdown = duration;
    this.intv = setInterval(() => {
      this.countdown--
      if (this.countdown === 0) {
        clearInterval(this.countdown);
        this.complete.next();
        this.complete.complete();
      }
    }, 1000)
  }

  endSession() {
    this.end.next();
    this.end.complete();
  }
}
