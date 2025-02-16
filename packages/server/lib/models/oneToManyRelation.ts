import { OneToManyRelationConfig } from "@kottster/common";

export class OneToManyRelation implements OneToManyRelationConfig {
  public readonly relation = 'oneToMany';
  public readonly targetTable: string;
  public readonly targetTableKeyColumn: string;
  public readonly targetTableForeignKeyColumn: string;
  public readonly previewColumns: string[];
  public readonly columns?: string[];
  public readonly searchableColumns?: string[];
  public readonly sortableColumns?: string[];
  public readonly filterableColumns?: string[];
  public readonly linked?: Record<string, any>;

  constructor(config: Omit<OneToManyRelationConfig, 'relation'>) {
    this.targetTable = config.targetTable;
    this.targetTableKeyColumn = config.targetTableKeyColumn;
    this.targetTableForeignKeyColumn = config.targetTableForeignKeyColumn;
    this.previewColumns = config.previewColumns;
    this.columns = config.columns;
    this.searchableColumns = config.searchableColumns;
    this.sortableColumns = config.sortableColumns;
    this.filterableColumns = config.filterableColumns;
    this.linked = config.linked;
  }
}