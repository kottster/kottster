import { DashboardPageGetCardDataInput, DashboardPageGetCardDataResult, DashboardPageGetStatDataInput, DashboardPageGetStatDataResult } from "./dashboardDto.model";

export enum DashboardPageConfigStatType {
  single = 'single',
  ratio = 'ratio',
}

export enum DashboardPageConfigCardType {
  lineChart = 'lineChart',
  areaChart = 'areaChart',
}

export enum DashboardFetchStrategy {
  rawSqlQuery = 'rawSqlQuery',
  customFetch = 'customFetch',
}

export interface DashboardPageConfigStatBase {
  key: string;

  type: keyof typeof DashboardPageConfigStatType;
  title: string;
  dataSource?: string;
  fetchStrategy: keyof typeof DashboardFetchStrategy;

  /** Grid field span for the field in the form (12, 8, 6, 4) */
  span?: string;

  /** Prefix for the value (goes before the value) */
  prefix?: string;

  /** Suffix for the value (goes after the value) */
  suffix?: string;

  /**
   * Custom fetcher function to retrieve data.
   * The function should return values
   * @param input - The input parameters for fetching data (period start and end dates)
   * @returns An object containing values
   */
  customDataFetcher?: (input: DashboardPageGetStatDataInput) => Promise<DashboardPageGetStatDataResult>;

  /**
   * Info tooltip text for the state
   * @example 'This stat shows the total sales for the last month.'
   */
  infoTooltipText?: string;
}

export interface DashboardPageConfigSingleStat extends DashboardPageConfigStatBase {
  type: 'single';
  sqlQuery: string;
}

export interface DashboardPageConfigRatioStat extends DashboardPageConfigStatBase {
  type: 'ratio';
  sqlQuery: string;
  sqlTotalQuery: string;
}

export type DashboardPageConfigStat = DashboardPageConfigSingleStat | DashboardPageConfigRatioStat;

export interface DashboardPageConfigChartValue {
  alias: string;
  title?: string;
  color?: string;
}

export interface DashboardPageConfigCardBase {
  key: string;

  title: string;
  dataSource?: string;
  type: keyof typeof DashboardPageConfigCardType;
  fetchStrategy: keyof typeof DashboardFetchStrategy;

  /** Grid field span for the field in the form (12, 8, 6, 4) */
  span?: string;

  /**
   * Custom fetcher function to retrieve data.
   * The function should return items
   * @param input - The input parameters for fetching data (period start and end dates)
   * @returns An object containing items
   */
  customDataFetcher?: (input: DashboardPageGetCardDataInput) => Promise<DashboardPageGetCardDataResult>;

  /**
   * Info tooltip text for the card
   * @example 'This chart shows the sales data for the last month.'
   */
  infoTooltipText?: string;
}

export interface DashboardPageConfigLineChartCard extends DashboardPageConfigCardBase {
  type: 'lineChart';
  sqlQuery: string;
  dataKeyAlias: string;
  values: DashboardPageConfigChartValue[];
  valueSuffix?: string;
  valuePrefix?: string;
  withDots?: boolean;
}

export interface DashboardPageConfigAreaChartCard extends Omit<DashboardPageConfigLineChartCard, 'type'> {
  type: 'areaChart';
  stacked?: boolean;
  withDots?: boolean;
}

export interface DashboardPageConfigBarChartCard extends Omit<DashboardPageConfigLineChartCard, 'type' | 'withDots'> {
  type: 'barChart';
  stacked?: boolean;
}

export type DashboardPageConfigCard = DashboardPageConfigLineChartCard | DashboardPageConfigAreaChartCard | DashboardPageConfigBarChartCard;

export interface DashboardPageConfig {
  withDateRangePicker?: boolean;
  dateRangePickerWithTime?: boolean;
  stats?: DashboardPageConfigStat[];
  cards?: DashboardPageConfigCard[];
}

export interface PartialDashboardPageConfig extends Partial<Omit<DashboardPageConfig, 'stats' | 'cards'>> {
  stats?: Partial<DashboardPageConfigStat>[];
  cards?: Partial<DashboardPageConfigCard>[];
}