/*
 * Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */

/**
 * Representation of the 'TooManyRequestsApiError' schema.
 */
export type TooManyRequestsApiError =
  | {
      code: 429;
      /**
       * @example "API request quota exceeded. Allowed total attempts number of {requests} per {time-frame}."
       */
      message: string;
    }
  | Record<string, any>;
