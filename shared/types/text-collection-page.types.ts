export type PassageBlock = {
    id: string;
    content: string;
};

export type CollectionPage = {
    collectionId: string;
    pageNumber: number;
    passages: PassageBlock[];
};

/** R2 object shape for a single passage body stored outside D1. */
export type PassageR2Content = {
    content: string;
};
