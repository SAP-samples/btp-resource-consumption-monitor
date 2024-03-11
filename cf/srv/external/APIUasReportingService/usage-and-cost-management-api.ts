/*
 * Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved.
 *
 * This is a generated file powered by the SAP Cloud SDK for JavaScript.
 */
import { OpenApiRequestBuilder } from '@sap-cloud-sdk/openapi';
import type {
  CloudCreditsDetailsResponseObject,
  MonthlyUsageResponseList,
  MonthlyCostResponseList,
  SubaccountUsageResponseList
} from './schema';
/**
 * Representation of the 'UsageAndCostManagementApi'.
 * This API is part of the 'APIUasReportingService' service.
 */
export const UsageAndCostManagementApi = {
  /**
   * Get cloud credit data history for a global account. <br /><br />NOTE: You cannot use this API with global accounts that are licensed for the subscription-based commercial model. <br />
   * NOTE: Global accounts are the only contractual billable entity for SAP BTP. <br /><br />Required scope: $XSAPPNAME.reporting.GA_Admin
   * @param queryParameters - Object containing the following keys: viewPhases.
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  cloudCreditsDetails: (queryParameters?: { viewPhases?: 'ALL' | 'CURRENT' }) =>
    new OpenApiRequestBuilder<CloudCreditsDetailsResponseObject>(
      'get',
      '/reports/v1/cloudCreditsDetails',
      {
        queryParameters
      }
    ),
  /**
   * Get monthly usage reporting data for a directory and a specified time period. <br /><br />Required scope: $XSAPPNAME.reporting.Directory_Admin
   * @param queryParameters - Object containing the following keys: fromDate, toDate.
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  monthlyDirectoryUsage: (queryParameters: {
    fromDate: number;
    toDate: number;
  }) =>
    new OpenApiRequestBuilder<MonthlyUsageResponseList>(
      'get',
      '/reports/v1/monthlyDirectoryUsage',
      {
        queryParameters
      }
    ),
  /**
   * Get monthly cost reporting data for all subaccounts and a specified time period. Applies to global accounts that use the Cloud Platform Enterprise Agreement (CPEA) consumption-based commercial model. <br /><br />NOTE: You cannot use this API with (1) global accounts that are licensed for the subscription-based commercial model, or (2) global accounts that are licensed for both the consumption-based and subscription-based commercial models. <br /><br />NOTE: Global accounts are the only contractual billable entity for SAP BTP. Directories and subaccounts are used as structural entities in global accounts, and their usage and cost data should only be used for your internal cost estimations. The relative calculation per billable usage within each subaccount is an estimation only as it is based on certain measures which in some cases can either be different from the metrics that are presented in the <b>Global Account Costs</b> tab or which use different formulas than the ones used for billing. <br /><br />Required scope: $XSAPPNAME.reporting.GA_Admin<br />
   * @param queryParameters - Object containing the following keys: fromDate, toDate.
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  monthlyUsageSubaccountCost: (queryParameters: {
    fromDate: number;
    toDate: number;
  }) =>
    new OpenApiRequestBuilder<MonthlyCostResponseList>(
      'get',
      '/reports/v1/monthlySubaccountsCost',
      {
        queryParameters
      }
    ),
  /**
   * Get monthly usage reporting data for a global account and a specified time period. <br /><br />Required scope: $XSAPPNAME.reporting.GA_Admin
   * @param queryParameters - Object containing the following keys: fromDate, toDate.
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  monthlyUsage: (queryParameters: { fromDate: number; toDate: number }) =>
    new OpenApiRequestBuilder<MonthlyUsageResponseList>(
      'get',
      '/reports/v1/monthlyUsage',
      {
        queryParameters
      }
    ),
  /**
   * Get usage reporting data for a subaccount and a specified time period.<br /><br />Required scope: $XSAPPNAME.reporting.GA_Admin
   * @param queryParameters - Object containing the following keys: fromDate, periodPerspective, subaccountId, toDate.
   * @returns The request builder, use the `execute()` method to trigger the request.
   */
  dailySubaccountUsage: (queryParameters: {
    fromDate: number;
    periodPerspective?: 'DAY' | 'MONTH' | 'WEEK';
    subaccountId: string;
    toDate: number;
  }) =>
    new OpenApiRequestBuilder<SubaccountUsageResponseList>(
      'get',
      '/reports/v1/subaccountUsage',
      {
        queryParameters
      }
    )
};
