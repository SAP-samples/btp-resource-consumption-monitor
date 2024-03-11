/*
 * Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */

/**
 * Representation of the 'CustomerProducerUnauthorizedApiError' schema.
 */
export type CustomerProducerUnauthorizedApiError =
  | {
      status: 401;
      message: string;
      timestamp: number;
      path: string;
      error: string;
    }
  | Record<string, any>;
