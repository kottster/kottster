import { pageSettingsTableRpcKey } from "../constants/pageSettings";
import { TableRpc } from "./tableRpc.model";

export interface PageSettings {
  [pageSettingsTableRpcKey]: TableRpc;
  [key: string]: TableRpc;
};

export interface PageSettingsWithVersion {
  /** The settings version */
  _version?: string;

  [pageSettingsTableRpcKey]: TableRpc;
  [key: `${typeof pageSettingsTableRpcKey}_${string}`]: TableRpc;
};