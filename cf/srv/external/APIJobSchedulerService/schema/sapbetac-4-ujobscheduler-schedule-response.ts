/*
 * Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */
import type { Sapbetac4UjobschedulerDateFormat } from './sapbetac-4-ujobscheduler-date-format';
/**
 * Representation of the 'Sapbetac4UjobschedulerScheduleResponse' schema.
 */
export type Sapbetac4UjobschedulerScheduleResponse =
  | {
      /**
       * Crontab pattern for triggering the schedule.  For more information, refer to [Schedule Formats](https://help.sap.com/viewer/07b57c2f4b944bcd8470d024723a1631/Cloud/en-US/54615f087cca45c48f81ce4967c6f7f3.html).
       */
      cron?: string;
      /**
       * Provides more details about a schedule.
       */
      description?: string;
      /**
       * Activation status of the job schedule. The allowed values are true or false.
       */
      active?: boolean;
      /**
       * The format and the starting date and time for the job schedule.
       */
      startTime?: Sapbetac4UjobschedulerDateFormat;
      /**
       * The format and the ending date and time for the job schedule.
       */
      endTime?: Sapbetac4UjobschedulerDateFormat;
      /**
       * For one-time schedules, this denotes the task execution time. You can use human-readable text to denote a specific time. Example: 3.30pm, tomorrow at 2am. For information about human readable dates and the supported readable strings, refer to [Schedule Format](https://help.sap.com/viewer/07b57c2f4b944bcd8470d024723a1631/Cloud/en-US/54615f087cca45c48f81ce4967c6f7f3.html). If an object is used, you must specify the date and time formats as strings. For information about the supported formats, refer to [Schedule Format](https://help.sap.com/viewer/07b57c2f4b944bcd8470d024723a1631/Cloud/en-US/54615f087cca45c48f81ce4967c6f7f3.html).
       */
      time?: Sapbetac4UjobschedulerDateFormat;
      /**
       * Data value is passed to the job action endpoint when invoked by the Job Scheduler. For the HTTP method `POST`, the data parameters are sent in the request body while invoking the endpoint. For the HTTP method `GET` or `DELETE`, the data parameters are sent as query strings.
       */
      data?: string;
      /**
       * The date and time at which the next job is scheduled to run.
       */
      nextRunAt?: string;
      /**
       * The type of the job that is being run.
       */
      type?: string;
    }
  | Record<string, any>;
