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
 * Representation of the 'DestinationsOnSubaccountLevelApi'.
 * This API is part of the 'SAP_CP_CF_Connectivity_Destination' service.
 */
export const DestinationsOnSubaccountLevelApi = {
  /**
   * Get a list of destinations (as a JSON array) posted on subaccount
   * level. If none is found, an empty array is returned. Subaccount is determined
   * by the passed OAuth access token.
   *
   * For requests which return a large number of destinations, chunked handling of the response will be enabled. If an error occurs with the request processing while chunking is enabled, no response will be returned to the client.
   *
   * Note: The maximum length of the `<path>?<query>#<fragment>` part of [a URI](https://tools.ietf.org/html/rfc3986#section-3) is 4000 characters.
   *
   * @param queryParameters - Object containing the following keys: $filter, $select, $page, $pageSize, $pageCount, $entityCount.
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  getSubaccountDestinations: (queryParameters?: {
    $filter?: string;
    $select?: 'Name';
    $page?: number;
    $pageSize?: number;
    $pageCount?: true | false;
    $entityCount?: true | false;
  }) =>
    new OpenApiRequestBuilder<Destination | NameOnly[]>(
      'get',
      '/subaccountDestinations',
      {
        queryParameters
      }
    ),
  /**
   * Update (overwrite) an existing destination or destinations with a new destination (as a JSON object) or with new destinations (as a JSON array), posted on subaccount level. Subaccount is determined by the passed OAuth access token.
   * @param body - Destination properties (as a JSON object) / Destinations properties (as a JSON array)
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  updateSubaccountDestinations: (body: Destination | Destinations) =>
    new OpenApiRequestBuilder<Update | BulkResponse[] | any>(
      'put',
      '/subaccountDestinations',
      {
        body
      }
    ),
  /**
   * Post a new destination (as a JSON object) or destinations (as a JSON array) on subaccount level. Subaccount is determined by the passed OAuth access token.
   * @param body - Destination properties (as a JSON object) / Destinations properties (as a JSON array)
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  createSubaccountDestinations: (body: Destination | Destinations) =>
    new OpenApiRequestBuilder<any | any>('post', '/subaccountDestinations', {
      body
    }),
  /**
   * Delete destinations posted on subaccount level. Subaccount is
   * determined by the passed OAuth access token.
   *
   * Note: The maximum length of the `<path>?<query>#<fragment>` part of [a URI](https://tools.ietf.org/html/rfc3986#section-3) is 4000 characters.
   *
   * @param queryParameters - Object containing the following keys: $filter.
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  deleteSubaccountDestinations: (queryParameters: { $filter: string }) =>
    new OpenApiRequestBuilder<BulkDelete>('delete', '/subaccountDestinations', {
      queryParameters
    }),
  /**
   * Get a destination (as a JSON object) posted on subaccount level. Subaccount is determined by the passed OAuth access token.
   * @param destinationName - Destination name
   * @param headerParameters - Object containing the following keys: If-None-Match, If-Match.
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  getSubaccountDestinationsByDestinationName: (
    destinationName: string,
    headerParameters?: { 'If-None-Match'?: string; 'If-Match'?: string }
  ) =>
    new OpenApiRequestBuilder<Destination>(
      'get',
      '/subaccountDestinations/{destinationName}',
      {
        pathParameters: { destinationName },
        headerParameters
      }
    ),
  /**
   * Delete a destination posted on subaccount level. Subaccount is determined by the passed OAuth access token.
   * @param destinationName - Destination name
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  deleteSubaccountDestinationsByDestinationName: (destinationName: string) =>
    new OpenApiRequestBuilder<Update>(
      'delete',
      '/subaccountDestinations/{destinationName}',
      {
        pathParameters: { destinationName }
      }
    )
};
