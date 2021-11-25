import { environment } from '../../environments/environment';


export interface FacebookShare {
    url: string;
    quote: string;
}

export class SocialSharing {
    private twitterURL = 'https://twitter.com/intent/tweet';
    private facebookURL = 'http://www.facebook.com/dialog/share';
    private messengerURL = 'http://www.facebook.com/dialog/send';

    /**
     * Returns the Twitter URL for sharing a text.
     * @param {string} text
     * @return {string}
     */
    public TwitterByText(text: string): string {
        const params: URLSearchParams = new URLSearchParams();
        params.set('text', text);
        return this.twitterURL + '?' + params.toString();
    }

     /**
     * Returns the Facebook URL for sharing on facebook.
     * @param {FacebookShare} shareData
     * @param {string} redirectURI
     * @return {string}
     */
    public FacebookByLink(shareData: FacebookShare, redirectURI?: string): string {
        const params: URLSearchParams = new URLSearchParams();
        params.set('app_id', environment.FacebookAppID);
        params.set('href', shareData.url);
        if (redirectURI !== null && redirectURI !== undefined) {
            params.set('redirect_uri', redirectURI);
        }
        params.set('quote', shareData.quote);
        return this.facebookURL + '?' + params.toString();
    }

    /**
     * Returns the Facebook URL for sharing a link on messenger.
     * @param {string} link
     * @param {string} redirectURI
     * @return {string}
     */
    public MessengerByLink(link: string, redirectURI?: string): string {
        const params: URLSearchParams = new URLSearchParams();
        params.set('app_id', environment.FacebookAppID);
        params.set('link', link);
        if (redirectURI !== null && redirectURI !== undefined) {
            params.set('redirect_uri', redirectURI);
        }
        return this.messengerURL + '?' + params.toString();
    }
}
