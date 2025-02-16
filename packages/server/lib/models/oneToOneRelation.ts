import { OneToOneRelationConfig } from "@kottster/common";

export class OneToOneRelation implements OneToOneRelationConfig {
  public readonly relation = 'oneToOne';
  public readonly targetTable: string;
  public readonly targetTableKeyColumn: string;
  public readonly foreignKeyColumn: string;
  public readonly previewColumns: string[];
  public readonly columns?: string[];
  public readonly searchableColumns?: string[];
  public readonly sortableColumns?: string[];
  public readonly filterableColumns?: string[];
  public readonly linked?: Record<string, any>;

  constructor(config: Omit<OneToOneRelationConfig, 'relation'>) {
    this.targetTable = config.targetTable;
    this.targetTableKeyColumn = config.targetTableKeyColumn;
    this.foreignKeyColumn = config.foreignKeyColumn;
    this.previewColumns = config.previewColumns;
    this.columns = config.columns;
    this.searchableColumns = config.searchableColumns;
    this.sortableColumns = config.sortableColumns;
    this.filterableColumns = config.filterableColumns;
    this.linked = config.linked;
  }
}
