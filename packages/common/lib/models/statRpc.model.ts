export interface StatRPCInputBase {}

export interface StatRPCInputSpec extends StatRPCInputBase {}

export interface StatRPCInputSelect extends StatRPCInputSpec {}

export interface StatRPCStat {
  id: string;
  query?: string;
  getQuery?: () => any;
}

export interface StatRPC {
  stats: StatRPCStat[];
}

export interface StatRPCResultSelectDTO {
  stats: {
    id: string;
    value: number | string;
  }[];
}