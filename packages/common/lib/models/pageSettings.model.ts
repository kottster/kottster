import { pageSettingsTablePageKey } from "../constants/pageSettings";
import { TablePageConfig } from "./tablePage.model";

export interface PageSettings {
  [pageSettingsTablePageKey]: TablePageConfig;
  [key: string]: TablePageConfig;
};

export interface PageSettingsWithVersion {
  /** The settings version */
  _version?: string;

  [pageSettingsTablePageKey]: TablePageConfig;
  [key: `${typeof pageSettingsTablePageKey}_${string}`]: TablePageConfig;
};
