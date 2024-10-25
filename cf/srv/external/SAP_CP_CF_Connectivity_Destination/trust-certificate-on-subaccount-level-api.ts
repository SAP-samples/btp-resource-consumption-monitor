/*
 * Copyright (c) 2024 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */
import { OpenApiRequestBuilder } from '@sap-cloud-sdk/openapi';
import type {
  TrustCertificateResponse,
  Update,
  RotateTrustCertificateResponse
} from './schema';
/**
 * Representation of the 'TrustCertificateOnSubaccountLevelApi'.
 * This API is part of the 'SAP_CP_CF_Connectivity_Destination' service.
 */
export const TrustCertificateOnSubaccountLevelApi = {
  /**
   * Get the X.509 trust certificate (in PEM format) for the subaccount.
   * The public key in the certificate can be used to validate SAML assertions by the target token service.
   *
   * Subaccount is determined by the passed OAuth access token.
   *
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  getSaml2MetadataCertificate: () =>
    new OpenApiRequestBuilder<TrustCertificateResponse>(
      'get',
      '/saml2Metadata/certificate'
    ),
  /**
   * If a trust certificate does not exist, it gets generated.
   * If it exists, it is renewed instead.
   * The new trust certificate is returned in the response.
   *
   * Subaccount is determined by the passed OAuth access token.
   *
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  createSaml2MetadataCertificate: () =>
    new OpenApiRequestBuilder<TrustCertificateResponse>(
      'post',
      '/saml2Metadata/certificate'
    ),
  /**
   * Get the passive X.509 trust certificate (in PEM format) for the subaccount.
   * The public key in the certificate can be used to validate SAML assertions by the target token service.
   *
   * Subaccount is determined by the passed OAuth access token.
   *
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  getSaml2MetadataCertificatePassive: () =>
    new OpenApiRequestBuilder<TrustCertificateResponse>(
      'get',
      '/saml2Metadata/certificate/passive'
    ),
  /**
   * If a passive trust certificate does not exist, it gets generated.
   * If it exists, it is renewed instead.
   * The new passive trust certificate is returned in the response.
   *
   * Subaccount is determined by the passed OAuth access token.
   *
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  createSaml2MetadataCertificatePassive: () =>
    new OpenApiRequestBuilder<TrustCertificateResponse>(
      'post',
      '/saml2Metadata/certificate/passive'
    ),
  /**
   * Delete the passive trust certificate for subaccount.
   *
   * Subaccount is determined by the passed OAuth access token.
   *
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  deleteSaml2MetadataCertificatePassive: () =>
    new OpenApiRequestBuilder<Update>(
      'delete',
      '/saml2Metadata/certificate/passive'
    ),
  /**
   * Rotate the active and the passive trust certificates for subaccount.
   *
   * Subaccount is determined by the passed OAuth access token.
   *
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  createSaml2MetadataRotateCertificate: () =>
    new OpenApiRequestBuilder<RotateTrustCertificateResponse>(
      'post',
      '/saml2Metadata/rotateCertificate'
    )
};
