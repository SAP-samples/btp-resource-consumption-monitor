/*
 * Copyright (c) 2024 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */
import type { HttpHeader } from './http-header';
/**
 * Authorization Token
 */
export type AuthToken = {
  /**
   * Type of the token. "Basic", "Bearer" etc.
   */
  type: string;
  /**
   * Base64 encoded token binary content
   */
  value: string;
  /**
   * Base64 encoded refresh token binary content
   */
  refresh_token?: string;
  http_header: HttpHeader;
  /**
   * The scopes issued with the token. The value of the scope parameter is expressed as a list of space-delimited strings. For example "read write execute"
   */
  scope?: string;
} & Record<string, any>;
