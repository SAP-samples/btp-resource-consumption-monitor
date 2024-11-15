/*
 * Copyright (c) 2024 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */
import { OpenApiRequestBuilder } from '@sap-cloud-sdk/openapi';
import type { Fragment, Update } from './schema';
/**
 * Representation of the 'DestinationFragmentsOnSubaccountLevelApi'.
 * This API is part of the 'SAP_CP_CF_Connectivity_Destination' service.
 */
export const DestinationFragmentsOnSubaccountLevelApi = {
  /**
   * Get a list of destination fragments (as a JSON array) posted on subaccount level.
   * If none are found, an empty array is returned.
   * Subaccount is determined by the passed OAuth access token in the Authorization header.
   *
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  getSubaccountDestinationFragments: () =>
    new OpenApiRequestBuilder<Fragment[]>(
      'get',
      '/subaccountDestinationFragments'
    ),
  /**
   * Overwrite an existing destination fragment (as a JSON object), posted on subaccount level. Subaccount is determined by the passed OAuth access token in the Authorization header.
   * @param body - Fragment properties (as a JSON object). The request body must not contain the properties "Name" or "Type".
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  updateSubaccountDestinationFragments: (body: Fragment) =>
    new OpenApiRequestBuilder<Update>(
      'put',
      '/subaccountDestinationFragments',
      {
        body
      }
    ),
  /**
   * Post a new destination fragment (as a JSON object) on subaccount level. Subaccount is determined by the passed OAuth access token in the Authorization header.
   * @param body - Fragment properties (as a JSON object). The request body must not contain the properties "Name" or "Type".
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  createSubaccountDestinationFragments: (body: Fragment) =>
    new OpenApiRequestBuilder<any>('post', '/subaccountDestinationFragments', {
      body
    }),
  /**
   * Get a destination fragment (as a JSON object) posted on subaccount level. Subaccount is determined by the passed OAuth access token in the Authorization header.
   * @param fragmentName - Fragment name
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  getSubaccountDestinationFragmentsByFragmentName: (fragmentName: string) =>
    new OpenApiRequestBuilder<Fragment>(
      'get',
      '/subaccountDestinationFragments/{fragmentName}',
      {
        pathParameters: { fragmentName }
      }
    ),
  /**
   * Delete a destination fragment posted on subaccount level. Subaccount is determined by the passed OAuth access token in the Authorization header.
   * @param fragmentName - Fragment name
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  deleteSubaccountDestinationFragmentsByFragmentName: (fragmentName: string) =>
    new OpenApiRequestBuilder<Update>(
      'delete',
      '/subaccountDestinationFragments/{fragmentName}',
      {
        pathParameters: { fragmentName }
      }
    )
};
