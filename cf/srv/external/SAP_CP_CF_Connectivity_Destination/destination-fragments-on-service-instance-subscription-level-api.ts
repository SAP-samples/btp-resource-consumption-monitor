/*
 * Copyright (c) 2024 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */
import { OpenApiRequestBuilder } from '@sap-cloud-sdk/openapi';
import type { Fragment, Update } from './schema';
/**
 * Representation of the 'DestinationFragmentsOnServiceInstanceSubscriptionLevelApi'.
 * This API is part of the 'SAP_CP_CF_Connectivity_Destination' service.
 */
export const DestinationFragmentsOnServiceInstanceSubscriptionLevelApi = {
  /**
   * Get a list of destination fragments (as a JSON array) posted on service instance level.
   * If none are found, an empty array is returned.
   * Service instance and subaccount are determined by the passed OAuth access token in the Authorization header.
   *
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  getInstanceDestinationFragments: () =>
    new OpenApiRequestBuilder<Fragment[]>(
      'get',
      '/instanceDestinationFragments'
    ),
  /**
   * Overwrite an existing destination fragment (as a JSON object), posted on service instance level. Service instance and subaccount are determined by the passed OAuth access token in the Authorization header.
   * @param body - Fragment properties (as a JSON object). The request body must not contain the properties "Name" or "Type".
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  updateInstanceDestinationFragments: (body: Fragment) =>
    new OpenApiRequestBuilder<Update>('put', '/instanceDestinationFragments', {
      body
    }),
  /**
   * Post a new destination fragment (as a JSON object) on service instance level. Service instance and subaccount are determined by the passed OAuth access token in the Authorization header.
   * @param body - Fragment properties (as a JSON object). The request body must not contain the properties "Name" or "Type".
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  createInstanceDestinationFragments: (body: Fragment) =>
    new OpenApiRequestBuilder<any>('post', '/instanceDestinationFragments', {
      body
    }),
  /**
   * Get a destination fragment (as a JSON object) posted on service instance level. Service instance and subaccount are determined by the passed OAuth access token in the Authorization header.
   * @param fragmentName - Fragment name
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  getInstanceDestinationFragmentsByFragmentName: (fragmentName: string) =>
    new OpenApiRequestBuilder<Fragment>(
      'get',
      '/instanceDestinationFragments/{fragmentName}',
      {
        pathParameters: { fragmentName }
      }
    ),
  /**
   * Delete a destination fragment posted on service instance level. Service instance and subaccount are determined by the passed OAuth access token in the Authorization header.
   * @param fragmentName - Fragment name
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  deleteInstanceDestinationFragmentsByFragmentName: (fragmentName: string) =>
    new OpenApiRequestBuilder<Update>(
      'delete',
      '/instanceDestinationFragments/{fragmentName}',
      {
        pathParameters: { fragmentName }
      }
    )
};
