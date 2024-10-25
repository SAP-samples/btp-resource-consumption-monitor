/*
 * Copyright (c) 2024 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */

/**
 * Prepared HTTP Header with appropriate authorization (token type) scheme and token
 */
export type HttpHeader = {
  /**
   * Key of the header. "Authorization", "Cookie" etc.
   */
  key: string;
  /**
   * The appropriate authorization scheme (token type) and token using the correct separator
   */
  value: string;
} & Record<string, any>;
