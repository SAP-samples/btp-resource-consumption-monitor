/*
 * Copyright (c) 2024 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */
import { OpenApiRequestBuilder } from '@sap-cloud-sdk/openapi';
import type { DestinationLookUpResult } from './schema';
/**
 * Representation of the 'FindADestinationApi'.
 * This API is part of the 'SAP_CP_CF_Connectivity_Destination' service.
 */
export const FindADestinationApi = {
  /**
   * Search priority is destination on service instance level. If none is found, fallbacks to subaccount level (accessible by all apps deployed in the same subaccount).
   * @param name - Destination name
   * @param queryParameters - Object containing the following keys: $skipCredentials, $skipTokenRetrieval.
   * @param headerParameters - Object containing the following keys: X-user-token, X-refresh-token, X-code, X-redirect-uri, X-code-verifier, X-tenant, X-client-assertion, X-client-assertion-type, X-client-assertion-destination-name, X-fragment-name, If-None-Match, If-Match.
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  getDestinationsByName: (
    name: string,
    queryParameters?: {
      $skipCredentials?: boolean;
      $skipTokenRetrieval?: boolean;
    },
    headerParameters?: {
      'X-user-token'?: string;
      'X-refresh-token'?: string;
      'X-code'?: string;
      'X-redirect-uri'?: string;
      'X-code-verifier'?: string;
      'X-tenant'?: string;
      'X-client-assertion'?: string;
      'X-client-assertion-type'?: string;
      'X-client-assertion-destination-name'?: string;
      'X-fragment-name'?: string;
      'If-None-Match'?: string;
      'If-Match'?: string;
    }
  ) =>
    new OpenApiRequestBuilder<DestinationLookUpResult>(
      'get',
      '/destinations/{name}',
      {
        pathParameters: { name },
        queryParameters,
        headerParameters
      }
    )
};
