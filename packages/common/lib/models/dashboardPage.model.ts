export interface DashboardPageInputBase {}

export interface DashboardPageInputGetStatData extends DashboardPageInputBase {
  statKey: string;
  periodStartDate?: string;
  periodEndDate?: string;
}

export interface DashboardPageInputGetCardData extends DashboardPageInputBase {
  cardKey: string;
  periodStartDate?: string;
  periodEndDate?: string;
}

export enum DashboardPageConfigStatType {
  // TODO: rename to value, valueOfTotal, etc.
  basic = 'basic',
  withTotal = 'withTotal',
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
  customDataFetcher?: (input: DashboardPageInputGetStatData) => Promise<DashboardPageGetStatDataResult>;
}

export interface DashboardPageConfigBasicStat extends DashboardPageConfigStatBase {
  type: 'basic';
  sqlQuery: string;
}

export interface DashboardPageConfigTotalStat extends DashboardPageConfigStatBase {
  type: 'withTotal';
  sqlQuery: string;
  totalSqlQuery: string;
}

export type DashboardPageConfigStat = DashboardPageConfigBasicStat | DashboardPageConfigTotalStat;

export interface DashboardPageConfigChartLegend {
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
  customDataFetcher?: (input: DashboardPageInputGetCardData) => Promise<DashboardPageGetCardDataResult>;
}

export interface DashboardPageConfigLineChartCard extends DashboardPageConfigCardBase {
  type: 'lineChart';
  sqlQuery: string;
  dataKeyAlias: string;
  legends: DashboardPageConfigChartLegend[];
  valueSuffix?: string;
  valuePrefix?: string;
}

export interface DashboardPageConfigAreaChartCard extends Omit<DashboardPageConfigLineChartCard, 'type'> {
  type: 'areaChart';
  stacked?: boolean;
}

export interface DashboardPageConfigBarChartCard extends Omit<DashboardPageConfigLineChartCard, 'type'> {
  type: 'barChart';
}

export type DashboardPageConfigCard = DashboardPageConfigLineChartCard | DashboardPageConfigAreaChartCard | DashboardPageConfigBarChartCard;

export interface DashboardPageConfig {
  withDateRangePicker?: boolean;
  dateRangePickerWithTime?: boolean;
  stats?: DashboardPageConfigStat[];
  cards?: DashboardPageConfigCard[];
}

export interface DashboardPageGetStatDataResult {
  value?: number | string;
  total?: number | string;
}

export interface DashboardPageGetCardDataResult {
  items: Record<string, any>[];
}