/*
 * Copyright (c) 2024 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */
import type { BulkDeleteSummaryElement } from './bulk-delete-summary-element';
/**
 * Representation of the 'BulkDelete' schema.
 */
export type BulkDelete = {
  /**
   * The number effected records
   */
  Count: number;
  /**
   * A list of the processed configurations and their status(DELETED, NOT_FOUND)
   */
  Summary: BulkDeleteSummaryElement[];
} & Record<string, any>;
