/*
 * Copyright (c) 2024 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */

/**
 * Destination object
 */
export type Destination = {
  /**
   * Name of the destination configuration
   */
  Name: string;
  /**
   * Type of the destination configuration
   */
  Type: 'HTTP' | 'RFC' | 'MAIL' | 'LDAP';
  /**
   * Name of the destination property
   */
  PropertyName?: string;
} & Record<string, any>;
