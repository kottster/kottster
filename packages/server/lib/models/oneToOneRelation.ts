import { OneToOneRelationConfig } from "@kottster/common";

export class OneToOneRelation implements OneToOneRelationConfig {
  public readonly relation = 'oneToOne';
  public readonly targetTable: string;
  public readonly targetTableKeyColumn: string;
  public readonly foreignKeyColumn: string;
  public readonly columns: string[];
  public readonly searchableColumns: string[];

  constructor(config: Omit<OneToOneRelationConfig, 'relation'>) {
    this.targetTable = config.targetTable;
    this.targetTableKeyColumn = config.targetTableKeyColumn;
    this.foreignKeyColumn = config.foreignKeyColumn;
    this.columns = config.columns ?? [];
    this.searchableColumns = config.searchableColumns ?? [];
  }
}
