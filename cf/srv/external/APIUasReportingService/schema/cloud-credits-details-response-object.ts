/*
 * Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */
import type { ContractResponseObject } from './contract-response-object';
/**
 * Representation of the 'CloudCreditsDetailsResponseObject' schema.
 */
export type CloudCreditsDetailsResponseObject =
  | {
      contracts?: ContractResponseObject[];
      /**
       * The unique ID of the global account.
       */
      globalAccountId?: string;
      /**
       * The display name of the global account.
       */
      globalAccountName?: string;
    }
  | Record<string, any>;
