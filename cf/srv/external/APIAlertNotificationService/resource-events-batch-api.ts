/*
 * Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */
import { OpenApiRequestBuilder } from '@sap-cloud-sdk/openapi';
/**
 * Representation of the 'ResourceEventsBatchApi'.
 * This API is part of the 'cf_producer_api' service.
 */
export const ResourceEventsBatchApi = {
  /**
   * Use this endpoint to post events regarding any of your applications. You can post a list that contains multiple events. You can also create a chain of stateful events by using the special "ans:" prefixed tags. Once the event is received by Alert Notification, it is delivered to each channel that you have already defined. For example, e-mail, Slack, webhook, and so on.
   * @param body - Description of the events. For example, where they have occurred and how important they are. You can include any details that you need to react appropriately. Those properties can be used for defining how the event is processed when received by Alert Notification.
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  postResourceEventsBatch: (body: any) =>
    new OpenApiRequestBuilder<any>(
      'post',
      '/cf/producer/v1/resource-events-batch',
      {
        body
      }
    )
};
