/*
 * Copyright (c) 2024 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */

/**
 * Certificate/Keystore
 */
export type Certificate = {
  /**
   * Name of the certificate/keystore
   */
  Name: string;
  /**
   * Type of the object. Could be null if not present
   */
  Type?: string;
  /**
   * Base64 encoded keystore/certificate binary content
   */
  Content: string;
} & Record<string, any>;
