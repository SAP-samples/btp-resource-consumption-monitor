/*
 * Copyright (c) 2024 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */

/**
 * Certificate/Keystore
 */
export type PublicKey = {
  /**
   * Alias of a certificate from the keystore. This attribute will not be present when the input is not a keystore.
   */
  Alias?: string;
  /**
   * Base64 encoded certificate chain in PEM format
   */
  Content: string;
} & Record<string, any>;
