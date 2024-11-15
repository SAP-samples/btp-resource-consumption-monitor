/*
 * Copyright (c) 2024 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */

/**
 * Certificate filename and certificate attributes
 */
export type Attributes = {
  /**
   * Name of the certificate
   */
  Name: string;
  /**
   * Type of the object. Could be null if not present or PEM
   */
  Type?: string;
  /**
   * Certificate validity and CN
   */
  Attributes: {
    /**
     * Certificate common name
     */
    CN?: string;
    /**
     * Certificate signing request (base64 encoded PEM)
     */
    CSR?: string;
    /**
     * Certificate validity
     */
    Validity?: {
      /**
       * validity time unit
       */
      TimeUnit?: 'DAYS' | 'MONTHS' | 'YEARS';
      /**
       * value for the validity time unit
       */
      Value?: number;
    } & Record<string, any>;
    /**
     * Enable automatic certificate renew when the certificate is close to expiring.
     */
    AutomaticRenew?: boolean;
    /**
     * Password which protects the generated private key (in case of pem) or keystore.
     */
    Password?: string;
  } & Record<string, any>;
} & Record<string, any>;
