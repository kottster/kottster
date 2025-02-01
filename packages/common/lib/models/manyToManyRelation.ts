export interface ManyToManyRelationConfig {
  relation: 'manyToMany';

  /** Name of the table being referenced/joined */
  targetTable: string;
  
  /** The primary key column in the target table */
  targetTableKeyColumn: string;

  /** Name of the junction/pivot table */
  junctionTable: string;

  /** The foreign key column in the junction table that references the current table */
  junctionTableSourceKeyColumn: string;

  /** The foreign key column in the junction table that references the target table */
  junctionTableTargetKeyColumn: string;
  
  /** Optional array of column names to select from the target table. 
   * If not provided, all columns will be selected */
  columns?: string[];
  
  /** Optional array of column names from the target table that can be used for searching */
  searchableColumns?: string[];
}