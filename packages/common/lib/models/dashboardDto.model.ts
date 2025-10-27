export interface DashboardPageInputBase {}

export interface DashboardPageGetStatDataInput extends DashboardPageInputBase {
  statKey: string;
  periodStartDate?: string;
  periodEndDate?: string;
}

export interface DashboardPageGetCardDataInput extends DashboardPageInputBase {
  cardKey: string;
  periodStartDate?: string;
  periodEndDate?: string;
}

export interface DashboardPageGetStatDataResult {
  value?: number | string;
  total?: number | string;
}

export interface DashboardPageGetCardDataResult {
  items: Record<string, any>[];
}