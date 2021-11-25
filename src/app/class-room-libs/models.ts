export type MediaType = 'audio' | 'video' | 'screen';

export interface DataEvent {
    action: string;
    type: string;
}

export interface PeerMetaData {
    type: MediaType;
    name?: string;  // user's name
    source?: string;  // peer id
}
