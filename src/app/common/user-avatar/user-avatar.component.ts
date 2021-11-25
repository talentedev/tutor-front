import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Auth } from '../../lib/core/auth';
import { User } from '../../models/user';
import { PresenceLabel, UserPresence } from './../../lib/core/userpresence';

@Component({
    selector: 'learnt-user-avatar',
    templateUrl: './user-avatar.component.html',
    styleUrls: ['./user-avatar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserAvatarComponent implements OnInit, OnDestroy {

    @Input()
    user: User;

    @Input()
    link = true;

    @Input()
    @HostBinding('style.width.px')
    @HostBinding('style.height.px')
    size = 41;

    @Input()
    @HostBinding('style.marginRight.px')
    mright = 0;

    @HostBinding('style.border')
    border: string;

    @HostBinding('matTooltip')
    get name() {
        return this.user ? this.user.shortName : '';
    }

    statusStyle: any = {};

    status: PresenceLabel;

    presenceSubscription: Subscription;

    me: User;

    constructor(private auth: Auth,
                private cd: ChangeDetectorRef,
                private userpresence: UserPresence) {
        auth.me.subscribe(me => this.me = me);
    }

    ngOnInit() {

        if (!this.user) {
            this.user = this.me;
        }

        if (!this.user) {
            throw new Error('Please set [user] for this avatar');
        }

        if (!this.me) {
            this.status = this.user.online ? 'online' : 'offline';
        } else {
            this.status = this.userpresence.label(this.user);
        }

        this.presenceSubscription = this.userpresence.changes.subscribe(
            () => {
                this.status = this.userpresence.label(this.user)
                this.cd.detectChanges();
            }
        );

        const angle = 125;
        const borderWidth = (this.size / 20);
        const radius = this.size / 2;

        // this.border = borderWidth + 'px solid #FFF';

        this.statusStyle = {
            width: (this.size / 4),
            height: (this.size / 4),
            borderWidth: 2,
            left: (Math.sin(angle * Math.PI / 180) * radius) + radius - (this.size / 4 - borderWidth * 2),
            top: (Math.sin(angle * Math.PI / 180) * radius) + radius - (this.size / 4 - borderWidth * 2)
        };
    }

    ngOnDestroy() {
        if (this.presenceSubscription) {
            this.presenceSubscription.unsubscribe();
        }
    }

    public isTutor(): boolean {
        if (this.user.isTutor === undefined) {
            // on messenger we show profile pictures for a different type of User
            // who doesn't have the isTutor() method available
            return false;
        }
        return this.user.isTutor();
    }
}
