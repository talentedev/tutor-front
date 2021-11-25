import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { User } from 'app/models';
import { MinuteSecondsPipe } from '../../lib/core/pipes/minuteSeconds.pipe';

@Component({
  selector: 'learnt-user-waited',
  templateUrl: './user-waited.component.html',
  styleUrls: ['./user-waited.component.scss']
})
export class UserWaitedDialogComponent implements OnInit {

  @Output() complete: EventEmitter<void> = new EventEmitter();
  @Output() end: EventEmitter<void> = new EventEmitter();

  public user: User
  public countdown: number;
  duration: number;
  private intv: any;
  minuteSeconds: any;
  shouldWait: boolean;

  constructor(private m: MinuteSecondsPipe) { 
        this.minuteSeconds = m
  }

  ngOnInit() {}

  init(user: User, duration: number) {
    if (!duration || duration < 5) {
      throw new Error('User waiting expects a duration greather than 5')
    }
    this.shouldWait = false;
    this.user = user;
    this.countdown = duration;
    this.duration = duration;
    this.intv = setInterval(() => {
      if (this.countdown > 0) {
        this.countdown--
        if (this.countdown === 0) {
          this.shouldWait = true;
          this.countdown = 0;
        }
      }
    }, 1000)
  }

  endSession() {
    this.end.next();
    this.end.complete();
  }

  wait() {
    this.countdown = this.duration;
    this.shouldWait = false;
    this.complete.next();
  }

  transform(value: number): string {
    return this.minuteSeconds.transform(value)
  }
}
