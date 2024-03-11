/*
 * Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */
import type { Sapbetac4UjobschedulerScheduleResponseCreate } from './sapbetac-4-ujobscheduler-schedule-response-create';
/**
 * Representation of the 'JobSchedulerServiceJobCreate' schema.
 */
export type JobSchedulerServiceJobCreate =
  | {
      /**
       * ID of the job to be updated.
       * Format: "int32".
       */
      jobId: number;
      /**
       * Name of the job. Name must not contain special characters or only numbers. The job creation request fails if a job with the same name already exists for the technical user.
       */
      name?: string;
      /**
       * Provides more details about a job.
       */
      description?: string;
      /**
       * The fully qualified URL endpoint to be called when the job runs.
       */
      action?: string;
      /**
       * Activation status of the job (default value is false).
       */
      active?: boolean;
      /**
       * The HTTP method to be used to call the job action endpoint URL. The allowed values are `GET`, `POST`, `PUT`, and `DELETE`.
       */
      httpMethod?: string;
      /**
       * The type of job that is being run.
       */
      jobType?: string;
      /**
       * Contains one or more job schedules to be created.
       */
      schedules?: Sapbetac4UjobschedulerScheduleResponseCreate[];
    }
  | Record<string, any>;
