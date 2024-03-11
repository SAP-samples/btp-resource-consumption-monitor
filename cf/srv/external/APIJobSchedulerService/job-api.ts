/*
 * Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */
import { OpenApiRequestBuilder } from '@sap-cloud-sdk/openapi';
import type {
  Count,
  JobSchedulerServiceJob,
  JobSchedulerServiceJobCreate
} from './schema';
/**
 * Representation of the 'JobApi'.
 * This API is part of the 'JobSchedulerService' service.
 */
export const JobApi = {
  /**
   * Retrieves the saved configurations of all scheduled jobs, including the name, description, action, and other details.
   * @param queryParameters - Object containing the following keys: $top, $skip, $search, $filter, $count, $orderby, $select.
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  getJobs: (queryParameters?: {
    $top?: number;
    $skip?: number;
    $search?: string;
    $filter?: string;
    $count?: boolean;
    $orderby?: Set<
      | 'jobId'
      | 'jobId desc'
      | 'name'
      | 'name desc'
      | 'description'
      | 'description desc'
      | 'action'
      | 'action desc'
      | 'active'
      | 'active desc'
      | 'httpMethod'
      | 'httpMethod desc'
      | 'jobType'
      | 'jobType desc'
      | 'tenantId'
      | 'tenantId desc'
      | 'subDomain'
      | 'subDomain desc'
      | 'createdAt'
      | 'createdAt desc'
      | 'ACTIVECOUNT'
      | 'ACTIVECOUNT desc'
      | 'INACTIVECOUNT'
      | 'INACTIVECOUNT desc'
      | 'schedules/cron'
      | 'schedules/cron desc'
      | 'schedules/description'
      | 'schedules/description desc'
      | 'schedules/active'
      | 'schedules/active desc'
      | 'schedules/startTime/date'
      | 'schedules/startTime/date desc'
      | 'schedules/startTime/format'
      | 'schedules/startTime/format desc'
      | 'schedules/endTime/date'
      | 'schedules/endTime/date desc'
      | 'schedules/endTime/format'
      | 'schedules/endTime/format desc'
      | 'schedules/time/date'
      | 'schedules/time/date desc'
      | 'schedules/time/format'
      | 'schedules/time/format desc'
      | 'schedules/data'
      | 'schedules/data desc'
      | 'schedules/nextRunAt'
      | 'schedules/nextRunAt desc'
      | 'schedules/type'
      | 'schedules/type desc'
    >;
    $select?: Set<
      | 'jobId'
      | 'name'
      | 'description'
      | 'action'
      | 'active'
      | 'httpMethod'
      | 'jobType'
      | 'tenantId'
      | 'subDomain'
      | 'createdAt'
      | 'ACTIVECOUNT'
      | 'INACTIVECOUNT'
      | 'schedules'
    >;
  }) =>
    new OpenApiRequestBuilder<
      | {
          total?: Count;
          results?: JobSchedulerServiceJob[];
        }
      | Record<string, any>
    >('get', '/scheduler/jobs', {
      queryParameters
    }),
  /**
   * Creates a job by accepting one or more job schedules to be created using the job name, description, and other information.
   * @param body - New job
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  createJob: (body: JobSchedulerServiceJobCreate) =>
    new OpenApiRequestBuilder<JobSchedulerServiceJob>('post', '/scheduler/jobs', {
      body
    }),
  /**
   * Retrieves the saved configuration of a specific job, including the name, description, action, and other details.
   * @param jobId - ID of the job to be updated
   * @param queryParameters - Object containing the following keys: $select.
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  getJobJobId: (
    jobId: string,
    queryParameters?: {
      $select?: Set<
        | 'jobId'
        | 'name'
        | 'description'
        | 'action'
        | 'active'
        | 'httpMethod'
        | 'jobType'
        | 'tenantId'
        | 'subDomain'
        | 'createdAt'
        | 'ACTIVECOUNT'
        | 'INACTIVECOUNT'
        | 'schedules'
      >;
    }
  ) =>
    new OpenApiRequestBuilder<JobSchedulerServiceJob>('get', '/scheduler/jobs?jobId={jobId}', {
      pathParameters: { jobId },
      queryParameters
    }),
  /**
   * Deletes a specific job, deletes its runtime information such as schedules and logs, and terminates the processing of its active and inactive schedules.
   * @param jobId - ID of the job to be updated
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  deleteJobJobId: (jobId: string) =>
    new OpenApiRequestBuilder<any>('delete', '/scheduler/Job({jobId})', {
      pathParameters: { jobId }
    })
};
