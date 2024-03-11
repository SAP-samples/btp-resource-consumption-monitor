/*
 * Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */

/**
 * Used to uniquely identify a resource in the SAP Business Technology Platform for which this event was created. The user can filter these properties.
 *
 * **Note:** Properties such as globalAccount, subAccount and resourceGroup are filled automatically by Alert Notification.
 * @example {
 *   "resourceName": "x0f",
 *   "resourceType": "database",
 *   "tags": {
 *     "dbType": "HANA"
 *   }
 * }
 */
export type AffectedCustomerResource =
  | {
      /**
       * A unique resource name used to identify an application or a back-end service, such as a database. For example: application-name, database-alias
       * Pattern: ".*\\S.*".
       */
      resourceName: string;
      /**
       * Identifies the affected resource type. For example: application, database, dbms, service
       * Pattern: ".*\\S.*".
       */
      resourceType: string;
      /**
       * If the resource has multiple instances, the exact instance will be identified.
       */
      resourceInstance?: string;
      /**
       * Optional key-value pairs describing in details the resource. Can be used for filtering.
       */
      tags?: Record<string, string>;
    }
  | Record<string, any>;
