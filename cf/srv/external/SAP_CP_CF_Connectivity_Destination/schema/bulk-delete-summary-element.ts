/*
 * Copyright (c) 2024 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */

/**
 * Representation of the 'BulkDeleteSummaryElement' schema.
 */
export type BulkDeleteSummaryElement = {
  /**
   * The name of the configuration
   */
  name: string;
  /**
   * The status of the operation for this configuration
   */
  status: 'DELETED' | 'NOT_FOUND';
  /**
   * This field is only present when the status is "NOT_FOUND" and represents the reason for this status
   */
  reason?: string;
} & Record<string, any>;
