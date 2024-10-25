/*
 * Copyright (c) 2024 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */

/**
 * Representation of the 'BulkResponse' schema.
 */
export type BulkResponse = {
  /**
   * Configuration's name
   */
  name: string;
  /**
   * Status code
   */
  status: number;
  /**
   * Current server-side ETag value of the resource.
   */
  etag?: string;
  /**
   * Cause error description
   */
  cause?: string;
} & Record<string, any>;
