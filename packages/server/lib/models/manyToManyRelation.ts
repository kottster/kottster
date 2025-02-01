import { ManyToManyRelationConfig } from "@kottster/common";

export class ManyToManyRelation implements ManyToManyRelationConfig {
  public readonly relation = 'manyToMany';
  public readonly targetTable: string;
  public readonly targetTableKeyColumn: string;
  public readonly junctionTable: string;
  public readonly junctionTableSourceKeyColumn: string;
  public readonly junctionTableTargetKeyColumn: string;
  public readonly columns: string[];
  public readonly searchableColumns: string[];

  constructor(config: Omit<ManyToManyRelationConfig, 'relation'>) {
    this.targetTable = config.targetTable;
    this.targetTableKeyColumn = config.targetTableKeyColumn;
    this.junctionTable = config.junctionTable;
    this.junctionTableSourceKeyColumn = config.junctionTableSourceKeyColumn;
    this.junctionTableTargetKeyColumn = config.junctionTableTargetKeyColumn;
    this.columns = config.columns ?? [];
    this.searchableColumns = config.searchableColumns ?? [];
  }
}