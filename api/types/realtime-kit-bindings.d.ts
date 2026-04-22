declare namespace Cloudflare {
    interface Env {
        /** Set in dashboard / wrangler secret — token with Realtime/Realtime Admin */
        CLOUDFLARE_API_TOKEN?: string;
        /** Realtime Kit app id from Cloudflare dashboard */
        REALTIME_KIT_APP_ID?: string;
        /**
         * Preset names defined in the Realtime Kit app (e.g. host vs guest).
         * Optional; the service uses sensible fallbacks if omitted.
         */
        REALTIME_KIT_PRESET_ORGANIZER?: string;
        REALTIME_KIT_PRESET_PARTICIPANT?: string;
    }
}
