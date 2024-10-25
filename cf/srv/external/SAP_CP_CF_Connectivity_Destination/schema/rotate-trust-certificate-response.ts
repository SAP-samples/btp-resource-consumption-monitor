/*
 * Copyright (c) 2024 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */

/**
 * Representation of the 'RotateTrustCertificateResponse' schema.
 */
export type RotateTrustCertificateResponse = {
  /**
   * X.509 trust certificate in PEM format
   */
  activeCertificate?: string;
  /**
   * X.509 trust certificate in PEM format
   */
  passiveCertificate?: string;
} & Record<string, any>;
