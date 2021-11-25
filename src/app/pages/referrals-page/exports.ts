export interface ReferralUser {
    email: string;
    firstname?: string;
    lastname?: string;
    avatar: string;
    amount: number;
    status: string;
    date: string;
    type: number;
    completed?: boolean;
}

export interface ReferralLink {
    referral: string;
    step: string;
    amount: number;
    completed: boolean;
}

export interface Person {
    email: string;
    name: string;
    avatar: string;
    check: boolean;
    force?: boolean;
}

export interface ImportContactProvider {
    Name: string;
    LinkURL: string;
    StateURL: string;
}

export const ImportContactsProviders: { [key: string]: ImportContactProvider } = {
    'gmail': {
        Name: 'Google',
        LinkURL: '/import/gmail/link',
        StateURL: '/import/gmail/state'
    },
    'outlook': {
        Name: 'Outlook',
        LinkURL: '/import/outlook/link',
        StateURL: '/import/outlook/state'
    },
    'yahoo': {
        Name: 'Yahoo',
        LinkURL: '/import/yahoo/link',
        StateURL: '/import/yahoo/state',
    }
};
