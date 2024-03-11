/*
 * Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */

/**
 * Representation of the 'SubaccountUsageResponseObject' schema.
 */
export type SubaccountUsageResponseObject =
  | {
      /**
       * The unique ID of the product category.
       * Format: "double".
       */
      categoryId?: number;
      /**
       * The name of the product category.
       */
      categoryName?: string;
      /**
       * The technical name of the landscape, (as identified by core services for SAP BTP), on which the usage was originally initialized. Example values: cf-us10-staging, cf-eu10-canary, cf-eu20.
       */
      dataCenter?: string;
      /**
       * The descriptive name of the data center.
       */
      dataCenterName?: string;
      /**
       * The unique ID of the directory.
       */
      directoryId?: string;
      /**
       * The descriptive name of the directory for customer-facing UIs.
       */
      directoryName?: string;
      /**
       * The unique ID of the consumer environment instance.
       */
      environmentInstanceId?: string;
      /**
       * The name of the consumer environment instance for customer-facing UIs.
       */
      environmentInstanceName?: string;
      /**
       * The unique ID of the global account to which the subaccounts belong, and which is the context for billing the customer.
       */
      globalAccountId?: string;
      /**
       * The descriptive name of the global account for customer-facing UIs.
       */
      globalAccountName?: string;
      /**
       * Consumer identity zone.
       */
      identityZone?: string;
      /**
       * Consumer instance ID.
       */
      instanceId?: string;
      /**
       * The original measure of the usage as reported by the technical usage API payload.
       */
      measureId?: string;
      /**
       * The name of the metric used by cloud services for customer-facing UIs.
       */
      metricName?: string;
      /**
       * The last day of the time division requested for the subaccount usage report.
       * Format: "int32".
       */
      periodEndDate?: number;
      /**
       * The first day of the time division requested for the subaccount usage report.
       * Format: "int32".
       */
      periodStartDate?: number;
      /**
       * The ID of the service plan to which the measured usage data is related.
       */
      plan?: string;
      /**
       * The name of the plan for customer-facing UIs.
       */
      planName?: string;
      /**
       * The ID of the service to which the measured usage data is related.
       */
      serviceId?: string;
      /**
       * The name of the service for customer-facing UIs.
       */
      serviceName?: string;
      /**
       * The ID of the consumer space.
       */
      spaceId?: string;
      /**
       * The descriptive name of the consumer space for customer-facing UIs.
       */
      spaceName?: string;
      /**
       * The unique ID of the subaccount for which to get the usage data.
       */
      subaccountId?: string;
      /**
       * The descriptive name of the subaccount for customer-facing UIs.
       */
      subaccountName?: string;
      /**
       * Predefined name for more than one unit of usage for the given metric. Generally a short name for use in customer-facing UIs.
       */
      unitPlural?: string;
      /**
       * Pre-defined name for one unit of usage.
       */
      unitSingular?: string;
      /**
       * The reported usage in numbers for the given metric.
       * Format: "double".
       */
      usage?: number;
      /**
       * The first day of the time division requested for the subaccount usage report. The start date is specified in the format YYYY-MM-DD, for example 2023-01-01.
       */
      startIsoDate?: string;
      /**
       * The last day of the time division requested for the subaccount usage report. The end date is specified in the format YYYY-MM-DD, for example 2023-12-01.
       */
      endIsoDate?: string;
      /**
       * The ID of the consumer application.
       */
      application?: string;
    }
  | Record<string, any>;
