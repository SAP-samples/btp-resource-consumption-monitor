/*
 * Copyright (c) 2024 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */
import { OpenApiRequestBuilder } from '@sap-cloud-sdk/openapi';
import type { IdpMetadata } from './schema';
/**
 * Representation of the 'SAMLIdPMetadataXMLApi'.
 * This API is part of the 'SAP_CP_CF_Connectivity_Destination' service.
 */
export const SAMLIdPMetadataXMLApi = {
  /**
   * Get the SAML IdP metadata used to share configuration information between the Identity Provider (IdP) and the Service Provider (SP). Note that it's generic (contains only the certificate) and not configured for a specific scenario (i.e. CF to CF, CF to Neo etc.) which requires additional properties.
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  getSaml2Metadata: () =>
    new OpenApiRequestBuilder<IdpMetadata>('get', '/saml2Metadata')
};
