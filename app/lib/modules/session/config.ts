import { days, toMs } from "~/lib/utils/duration";

export const SESSION_MAX_AGE_SECONDS = days(14);
export const SESSION_MAX_AGE_MILLISECONDS = toMs(SESSION_MAX_AGE_SECONDS);

export const SESSION_RENEWAL_THRESHOLD_IN_DAYS = 3;
