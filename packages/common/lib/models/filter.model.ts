import { TablePageNestedTableKey } from "./tablePage.model";

export enum FilterItemOperator {
  equal = 'equal',
  notEqual = 'notEqual',
  greaterThan = 'greaterThan',
  lessThan = 'lessThan',
  isNull = 'isNull',
  isNotNull = 'isNotNull',
  isTrue = 'isTrue',
  isFalse = 'isFalse',
  contains = 'contains',
  notContains = 'notContains',
  startsWith = 'startsWith',
  endsWith = 'endsWith',
  between = 'between',
  notBetween = 'notBetween',
  dateEquals = 'dateEquals',
  dateAfter = 'dateAfter',
  dateBefore = 'dateBefore',
  dateBetween = 'dateBetween',
  dateNotBetween = 'dateNotBetween',
}

type EqualFilter = {
  operator: 'equal' | 'notEqual';
  value: string | number | boolean;
}

type NumericFilter = {
  operator: 'greaterThan' | 'lessThan';
  value: number;
}

type NoValueFilter = {
  operator: 'isNull' | 'isNotNull' | 'isTrue' | 'isFalse';
  value?: undefined;
}

type StringFilter = {
  operator: 'contains' | 'notContains' | 'startsWith' | 'endsWith';
  value: string;
}

type RangeFilter = {
  operator: 'between' | 'notBetween';
  value: [number, number];
}

type DateFilter = {
  operator: 'dateEquals' | 'dateAfter' | 'dateBefore';
  value: string;
}

type DateRangeFilter = {
  operator: 'dateBetween' | 'dateNotBetween';
  value: [string, string];
}

export type FilterCondition = 
  | EqualFilter
  | NumericFilter
  | NoValueFilter
  | StringFilter
  | RangeFilter
  | DateFilter
  | DateRangeFilter;

export interface FilterItem {
  column: string;
  operator: FilterCondition['operator'];
  value: FilterCondition extends { operator: infer O, value: infer V } 
    ? (O extends FilterItem['operator'] ? V : undefined) 
    : undefined;
  nestedTableKey?: TablePageNestedTableKey;
}