import { OneToManyRelationConfig } from "@kottster/common";

export class OneToManyRelation implements OneToManyRelationConfig {
  public readonly relation = 'oneToMany';
  public readonly targetTable: string;
  public readonly targetTableKeyColumn: string;
  public readonly targetTableForeignKeyColumn: string;
  public readonly linked?: Record<string, any>;

  constructor(config: Omit<OneToManyRelationConfig, 'relation'>) {
    this.targetTable = config.targetTable;
    this.targetTableKeyColumn = config.targetTableKeyColumn;
    this.targetTableForeignKeyColumn = config.targetTableForeignKeyColumn;
    this.linked = config.linked;
  }
}