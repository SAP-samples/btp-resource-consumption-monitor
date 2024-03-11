/*
 * Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */
import type { CustomerResourceEvent } from './customer-resource-event';
/**
 * Representation of the 'BatchProducerApiError' schema.
 */
export type BatchProducerApiError =
  | {
      /**
       * Events that are ingested into the system for further processing. To receive such events, subscription have to be configured.
       */
      accepted?: CustomerResourceEvent[];
      /**
       * Any provided event that has not been ingested into the system for further processing.
       */
      rejected?: CustomerResourceEvent[];
      code: 500;
      message: string;
    }
  | Record<string, any>;
