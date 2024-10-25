/*
 * Copyright (c) 2024 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */
import { OpenApiRequestBuilder } from '@sap-cloud-sdk/openapi';
import type {
  Destination,
  NameOnly,
  Destinations,
  Update,
  BulkResponse,
  BulkDelete
} from './schema';
/**
 * Representation of the 'DestinationsOnServiceInstanceSubscriptionLevelApi'.
 * This API is part of the 'SAP_CP_CF_Connectivity_Destination' service.
 */
export const DestinationsOnServiceInstanceSubscriptionLevelApi = {
  /**
   * Get all destinations (as a JSON array) on service instance level.
   * If none is found, an empty list is returned. Service instance and subaccount
   * are determined the passed OAuth access token.
   *
   * For requests which return a large number of destinations, chunked handling of the response will be enabled. If an error occurs with the request processing while chunking is enabled, no response will be returned to the client.
   *
   * Note: The maximum length of the `<path>?<query>#<fragment>` part of [a URI](https://tools.ietf.org/html/rfc3986#section-3) is 4000 characters.
   *
   * @param queryParameters - Object containing the following keys: $filter, $select, $page, $pageSize, $pageCount, $entityCount.
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  getInstanceDestinations: (queryParameters?: {
    $filter?: string;
    $select?: 'Name';
    $page?: number;
    $pageSize?: number;
    $pageCount?: true | false;
    $entityCount?: true | false;
  }) =>
    new OpenApiRequestBuilder<Destination | NameOnly[]>(
      'get',
      '/instanceDestinations',
      {
        queryParameters
      }
    ),
  /**
   * Update (overwrite) an existing destination or destinations with the passed destination (as a JSON object) or the passed destinations (as a JSON array). Service instance and subaccount are determined by the passed OAuth access token
   * @param body - Destination properties (as a JSON object) / Destinations properties (as a JSON array)
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  updateInstanceDestinations: (body: Destination | Destinations) =>
    new OpenApiRequestBuilder<Update | BulkResponse[] | any>(
      'put',
      '/instanceDestinations',
      {
        body
      }
    ),
  /**
   * Post a new destination (as a JSON object) or destinations (as a JSON array) on service instance level. Service instance and subaccount are determined by the passed OAuth access token
   * @param body - Destination properties (as a JSON object) / Destinations properties (as a JSON array)
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  createInstanceDestinations: (body: Destination | Destinations) =>
    new OpenApiRequestBuilder<any | any>('post', '/instanceDestinations', {
      body
    }),
  /**
   * Delete destinations posted on service instance level. Service
   * instance and subaccount are determined by the passed OAuth access token.
   *
   * Note: The maximum length of the `<path>?<query>#<fragment>` part of [a URI](https://tools.ietf.org/html/rfc3986#section-3) is 4000 characters.
   *
   * @param queryParameters - Object containing the following keys: $filter.
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  deleteInstanceDestinations: (queryParameters: { $filter: string }) =>
    new OpenApiRequestBuilder<BulkDelete>('delete', '/instanceDestinations', {
      queryParameters
    }),
  /**
   * Get a destination (as a JSON object) posted on service instance level. Service instance and subaccount are determined by the passed OAuth access token
   * @param destinationName - Destination name
   * @param headerParameters - Object containing the following keys: If-None-Match, If-Match.
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  getInstanceDestinationsByDestinationName: (
    destinationName: string,
    headerParameters?: { 'If-None-Match'?: string; 'If-Match'?: string }
  ) =>
    new OpenApiRequestBuilder<Destination>(
      'get',
      '/instanceDestinations/{destinationName}',
      {
        pathParameters: { destinationName },
        headerParameters
      }
    ),
  /**
   * Delete a destination posted on service instance level. Service instance and subaccount are determined by the passed OAuth access token.
   * @param destinationName - Destination name
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  deleteInstanceDestinationsByDestinationName: (destinationName: string) =>
    new OpenApiRequestBuilder<Update>(
      'delete',
      '/instanceDestinations/{destinationName}',
      {
        pathParameters: { destinationName }
      }
    )
};
