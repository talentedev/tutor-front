export interface LibraryFile {
    _id: string;
    name: string;
    created_at: string;
    mime: string;
    uploaded_by: {
        first_name: string;
        last_name: string;
    };
    url: string;
    category: string;
}
