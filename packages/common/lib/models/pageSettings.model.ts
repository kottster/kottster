import { pageSettingsTablePageKey } from "../constants/pageSettings";
import { FieldInput } from "./fieldInput.model";
import { TablePageConfig, TablePageConfigColumn } from "./tablePage.model";

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

interface SafeTablePageConfigColumn extends TablePageConfigColumn {
  fieldInput?: FieldInput | { type: any; };
}

interface SafeTablePageConfig extends TablePageConfig {
  columns?: SafeTablePageConfigColumn[];
}

// Sage interface for page settings to avoid TS error when importing settings from JSON files.
export interface SafePageSettings extends PageSettingsWithVersion {
  [pageSettingsTablePageKey]: SafeTablePageConfig;
  [key: `${typeof pageSettingsTablePageKey}_${string}`]: SafeTablePageConfig;
}