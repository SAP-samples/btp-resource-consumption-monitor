/*
 * Copyright (c) 2024 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */
import type { Owner } from './owner';
import type { Destination } from './destination';
import type { Certificate } from './certificate';
import type { AuthToken } from './auth-token';
/**
 * Contains the owner, found destination, certificates (if present) and authorization token (if present)
 */
export type DestinationLookUpResult = {
  owner?: Owner;
  destinationConfiguration?: Destination;
  certificates?: Certificate[];
  authTokens?: AuthToken[];
} & Record<string, any>;
