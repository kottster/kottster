import { ManyToManyRelationConfig } from "@kottster/common";

export class ManyToManyRelation implements ManyToManyRelationConfig {
  public readonly relation = 'manyToMany';
  public readonly targetTable: string;
  public readonly targetTableKeyColumn: string;
  public readonly junctionTable: string;
  public readonly junctionTableSourceKeyColumn: string;
  public readonly junctionTableTargetKeyColumn: string;
  public readonly previewColumns: string[];
  public readonly columns?: string[];
  public readonly searchableColumns?: string[];
  public readonly sortableColumns?: string[];
  public readonly filterableColumns?: string[];
  public readonly linked?: Record<string, any>;

  constructor(config: Omit<ManyToManyRelationConfig, 'relation'>) {
    this.targetTable = config.targetTable;
    this.targetTableKeyColumn = config.targetTableKeyColumn;
    this.junctionTable = config.junctionTable;
    this.junctionTableSourceKeyColumn = config.junctionTableSourceKeyColumn;
    this.junctionTableTargetKeyColumn = config.junctionTableTargetKeyColumn;
    this.previewColumns = config.previewColumns;
    this.columns = config.columns;
    this.searchableColumns = config.searchableColumns;
    this.sortableColumns = config.sortableColumns;
    this.filterableColumns = config.filterableColumns;
    this.linked = config.linked;
  }
}