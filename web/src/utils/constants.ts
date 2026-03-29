/**
 * Global UI constants for the Entix Application.
 *
 * Centralizing these values ensures uniform user experiences across different tables,
 * screens, and components while maintaining a single source of truth for design tweaks.
 */
export const UI_CONSTANTS = {
    /**
     * Standardized debouncing timings for reactive components (in milliseconds).
     */
    DEBOUNCE: {
        /**
         * The standard wait time before firing a backend network query from a heavy data table.
         * 500ms prevents excessive database/API hits (spamming) while the user is actively typing,
         * resulting in a solid, un-flickering UI.
         */
        SEARCH_TABLE: 350,

        /**
         * Intended for rapid autocomplete dropdowns or command palettes where
         * users expect near-instant feedback without heavy layout thrashing.
         */
        AUTOCOMPLETE: 250,
    },
} as const;
