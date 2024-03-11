/*
 * Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */
import type { PhasesResponseObject } from './phases-response-object';
/**
 * Representation of the 'ContractResponseObject' schema.
 */
export type ContractResponseObject =
  | {
      /**
       * The date that the contract finishes. Date is in the format YYYY-MM-DD.
       */
      contractEndDate?: string;
      /**
       * The date that the contract begins. Date is in the format YYYY-MM-DD.
       */
      contractStartDate?: string;
      /**
       * The currency used to pay for the contract.
       */
      currency?: string;
      /**
       * The period for which a contract is purchased is broken down into smaller parts and each part is called a phase.
       */
      phases?: PhasesResponseObject[];
    }
  | Record<string, any>;
