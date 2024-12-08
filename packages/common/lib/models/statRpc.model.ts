export interface StatRpcInputBase {}

export interface StatRpcInputSpec extends StatRpcInputBase {}

export interface StatRpcInputSelect extends StatRpcInputSpec {}

export interface StatRpcStat {
  id: string;
  query?: string;
  getQuery?: () => any;
}

export interface StatRpc {
  stats: StatRpcStat[];
}

export interface StatRpcResultSelectDTO {
  stats: {
    id: string;
    value: number | string;
  }[];
}