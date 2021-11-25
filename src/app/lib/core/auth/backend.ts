import { Message, Thread } from '../../../messenger-libs/core/models';
import { HttpClient, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable, InjectionToken } from '@angular/core';
import { MessageInterface } from 'app/messenger-libs/core/models';
import {
    Availability,
    Coordinate,
    CreditCard,
    Notification,
    Review,
    Subject,
    Transaction,
    University,
    Upload,
    User,
    UserInfo,
    UserLocation,
} from 'app/models';
import { InstantSession, Lesson, LessonNote } from 'app/models/lesson';
import { ReferralLink } from 'app/pages/referrals-page/exports';
import { ObjectRef } from 'app/white-board/core/session';
import { utcToZonedTime } from 'date-fns-tz';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Availability2, Blackout } from '../../calendar/services/models';
import { toQueryString } from '../utils';
import { Token } from './common';

export const BACKEND_HOST = new InjectionToken('BACKEND_HOST');

export class BackendEvent {
    public static get TOKEN_EXPIRED(): number {
        return 0;
    }

    constructor(public type: number, public request: Request, public response: Response) {
    }
}

interface ResponseError {
    message: string;
    code: number;
}

const createType = (t: any) => (v: any) => new t(v);

const mapType = (t: any) => (o: Observable<any>) => {
    return o.map(createType(t))
};

const mapTypeArray = (t: any) => (o: Observable<any>) => {
    return o.map((a: any[]) => a.map(createType(t)))
};

@Injectable({providedIn: "root"})
export class Backend extends HttpClient {

    constructor(handler: HttpHandler) {
        super(handler);
    }

    getSessionsMetric(): Observable<any> {
        return this.get('@api/metrics/sessions');
    }

    getInstantSessionsMetric(): Observable<any> {
        return this.get('@api/metrics/instant');
    }

    getHourlySessionsMetric(): Observable<any> {
        return this.get('@api/metrics/sessions-hourly');
    }

    getHourlyInstantSessionsMetric(): Observable<any> {
        return this.get('@api/metrics/instant-hourly');
    }

    uploadToLibrary(data: FormData): Observable<any> {
        return this.post('@api/me/library', data);
    }

    getFileLibrary(): Observable<any> {
        return this.get('@api/me/library');
    }

    saveAttachmentToLibrary(id: string): Observable<any> {
        return this.put(`@api/me/library/${id}`, null);
    }

    deleteLibraryFile(id: string): Observable<any> {
        return this.delete(`@api/me/library/${id}`);
    }

    addSubjects(subjects: string[]): Observable<any> {
        return this.post('@api/subjects', {subjects});
    }

    addUserNote(userId: string, data: {note: string, type?: string}) {
        return this.post(`@api/users/id/${userId}/note`, data)
    }

    /**
     * Update payout for current user
     */
    updatePayout(data: any) {
        return this.put('@api/me/payout', data)
    }

    updatePreferences(data: any) {
        return this.put('@api/me/preferences', data)
    }

    approveTutor(tutor: string) {
        return this.put(`@api/users/${tutor}/approve`, null)
    }

    rejectTutor(tutor: string, reason: string) {
        return this.put(`@api/users/${tutor}/reject`, {reason});
    }

    requestTutorVerification(tutor: string) {
        return this.put(`@api/verify-account/request/${tutor}`, null)
    }

    /**
     * Admin verify tutor's subject or degree
     * @param tutor Tutor id
     * @param resource subject or degree
     * @param id resource id
     */
    verifyTutorResource(tutor: string, resource: string, id: string) {
        return this.put(`@api/users/${tutor}/verify`, { type: resource, id })
    }

    deleteCurrentAccount() { return this.delete('@api/me'); }

    updateCurrentUser(data: any): Observable<User> {
        return this.put('@api/me', data).pipe(mapType(User))
    }

    resendActivationEmail(data: any, token: string): Observable<ResendEmailResponse> {
        return this.post<ResendEmailResponse>('@api/users/resend-activation-email', data, {params: {access_token: token}})
    }

    updateCurrentUserPassword(data: any) {
        return this.put('@api/me/password', data)
    }

    setInstantSessionState(state: boolean) {
        return this.put('@api/me/instant', {session: state})
    }

    setInstantBookingState(state: boolean) {
        return this.put('@api/me/instant', {booking: state})
    }

    getInstantSession(id: string): Observable<InstantSession> {
        return this.get(`@api/instant_lesson/id/${id}`).pipe(map(
            (response: any) => {
                return new InstantSession(response.lesson)
            }
        ))
    }

    requestInstantSession(student: any, tutor: any, subject: any) {
        return this.post(`@api/lessons/instant/instant`, {student,tutor,subject})
    }

    acceptInstantSession() {
        return this.post(`@api/lessons/instant/instant`, null)
    }

    declineInstantSession() {
        return this.delete(`@api/lessons/instant/instant`)
    }

    createCreditCard(data: any): Observable<any> {
        return this.post('@api/me/cards', data)
    }

    deleteCreditCard(id: string) {
       return this.delete(`@api/payments/cards/${id}`)
    }

    setDefaultCreditCard(id: string): Observable<any> {
        return this.put<CreditCard>(`@api/payments/default/${id}`, null)
    }

    createLesson(data: any): Observable<Lesson> {
        return this.post('@api/lessons', data).pipe(mapType(Lesson))
    }

    createLessonNote(lesson: string, note: string): Observable<any> {
        return this.post(`@api/lessons/${lesson}/notes`, {note})
    }

    saveCurrentUserSubjects(data: any): Observable<any> {
        return this.post('@api/me/subjects', data)
    }

    updateCurrentUserSubject(data: any): Observable<any> {
        return this.put('@api/me/subjects', data)
    }

    saveCurrentUserDegrees(data: any): Observable<any> {
        return this.post('@api/me/degrees', data)
    }

    saveCurrentUserTelephone(data: any): Observable<any> {
        return this.post('@api/me/telephone', data)
    }
    
    addFavorite(tutor: any): Observable<any> {
        return this.post('@api/me/add-favorite', { tutor })
    }

    removeFavorite(id: string) {
        return this.delete(`@api/me/remove-favorite/${id}`)
    }

    cancelLesson(lesson: string, reason: string): Observable<any> {
        return this.post(`@api/lessons/${lesson}/cancel`, { reason })
    }

    cancelRecurrentLesson(lesson: string, reason: string): Observable<any> {
        return this.post(`@api/lessons/${lesson}/cancel?all=true`, { reason })
    }

    proposeLessonChange(lesson: string, changes: any): Observable<Lesson> {
        return this.post(`@api/lessons/${lesson}/propose`, changes).pipe(mapType(Lesson));
    }

    acceptLessonChange(lesson: string): Observable<any> {
        return this.post(`@api/lessons/${lesson}/propose/accept`, {})
    }

    declineLessonChange(lesson: string): Observable<any> {
        return this.post(`@api/lessons/${lesson}/propose/decline`, {})
    }

    removeCurrentUserSubject(id: string) {
        return this.delete(`@api/me/subjects/${id}`)
    }

    removeCurrentUserDegree(id: string) {
        return this.delete(`@api/me/degrees/${id}`)
    }

    setLessonRecurrent(lesson: string, recurrent: boolean) {
        return this.post(`@api/lessons/${lesson}/recurrent`, {recurrent: recurrent ? 1 : -1})
    }

    getGeocodeByAddress(address: string): Observable<UserLocation[]> {
        return this.get('@api/geocode?address=' + encodeURIComponent(address)).pipe(mapTypeArray(UserLocation))
    }

    getGeocodeByIp(): Observable<Coordinate> {
        return this.get('@api/geocode/ip').pipe(mapType(Coordinate))
    }

    updateGeocodeLocation(lat: number, lon: number, payload: UserLocation): Observable<any> {
        const params = { field: 'coordinates', lat: lat.toString(), lng: lon.toString() };
        return this.post(`@api/geocode/location/update?${toQueryString(params)}`, payload)
    }

    search(filters: any): Observable<SearchResult> {
        return this.get('@api/search', { params: filters }).pipe(
            map((response: SearchResult) => {
                response.tutors = response.tutors.map(u => new User(u))
                return response
            })
        )
    }

    getRefer(page = 1, limit = 1, type = 3): Observable<ReferResponse> {
        return this.get<ReferResponse>(`@api/me/refer`, {params: {page: page.toString(), limit: limit.toString(), type: type.toString()}})
    }

    getCalendarLink(): Observable<WebcalResponse> {
        return this.get<WebcalResponse>("@api/me/ics")
    }

    referInvite(emails: ReferEmails): Observable<ReferInviteResult> {
        return this.post<ReferInviteResult>('@api/refer/invite', emails);
    }

    referCheck(emails: ReferEmails) {
        return this.post<any>('@api/refer/check', emails);
    }

    getContactsImportURL(service: string): Observable<string> {

        if (['gmail', 'outlook', 'yahoo'].indexOf(service) === -1) {
            throw new Error('Invalid service specified:' + service)
        }

        return this.get(`@api/import/${service}/link`, { responseType:'text' })
    }

    getUser(id: string): Observable<User> {
        return this.get('@api/users/id/' + id).pipe(mapType(User))
    }

    upload(data: FormData): Observable<Upload> {
        return this.post('@api/uploads', data).pipe(mapType(Upload))
    }

    getUpload(id: string): Observable<Upload> {
        return this.get(`@api/uploads?id=${id}`).pipe(mapType(Upload));
    }

    setAvatar(upload: Upload): Observable<any> {
        return this.put('@api/me/avatar', upload);
    }

    getPlatformUISettings(): Observable<any> {
        return this.get('@api/platform/settings/ui')
    }

    getPlatformSettings(): Observable<any> {
        return this.get('@api/platform/settings')
    }

    setPlatformSettings(settings: any) {
        return this.put('@api/platform/settings', settings)
    }

    setFooterLinks(data: any) {
        return this.put('@api/platform/footer-links', data)
    }

    getPlatformStats(): Observable<any> {
        return this.get('@api/platform/stats')
    }

    proxyUserInfo(network, token: string): Observable<UserInfo> {
        return this.get(`@api/oidc/${network}`, {params: {access_token: token}}).pipe(mapType(UserInfo))
    }

    verifyAccount(data: any, token: string) {
        return this.post('@api/verify-account', data, {params: {access_token: token}})
    }

    createReview(tutor: string, data: any): Observable<any> {
        return this.post(`@api/reviews/${tutor}`, data);
    }

    getReviews(id: string, limit: number, offset: number): Observable<ReviewsResponse> {
        const params = { params: { limit: limit.toString(), offset: offset.toString() } };
        return this.get<ReviewsResponse>(`@api/reviews/${id}`, params).pipe(
            map(item => {
                item.reviews = item.reviews.map((raw: any)=> new Review(raw));
                return item
            })
        )
    }

    getSubmittedReviews(user: string) {
        return this.get(`@api/reviews/${user}/mine`)
    }

    getSubjects(name: string = '', limit: number = 1000): Observable<Subject[]> {
        return this.get('@api/subjects', {params: {name, limit: limit.toString()}}).pipe(mapTypeArray(Subject))
    }

    getSubject(id: string = '', limit = -1): Observable<Subject> {
        const options = {params: {name, limit: limit.toString()}}
        return this.get('@api/subjects', options).pipe(mapType(Subject))
    }

    createUserPassword(password: string, access_token: string): Observable<Token> {
        return this.post<Token>('@api/users/create-password', {password}, {params: {access_token}})
    }

    changePassword(newPass: string, newPassConfirm: string, token?: string) {

        const params = {};
        const payload = {new: newPass, confirm: newPassConfirm};

        if (token) {
            params['access_token'] = token;
            payload['token'] = token;
        }

        return this.put<Response>('@api/me/password', payload, {
            params: params,
        });
    }

    recoverPassword(email: string) {
        return this.post('@api/auth/recover', {email});
    }

    updateMe(data: any): Observable<any> {
        return this.put('@api/me', data)
    }

    getLessons(from: moment.Moment, to: moment.Moment, otherParticipant: string, state: string = 'all', offset = 0, limit?: number): Observable<{lessons: Lesson[], length: number}> {
        const params: {[k: string]: string} = {
            from: from.toISOString(),
            to: to.toISOString(),
            state,
        };
        if (otherParticipant) {
            params.with = otherParticipant;
        }
        if (Number.isInteger(offset)) {
            params.offset = offset.toString();
        }
        if (Number.isInteger(limit)) { 
            params.limit = limit.toString();
        }
        return this.get(`@api/lessons`, {params}).pipe(map(
            (data: {lessons: {[k: string]: any}[], length: number}) => {
                return {
                    length: data.length,
                    lessons: data.lessons.map((raw: {[k: string]: any}) => new Lesson(raw))
                }
            }
        ))
    }

    getLesson(id: string, user: User): Observable<Lesson> {
        return this.get(`@api/lessons/${id}`).pipe(map((data: any) => (
            new Lesson({...data, zone: user.timezone})
        )));
    }

    getLessonNotes(id: string): Observable<LessonNote[]> {
        return this.get(`@api/lessons/${id}/notes`).pipe(mapTypeArray(LessonNote))
    }

    getCurrentUserLessons(from: moment.Moment | string, to: moment.Moment | string, sort: number): Observable<{error:boolean, message: any, data: Lesson[]}> {
        const params = {
            from: moment.isMoment(from) ? from.format() : from,
            to: moment.isMoment(to) ? to.format() : to,
            sort_type: sort ? sort.toString() : undefined,
        }

        return this.get(`@api/lessons?${toQueryString(params)}`).pipe(map(
            (response: any) => {
                return response.lessons.map((r: any) => new Lesson(r));
            }
        ))
    }

    getUserLessons(user: string): Observable<Lesson[]> {
        return this.get('@api/users/id/' + user + '/lessons').pipe(mapTypeArray(Lesson))
    }

    getTransactionsPaged(from: string, to: string, page?: number, limit?: number): Observable<{count:number; transactions: Transaction[]}> {
        const url = '@api/me/transactions';
        const params = { from, to, limit: limit || 100, page: page || 1 };
        return this.get(`${url}?${toQueryString(params)}`).pipe(map((data: any) => {
            if (!(data.transactions && data.count)) {
                return { transactions: [], count: 0 }
            }
            return { transactions: data.transactions.map(t => new Transaction(t)), count: data.count}
        }));
    }

    getTransactions(from: moment.Moment = null, to: moment.Moment = null): Observable<Transaction[]> {
        const url = '@api/me/transactions';
        if (from && to) {
            const params = {
                from: from.utc().format(),
                to: to.utc().format()
            };
            return this.get(`${url}?${toQueryString(params)}`).pipe(mapTypeArray(Transaction));
        }
        return this.get(url).pipe(mapTypeArray(Transaction));
    }

    setAvailabilityRecurrence(id: string, recurrent: boolean) {

        if (id === "") {
            throw new Error("Invalid availability id")
        }

        return this.put(`@api/me/availability/${id}`, { recurrent })
    }

    getUserAvailability(user: User,
                        from: moment.Moment | string,
                        to: moment.Moment | string,
                        timezone: string,
                        recurrent?: boolean): Observable<Availability> {

        if (!user) {
            throw new Error(`User is not defined`);
        }

        const qs = toQueryString({
            from: moment.isMoment(from) ? from.format() : from,
            to: moment.isMoment(to) ? to.format() : to,
            recurrent: recurrent || false
        });
        return this.get(`@api/users/id/${user._id}/availability?${qs}`).pipe(
            map((raw: any) => {

                if (raw) {
                    return new Availability(raw, timezone)
                }

                return null;
            })
        )
    }

    getUserAvailability2(user: User, from: string, to: string, recurrent?: boolean): Observable<Availability2[]> {

        if (!user) {
            throw new Error(`User is not defined`);
        }

        const qs = toQueryString({
            from: moment.isMoment(from) ? from.format() : from,
            to: moment.isMoment(to) ? to.format() : to,
            recurrent: recurrent || false
        });
        return this.get(`@api/users/id/${user._id}/availability?${qs}`).pipe(
            map((raw: any) => {
                return raw.map(data => new Availability2(
                    data.id,
                    utcToZonedTime(new Date(data.from), user.timezone),
                    utcToZonedTime(new Date(data.to), user.timezone),
                    data.occurence
                ));
            })
        );
    }

    createCurrentUserAvailability(data: any) {
        return this.post('@api/me/availability', data);
    }

    updateCurrentUserAvailability(id: string, data) {
        return this.put(`@api/me/availability/${id}`, data);
    }

    deleteCurrentUserAvailability(id: string) {
        return this.delete(`@api/me/availability/${id}`);
    }

    deleteNotification(id: string) {
        return this.delete(`@api/notifications/${id}`);
    }

    deleteAllNotifications() {
        return this.delete('@api/notifications');
    }

    getCalendarLessons(from: moment.Moment, to: moment.Moment): Observable<Lesson[]> {
        return this.get(`@api/me/calendar-lessons?${toQueryString({
          from: from.format(),
          to: to.format(),
        })}`).pipe(mapTypeArray(Lesson));
    }

    getCalendarLessons2(from: string) {
        const qs = toQueryString({ from });
        return this.get(`@api/me/calendar-lessons/dates?${qs}`);
    }

    getUniversities(name?: string): Observable<University[]> {
        return this.get('@api/universities', {params:{ name }}).pipe(mapTypeArray(University))
    }

    registerTutor(data: any): Observable<User> {
        return this.post('@api/register/tutor', data).pipe(mapType(User))
    }

    registerStudent(data: any): Observable<any> {
        return this.post('@api/register/student', data)
    }

    registerAffiliate(data: any) {
        return this.post('@api/register/affiliate', data)
    }

    getBalance(): Observable<number> {
        return this.get('@api/payments/balance').pipe(map((r:any) => r.balance))
    }

    isAvailable(tutor: User, from: string, to: string): Observable<boolean> {
        const queryString = toQueryString({ from, to });
        const endpoint = `@api/users/id/${tutor._id}/availability/available?${queryString}`
        return this.get(endpoint).pipe(map((data: {available: boolean}) => data.available));
    }

    getUnverifiedTutors(): Observable<User[]> {
        return this.get('@api/users/tutors/unverified').pipe(mapTypeArray(User))
    }

    getPendingTutors(): Observable<User[]> {
        return this.get('@api/users/tutors/pending').pipe(mapTypeArray(User))
    }

    auth(username: string, password: string, remember = true): Observable<Token> {
        return new Observable(sub => {
            this.post('@api/auth', {username, password, remember}).subscribe(
                (data: any) => {

                    if (data.access_token) {
                        sub.next(data)
                    } else {
                        sub.next(null);
                    }

                    sub.complete();
                },
                (err) => {
                    sub.error(err)
                    sub.complete()
                }
            )
        })
    }

    googleAuth(code: string, remember = true): Observable<Token> {
        return new Observable(sub => {
            this.post('@api/auth/google', {code, remember}).subscribe(
                (data: any) => {
                    if (data.access_token) {
                        sub.next(data)
                    } else {
                        sub.next(null);
                    }

                    sub.complete();
                },
                (err) => {
                    sub.error(err)
                    sub.complete()
                }
            )
        })
    }


    getNotifications(offset = 0, limit = 10): Observable<PaginatedItems<Notification>> {
        const params = { offset: offset.toString(), limit: limit.toString() };
        return this.get(`@api/notifications`, {params}).pipe(map(
            (response: any) => {
                if (response.items) {
                    response.items = response.items.map((i: any) => new Notification(i))
                }
                return response
            }
        ))
    }

    getVcrWhiteboard(room: string): VCRWhiteboardBackend {
        return new VCRWhiteboardBackend(room, this)
    }

    getVcrCodeBackend(room: string): VCRCodeBackend {
        return new VCRCodeBackend(room, this)
    }

    getVcrTextBackend(room: string): VCRTextBackend {
        return new VCRTextBackend(room, this)
    }

    getMessengerBackend(): MessengerBackend {
        return new MessengerBackend(this);
    }

    createBlackoutWindow(from: string, to: string) {
        return this.post('@api/me/blackout', {from, to});
    }

    deleteBlackoutWindow(id: string) {
        return this.delete(`@api/me/blackout/${id}`);
    }

    getBlackoutList(userId: string, from: string, to: string): Observable<Blackout[]>{
        return this.get(`@api/users/id/${userId}/blackout?${toQueryString({from, to})}`) as Observable<Blackout[]>;
    }

    getSurveyData(): Observable<any> {
        return this.get(`@api/surveys/end-of-session`);
    }

    ensureConnect(payload): Observable<any> {
        return this.post('@api/payments/ensureconnect', payload);
    }

    tagNewApplication(payload): Observable<any> {
        return this.post('@api/intercom/new-application', payload);
    }

    verifyEmailNotTaken(email: string) {
        return this.post('@api/register/verifyEmail', {email});
    }

    setMsgStatus(msgstatus: string): Observable<any> {
        return this.put(`@api/messenger/msg/${msgstatus}`, null);
    }

    getMsgStatus(){
        return this.get('@api/messenger/msgstatus');
    }
}

export class VCRCodeBackend {
    constructor(private room: string, private backend: Backend) {}

    getContents(): Observable<any> {
        return this.backend.get(`@api/vcr/${this.room}/code`);
    }
}

export class VCRTextBackend {
    constructor(private room: string, private backend: Backend) {}

    getContents(): Observable<any> {
        return this.backend.request(new HttpRequest("GET", `@api/vcr/${this.room}/text`, {responseType: 'text'})).pipe(map((r:HttpResponse<string>) => r.body));
    }
}

export class VCRWhiteboardBackend {

    constructor(private room: string, private backend: Backend) {}

    addObject(session: string, object: ObjectRef) {
        return this.backend.post(`@api/vcr/${this.room}/whiteboard/${session}`, object.toJSON(['id']))
    }

    getObject(session: string, object: string) {
        return this.backend.get<any>(`@api/vcr/${this.room}/whiteboard/${session}/${object}`)
    }

    modifyObject(session: string, object: string, src: ObjectRef) {
        return this.backend.put(`@api/vcr/${this.room}/whiteboard/${session}/${object}`, src.toJSON(['id']))
    }

    removeObject(session: string, object: string) {
        return this.backend.delete(`@api/vcr/${this.room}/whiteboard/${session}/${object}`)
    }

    getObjects() {
        return this.backend.get(`@api/vcr/${this.room}/whiteboard-sessions`)
    }
}
export class MessengerBackend {

    constructor(private backend: Backend) {}

    public getThreads(): Observable<any[]> {
        return new Observable(subscriber => {
            return this.backend.get('@api/messenger/threads').subscribe((response: any) => {
                subscriber.next(response);
                subscriber.complete();
            }, err => subscriber.error(err));
        });
    }

    public getNewMessageCount(): Promise<number> {
        return new Promise(done => {
            this.backend.get('@api/messenger/count',  {responseType: 'text'}).map(r => parseInt(r, 10)).subscribe(done);
        });
    }

    public createThread(message: MessageInterface, tutor: User): Observable<any> {
        return new Observable(subscriber => {
            const body = {
                message: message,
                tutor: tutor._id,
            };

            this.backend.post('@api/messenger/threads', body).subscribe((response:any) => {
                subscriber.next(response);
                subscriber.complete();
            }, err => subscriber.error(err));
        });
    }

    public getThread(id: string, me: any): Observable<Thread> {
        return new Observable(subscriber => {
            this.backend.get('@api/messenger/threads/' + id).subscribe((response: any) => {
                subscriber.next(new Thread(response, me));
            }, err => subscriber.error(err));
        });
    }

    public getThreadMessages(thread: Thread, skip: number, limit = 15): Observable<any> {

        return new Observable(subscriber => {
            return this.backend.get(`@api/messenger/threads/${thread._id}/messages`, { params: { skip: skip.toString(), limit: limit.toString() } }).subscribe(
                (response: any) => {

                    if (!response || !response.messages) {
                        subscriber.next({
                            items: [],
                            total: 0,
                        })
                        return subscriber.complete();
                    }

                    subscriber.next({
                        items: response.messages.map((m: any) => new Message(m)).reverse(),
                        total: response.total
                    });
                },
                (err) => {
                    subscriber.error(err);
                }
            );
        });
    }

    public send(thread: Thread, message: MessageInterface): Observable<Message> {

        if (!thread) {
            throw new Error('Thread is empty!');
        }

        const payload = {
            message,
            thread: thread._id,
        };

        return new Observable(subscriber => {
            return this.backend.post('@api/messenger/messages', payload).subscribe((response: any) => {
                const msg = new Message(response);
                thread.message = msg;
                thread.message_time = msg.time;

                subscriber.next(msg);
                subscriber.complete();
            }, err => subscriber.error(err));
        });
    }

    public upload(thread: Thread, file: File): Observable<Message> {
        return new Observable(sub => {
            const data = new FormData();
            data.append('file', file);
            data.append('context', 'messenger');
            this.backend.post('@api/messenger/upload', data).pipe(mapType(Upload)).subscribe((upload: Upload) => {
                this.send(thread, {body: upload._id, type: 'file'}).subscribe((response: any) => {
                    sub.next(response);
                    sub.complete();
                }, err => sub.error(err));
            });
        });
    }

    public markAsRead(messages: string[]) {
        return this.backend.post('@api/messenger/mark', messages);
    }
}

export type PaginatedItems<T> = {
    items: T[]
    length: number
}

export type ReviewsResponse = {
    total: number;
    average: number;
    reviews: Review[];
}

export type ReferEmails = {
    users: { email: string }[];
}

export type ReferInviteResult = {
    invited: {email: string, name: string, force: boolean}[];
    errors: {email: string, error: string, message: string}[];
}

export type ReferResponse = {
    refer: any;
    affiliate: { quota: number };
    referral_code: string;
    links: {
        total: number;
        data: ReferralLink[];
    }
}

export type WebcalResponse = {
    token: string;
}

export type SearchResult = {
    message: string;
    tried_online: boolean;
    tutors: User[]
}

export type ResendEmailResponse = {
    email_sent: boolean;
    error: boolean;
    message: string;
}
