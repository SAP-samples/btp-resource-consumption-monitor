/*
 * Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */

/**
 * Representation of the 'PhaseUpdates' schema.
 */
export type PhaseUpdates =
  | {
      /**
       * The residual amount of cloud credits available.
       * Format: "double".
       */
      balance?: number;
      /**
       * The complete amount of cloud credits available in this phase.
       * Format: "double".
       */
      cloudCreditsForPhase?: number;
      /**
       * The date that the phase was updated. Date is in the format YYYY-MM-DD.
       */
      phaseUpdatedOn?: string;
    }
  | Record<string, any>;
