import app from "./app";
import { routeQueue } from "./queues";
import { routeScheduled } from "./scheduled/scheduled.router";

export default {
    fetch: app.fetch,
    scheduled: routeScheduled,
    queue: routeQueue,
};
