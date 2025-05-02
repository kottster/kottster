import { FieldInput, pageSettingsTablePageKey, PageSettingsWithVersion, TablePageConfig, TablePageConfigColumn } from '@kottster/common';
import { Knex } from 'knex';

interface SafeTablePageConfigColumn extends TablePageConfigColumn {
  fieldInput?: FieldInput | { type: any; };
}

interface SafeTablePageConfig extends TablePageConfig {
  columns?: SafeTablePageConfigColumn[];

  /**
   * Function type for modifying the Knex query builder
   * @param query The Knex query builder instance
   * @returns The modified query builder
   */
  knexQueryModifier?: (knex: Knex.QueryBuilder) => Knex.QueryBuilder;
}

// Sage interface for page settings to avoid TS error when importing settings from JSON files.
export interface SafePageSettings extends PageSettingsWithVersion {
  [pageSettingsTablePageKey]: SafeTablePageConfig;
  [key: `${typeof pageSettingsTablePageKey}_${string}`]: SafeTablePageConfig;
}