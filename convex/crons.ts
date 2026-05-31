import { cronJobs } from "convex/server";

/**
 * Scheduled jobs for your deployment.
 *
 * @example
 * crons.interval("cleanup stale data", { hours: 24 }, internal.maintenance.cleanup);
 *
 * @see https://docs.convex.dev/scheduling/cron-jobs
 */
const crons = cronJobs();

// Starter template: add cron jobs when you have internal mutations to run on a schedule.
// crons.daily("example", { hourUTC: 3, minuteUTC: 0 }, internal.example.runDaily);

export default crons;
