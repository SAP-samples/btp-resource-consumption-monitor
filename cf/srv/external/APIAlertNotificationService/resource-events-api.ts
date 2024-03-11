/*
 * Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */
import { OpenApiRequestBuilder } from '@sap-cloud-sdk/openapi';
/**
 * Representation of the 'ResourceEventsApi'.
 * This API is part of the 'cf_producer_api' service.
 */
export const ResourceEventsApi = {
  /**
   * Use this endpoint to post an event regarding any of your applications. You can post just a single event or also you have the possibility to create a chain of stateful events using the special "ans:" prefixed tags. Once the event is received by Alert Notification, it is delivered to each channel you have already defined - e-mail, Slack, webhook, etc.
   * @param body - Here the event is described - where it has occurred and how important is it. You can include any detail you need to react appropriately. Those properties can be used for defining how the event is processed when received by Alert Notification.
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  postResourceEvent: (body: any) =>
    new OpenApiRequestBuilder<any>('post', '/cf/producer/v1/resource-events', {
      body
    })
};
