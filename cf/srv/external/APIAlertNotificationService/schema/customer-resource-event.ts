/*
 * Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */
import type { AffectedCustomerResource } from './affected-customer-resource';
/**
 * **Note:** Properties like region, globalAccount, subAccount and resourceGroup are filled automatically by Alert Notification.
 * @example {
 *   "eventType": "NotWorkingExternalRecommendationService",
 *   "eventTimestamp": 1535618178,
 *   "resource": {
 *     "resourceName": "web-shop",
 *     "resourceType": "app",
 *     "tags": {
 *       "env": "prod"
 *     }
 *   },
 *   "severity": "FATAL",
 *   "category": "ALERT",
 *   "subject": "Overloaded external dependency of My Web Shop external dependency",
 *   "body": "External dependency showing recommendations does not respond on time. Stop some clients to reduce the load.",
 *   "tags": {
 *     "ans:correlationId": "30118",
 *     "ans:status": "CREATE_OR_UPDATE",
 *     "customTag": "42"
 *   }
 * }
 */
export type CustomerResourceEvent =
  | {
      /**
       * ID generated on an acceptance criterion by the service. It is used for traceability of the event status.
       */
      id?: string;
      /**
       * Identifies the cause of an alert in the context of an affected resource. For example: HighCpuUsage, NotWorkingExternalDependency. The types must be meaningful for the user and should distinguish the event.
       * Pattern: ".*\\S.*".
       */
      eventType: string;
      /**
       * The timestamp that specifies when the event was created in the source. This property uses the Unix timestamp format (seconds since January 1st, 1970 at UTC)
       * Format: "int64".
       */
      eventTimestamp?: number;
      /**
       * Represents the event impact in the context of the affected resource. The possible values are (from low to high level of impact) - "INFO", "NOTICE", "WARNING", "ERROR", "FATAL".
       */
      severity: 'INFO' | 'NOTICE' | 'WARNING' | 'ERROR' | 'FATAL';
      /**
       * A property that identifies the category of the event. Common use cases for the possible values are:
       * ALERT - when the problem does not impact the workflow of the resource, but for example impacts its performance. It could be related to a resource dependency, which might be source of the problem.
       * NOTIFICATION - contains useful information about the state of the resource or its dependencies. For example, this can be an update, a planned downtime taking place, and so on.
       * EXCEPTION - when the problem is related to some abnormal worklfow in the resource.
       */
      category: 'ALERT' | 'NOTIFICATION' | 'EXCEPTION';
      /**
       * A meaningful title, which would be used as an email subject, an issue title, and so on.
       * Pattern: ".*\\S.*".
       */
      subject: string;
      /**
       * A meaningful description of the alert with sufficient details, which would be used as an email body, an issue content, and so on.
       * Pattern: ".*\\S.*".
       */
      body: string;
      /**
       * An optional property that defines the event urgency. The lower the number, the higher the priority, and the sooner the event should be reviewed.
       * Maximum: 1000.
       * Minimum: 1.
       */
      priority?: number;
      /**
       * Optional key-value pairs describing the event in details. It can be used for filtering purposes. Also it can contain special key-value pairs.
       *
       * General key-value pairs (All other tags with prefix 'ans:' will be ignored when event is delivered):
       * - ans:correlationId: Can be used by the sender in order to correlate this event with other activities or issues
       * - ans:sapPassport: Used for correlation between different SAP systems that support SAP-PASSPORT
       * - ans:sourceEventId: An ID generated by the event source. It would be used for incidents management and further stateful interactions. That is, actions on consequent events with the same ID will be related if applicable.
       * - ans:status: An optional property that could be used to change statuses in incidents management systems. Enum values: 'CREATE_OR_UPDATE', 'CREATE', 'UPDATE', 'COMMENT' or 'CLOSE'.
       * - ans:detailsLink: A URL that contains details for this alert to a system of your choosing. Can be link to your preferred dashboard, the Kibana data visualization plugin, the Dynatrace performance management tool, and others.
       * - ans:recommendedActionLink: A URL that contains details for recommended actions regarding this alert to a system of your choosing.
       */
      tags?: Record<string, string>;
      resource: AffectedCustomerResource;
    }
  | Record<string, any>;
