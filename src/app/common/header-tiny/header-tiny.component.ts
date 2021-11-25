import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Media } from '../../lib/core/media';
import { Auth } from "../../lib/core/auth";
import { User } from "../../models";
import { Subscription } from "rxjs/Rx";

@Component({
  selector: 'learnt-header-tiny',
  templateUrl: './header-tiny.component.html',
  styleUrls: ['./header-tiny.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderTinyComponent implements OnInit, OnDestroy {

  public isHomepage = false;
  public mobile: boolean;
  me: User;
  subs = new Subscription();

  constructor(private router: Router, private media: Media, private auth: Auth) {
    this.mobile = !media.query('gt-sm');
    this.subs.add(this.auth.me.subscribe(me => this.me = me));
  }

  ngOnInit() {
    if(this.router.url === '/') {
      this.isHomepage = true;
    }
  }

  ngOnDestroy() {
      this.subs.unsubscribe();
  }
}
