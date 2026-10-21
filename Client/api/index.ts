/**
 * Frontend API client modules.
 *
 * All business logic, database queries, and role authorization reside on the Server (Express/MongoDB).
 * This layer handles client-side HTTP communication with the /api/v1 endpoints.
 */

export * from "./auth.api";
export * from "./bookings.api";
export * from "./games.api";
export * from "./membership-plans.api";
export * from "./payments.api";
export * from "./subscriptions.api";
export * from "./users.api";
