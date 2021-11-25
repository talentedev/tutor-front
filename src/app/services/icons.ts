import {DomSanitizer} from '@angular/platform-browser';
import {Injectable} from '@angular/core';
import {MatIconRegistry} from '@angular/material/icon';

@Injectable()
export class IconRegistryService {

    constructor(reg: MatIconRegistry, s: DomSanitizer) {
        reg.addSvgIcon('learnt-logo', s.bypassSecurityTrustResourceUrl('/assets/learnt-logo.svg'));

        reg.addSvgIcon('arrow-left', s.bypassSecurityTrustResourceUrl('/assets/arrow-left.svg'));
        reg.addSvgIcon('arrow-right', s.bypassSecurityTrustResourceUrl('/assets/arrow-right.svg'));
        reg.addSvgIcon('arrow-down', s.bypassSecurityTrustResourceUrl('/assets/arrow-down.svg'));
        reg.addSvgIcon('full-arrow-left', s.bypassSecurityTrustResourceUrl('/assets/full-arrow-left.svg'));
        reg.addSvgIcon('full-arrow-down', s.bypassSecurityTrustResourceUrl('/assets/full-arrow-down.svg'));
        reg.addSvgIcon('full-arrow-up', s.bypassSecurityTrustResourceUrl('/assets/full-arrow-up.svg'));
        reg.addSvgIcon('thunder', s.bypassSecurityTrustResourceUrl('/assets/thunder.svg'));
        reg.addSvgIcon('google-g', s.bypassSecurityTrustResourceUrl('/assets/google-g.svg'));
        reg.addSvgIcon('apple', s.bypassSecurityTrustResourceUrl('/assets/apple.svg'));
        reg.addSvgIcon('time', s.bypassSecurityTrustResourceUrl('/assets/time.svg'));
        reg.addSvgIcon('close', s.bypassSecurityTrustResourceUrl('/assets/close.svg'));
        reg.addSvgIcon('tick', s.bypassSecurityTrustResourceUrl('/assets/tick.svg'));
        reg.addSvgIcon('download', s.bypassSecurityTrustResourceUrl('/assets/download.svg'));
        reg.addSvgIcon('calendar', s.bypassSecurityTrustResourceUrl('/assets/icons/calendar.svg'));
        reg.addSvgIcon('exit', s.bypassSecurityTrustResourceUrl('/assets/exit.svg'));
        reg.addSvgIcon('dollar', s.bypassSecurityTrustResourceUrl('/assets/icons/dollar.svg'));
        reg.addSvgIcon('video', s.bypassSecurityTrustResourceUrl('/assets/video.svg'));
        reg.addSvgIcon('novideo', s.bypassSecurityTrustResourceUrl('/assets/novideo.svg'));
        reg.addSvgIcon('locked', s.bypassSecurityTrustResourceUrl('/assets/icons/locked.svg'));
        reg.addSvgIcon('refresh', s.bypassSecurityTrustResourceUrl('/assets/refresh.svg'));
        reg.addSvgIcon('bell', s.bypassSecurityTrustResourceUrl('/assets/bell.svg'));
        reg.addSvgIcon('menu', s.bypassSecurityTrustResourceUrl('/assets/menu.svg'));
        reg.addSvgIcon('history', s.bypassSecurityTrustResourceUrl('/assets/icons/history.svg'));
        reg.addSvgIcon('payout', s.bypassSecurityTrustResourceUrl('/assets/icons/payout.svg'));
        reg.addSvgIcon('profile', s.bypassSecurityTrustResourceUrl('/assets/icons/profile.svg'));
        reg.addSvgIcon('folder', s.bypassSecurityTrustResourceUrl('/assets/icons/folder.svg'));
        reg.addSvgIcon('camera', s.bypassSecurityTrustResourceUrl('/assets/icons/camera.svg'));
        reg.addSvgIcon('document', s.bypassSecurityTrustResourceUrl('/assets/icons/document.svg'));
        reg.addSvgIcon('time-icon', s.bypassSecurityTrustResourceUrl('/assets/icons/time_icon.svg'));
        reg.addSvgIcon('link-icon', s.bypassSecurityTrustResourceUrl('/assets/icons/link_icon.svg'));

        reg.addSvgIcon('pointer', s.bypassSecurityTrustResourceUrl('/assets/pointer.svg'));
        reg.addSvgIcon('user', s.bypassSecurityTrustResourceUrl('/assets/user.svg'));
        reg.addSvgIcon('users', s.bypassSecurityTrustResourceUrl('/assets/users.svg'));
        reg.addSvgIcon('tutor', s.bypassSecurityTrustResourceUrl('/assets/tutor.svg'));
        reg.addSvgIcon('circle-tick', s.bypassSecurityTrustResourceUrl('/assets/circle-tick.svg'));
        reg.addSvgIcon('book', s.bypassSecurityTrustResourceUrl('/assets/book.svg'));
        reg.addSvgIcon('star', s.bypassSecurityTrustResourceUrl('/assets/star.svg'));
        reg.addSvgIcon('mapmarker', s.bypassSecurityTrustResourceUrl('/assets/mapmarker.svg'));
        reg.addSvgIcon('map', s.bypassSecurityTrustResourceUrl('/assets/map.svg'));
        reg.addSvgIcon('i', s.bypassSecurityTrustResourceUrl('/assets/i.svg'));
        reg.addSvgIcon('mute', s.bypassSecurityTrustResourceUrl('/assets/mute.svg'));
        reg.addSvgIcon('unmute', s.bypassSecurityTrustResourceUrl('/assets/unmute.svg'));
        reg.addSvgIcon('fullscreen', s.bypassSecurityTrustResourceUrl('/assets/fullscreen.svg'));
        reg.addSvgIcon('fullscreen-close', s.bypassSecurityTrustResourceUrl('/assets/fullscreen-close.svg'));
        reg.addSvgIcon('edit', s.bypassSecurityTrustResourceUrl('/assets/edit.svg'));
        reg.addSvgIcon('letter', s.bypassSecurityTrustResourceUrl('/assets/letter.svg'));
        reg.addSvgIcon('code', s.bypassSecurityTrustResourceUrl('/assets/code.svg'));
        reg.addSvgIcon('virtual-room', s.bypassSecurityTrustResourceUrl('/assets/virtual-room.svg'));
        reg.addSvgIcon('question-circle', s.bypassSecurityTrustResourceUrl('/assets/question-circle.svg'));
        reg.addSvgIcon('card', s.bypassSecurityTrustResourceUrl('/assets/card.svg'));
        reg.addSvgIcon('notes', s.bypassSecurityTrustResourceUrl('/assets/notes.svg'));
        reg.addSvgIcon('lock', s.bypassSecurityTrustResourceUrl('/assets/lock.svg'));
        reg.addSvgIcon('account_box', s.bypassSecurityTrustResourceUrl('/assets/account_box.svg'));
        reg.addSvgIcon('3p', s.bypassSecurityTrustResourceUrl('/assets/3p.svg'));
        reg.addSvgIcon('search', s.bypassSecurityTrustResourceUrl('/assets/search.svg'));
        reg.addSvgIcon('search2', s.bypassSecurityTrustResourceUrl('/assets/icons/search.svg'));
        reg.addSvgIcon('flash', s.bypassSecurityTrustResourceUrl('/assets/icons/flash.svg'));
        reg.addSvgIcon('mail-red', s.bypassSecurityTrustResourceUrl('/assets/mail-red.svg'));
        reg.addSvgIcon('background-verified', s.bypassSecurityTrustResourceUrl('/assets/secure.svg'))

        // Calendar lesson state
        reg.addSvgIcon('checkmark', s.bypassSecurityTrustResourceUrl('/assets/checkmark.svg'));
        reg.addSvgIcon('hourglass', s.bypassSecurityTrustResourceUrl('/assets/hourglass.svg'));
        reg.addSvgIcon('cross', s.bypassSecurityTrustResourceUrl('/assets/cross.svg'));

        // Virtual class room
        reg.addSvgIcon('undo', s.bypassSecurityTrustResourceUrl('/assets/undo.svg'));
        reg.addSvgIcon('redo', s.bypassSecurityTrustResourceUrl('/assets/redo.svg'));
        reg.addSvgIcon('erase', s.bypassSecurityTrustResourceUrl('/assets/erase.svg'));
        reg.addSvgIcon('delete', s.bypassSecurityTrustResourceUrl('/assets/delete.svg'));
        reg.addSvgIcon('pencil', s.bypassSecurityTrustResourceUrl('/assets/pencil.svg'));
        reg.addSvgIcon('line', s.bypassSecurityTrustResourceUrl('/assets/line.svg'));
        reg.addSvgIcon('circle', s.bypassSecurityTrustResourceUrl('/assets/circle.svg'));
        reg.addSvgIcon('fill', s.bypassSecurityTrustResourceUrl('/assets/fill.svg'));
        reg.addSvgIcon('pencil-2', s.bypassSecurityTrustResourceUrl('/assets/pencil-2.svg'));
        reg.addSvgIcon('border-size', s.bypassSecurityTrustResourceUrl('/assets/border-size.svg'));
        reg.addSvgIcon('border-type', s.bypassSecurityTrustResourceUrl('/assets/border-type.svg'));
        reg.addSvgIcon('sum', s.bypassSecurityTrustResourceUrl('/assets/sum.svg'));
        reg.addSvgIcon('graph', s.bypassSecurityTrustResourceUrl('/assets/graph.svg'));
        reg.addSvgIcon('wolfram', s.bypassSecurityTrustResourceUrl('/assets/wolfram.svg'));
        reg.addSvgIcon('vcr-square', s.bypassSecurityTrustResourceUrl('/assets/vcr/square.svg'));
        reg.addSvgIcon('vcr-rectangle', s.bypassSecurityTrustResourceUrl('/assets/vcr/rectangle.svg'));
        reg.addSvgIcon('vcr-circle', s.bypassSecurityTrustResourceUrl('/assets/vcr/circle.svg'));
        reg.addSvgIcon('vcr-triangle', s.bypassSecurityTrustResourceUrl('/assets/vcr/triangle.svg'));
        reg.addSvgIcon('vcr-right-triangle', s.bypassSecurityTrustResourceUrl('/assets/vcr/right-triangle.svg'));

        reg.addSvgIcon('bold', s.bypassSecurityTrustResourceUrl('/assets/bold.svg'));
        reg.addSvgIcon('italic', s.bypassSecurityTrustResourceUrl('/assets/italic.svg'));
        reg.addSvgIcon('underline', s.bypassSecurityTrustResourceUrl('/assets/underline.svg'));

        reg.addSvgIcon('screen', s.bypassSecurityTrustResourceUrl('/assets/screen.svg'));
        reg.addSvgIcon('photo-camera', s.bypassSecurityTrustResourceUrl('/assets/photo-camera.svg'));
        reg.addSvgIcon('video-camera', s.bypassSecurityTrustResourceUrl('/assets/video-camera.svg'));

        // Notifications
        reg.addSvgIcon('security', s.bypassSecurityTrustResourceUrl('/assets/security.svg'));

        // Booking
        reg.addSvgIcon('morning', s.bypassSecurityTrustResourceUrl('/assets/booking/morning.svg'));
        reg.addSvgIcon('afternoon', s.bypassSecurityTrustResourceUrl('/assets/booking/afternoon.svg'));
        reg.addSvgIcon('evening', s.bypassSecurityTrustResourceUrl('/assets/booking/evening.svg'));

        // Social
        reg.addSvgIcon('facebook', s.bypassSecurityTrustResourceUrl('/assets/social/facebook.svg'));
        reg.addSvgIcon('twitter', s.bypassSecurityTrustResourceUrl('/assets/social/twitter.svg'));
        reg.addSvgIcon('gmail', s.bypassSecurityTrustResourceUrl('/assets/social/gmail.svg'));
        reg.addSvgIcon('yahoo', s.bypassSecurityTrustResourceUrl('/assets/social/yahoo.svg'));
        reg.addSvgIcon('outlook', s.bypassSecurityTrustResourceUrl('/assets/social/outlook.svg'));

        reg.addSvgIcon('facebook-tiny', s.bypassSecurityTrustResourceUrl('/assets/social/footer/facebook-tiny.svg'));
        reg.addSvgIcon('instagram-tiny', s.bypassSecurityTrustResourceUrl('/assets/social/footer/instagram-tiny.svg'));
        reg.addSvgIcon('pinterest-tiny', s.bypassSecurityTrustResourceUrl('/assets/social/footer/pinterest-tiny.svg'));
        reg.addSvgIcon('twitter-tiny', s.bypassSecurityTrustResourceUrl('/assets/social/footer/twitter-tiny.svg'));
        reg.addSvgIcon('youtube-tiny', s.bypassSecurityTrustResourceUrl('/assets/social/footer/youtube-tiny.svg'));

        reg.addSvgIcon('messenger-btn', s.bypassSecurityTrustResourceUrl('/assets/social/messenger-btn.svg'));
        reg.addSvgIcon('facebook-btn', s.bypassSecurityTrustResourceUrl('/assets/social/facebook-btn.svg'));

        reg.addSvgIcon('location', s.bypassSecurityTrustResourceUrl('/assets/location.svg'));

        reg.addSvgIcon('google-login', s.bypassSecurityTrustResourceUrl('/assets/google.svg'));
        reg.addSvgIcon('facebook-login', s.bypassSecurityTrustResourceUrl('/assets/facebook.svg'));
        reg.addSvgIcon('tumblr-login', s.bypassSecurityTrustResourceUrl('/assets/tumblr.svg'));
        reg.addSvgIcon('twitter-login', s.bypassSecurityTrustResourceUrl('/assets/twitter.svg'));

        // Tutor cards
        reg.addSvgIcon('tutor-card-price', s.bypassSecurityTrustResourceUrl('/assets/search/tutor-card/price.svg'));
        reg.addSvgIcon('tutor-card-clock', s.bypassSecurityTrustResourceUrl('/assets/search/tutor-card/clock.svg'));
        reg.addSvgIcon('tutor-card-map-pin', s.bypassSecurityTrustResourceUrl('/assets/search/tutor-card/map-pin.svg'));
        reg.addSvgIcon('tutor-card-map-pin-gray', s.bypassSecurityTrustResourceUrl('/assets/search/tutor-card/map-pin-gray.svg'));
        reg.addSvgIcon('tutor-card-star', s.bypassSecurityTrustResourceUrl('/assets/search/tutor-card/star.svg'));
        reg.addSvgIcon('tutor-card-star-gray', s.bypassSecurityTrustResourceUrl('/assets/search/tutor-card/star-gray.svg'));
        reg.addSvgIcon('tutor-card-envelope', s.bypassSecurityTrustResourceUrl('/assets/search/tutor-card/envelope.svg'));
        reg.addSvgIcon('tutor-card-check', s.bypassSecurityTrustResourceUrl('/assets/search/tutor-card/check.svg'));
        reg.addSvgIcon('tutor-card-plus', s.bypassSecurityTrustResourceUrl('/assets/search/tutor-card/plus.svg'));
        reg.addSvgIcon('favorite', s.bypassSecurityTrustResourceUrl('/assets/search/tutor-card/favorite.svg'));
        reg.addSvgIcon('favorite_outline', s.bypassSecurityTrustResourceUrl('/assets/search/tutor-card/favorite-outline.svg'));
    }
}
