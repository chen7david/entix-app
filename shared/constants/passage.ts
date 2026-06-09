/** Shared passage/collection enums — safe for web and API (no Drizzle imports). */

export const PASSAGE_TYPES = ["reading", "instructional", "essay", "dialogue", "poem"] as const;
export type PassageType = (typeof PASSAGE_TYPES)[number];

export const IMAGE_POSITIONS = ["top", "bottom", "left", "right", "inline"] as const;
export type ImagePosition = (typeof IMAGE_POSITIONS)[number];

export const TEXT_COLLECTION_TYPES = ["book", "reader", "article", "curriculum"] as const;
export type TextCollectionType = (typeof TEXT_COLLECTION_TYPES)[number];
