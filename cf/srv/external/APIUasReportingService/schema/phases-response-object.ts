/*
 * Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */
import type { PhaseUpdates } from './phase-updates';
/**
 * Representation of the 'PhasesResponseObject' schema.
 */
export type PhasesResponseObject =
  | {
      /**
       * Phase end date is in the format YYYY-MM-DD.
       */
      phaseEndDate?: string;
      /**
       * Phase start date is in the format YYYY-MM-DD.
       */
      phaseStartDate?: string;
      /**
       * History relating to phase updates.
       */
      phaseUpdates?: PhaseUpdates[];
    }
  | Record<string, any>;
