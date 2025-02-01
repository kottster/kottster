export interface OneToOneRelationConfig {
  relation: 'oneToOne';

  /** The name of the column in the current table that references the target table's primary key */
  foreignKeyColumn: string;
  
  /** Name of the table being referenced/joined */
  targetTable: string;
  
  /** The foreign key column in the current table that references the target table's primary key */
  targetTableKeyColumn: string;
  
  /** Optional array of column names to select from the target table. 
   * If not provided, all columns will be selected */
  columns?: string[];
  
  /** Optional array of column names from the target table that can be used for searching */
  searchableColumns?: string[];
}