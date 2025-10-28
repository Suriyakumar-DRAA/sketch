import { TemplateRef } from "@angular/core";

/**
 * Supported date display formats.
 */
export type DateFormat = 'dd/MM/yyyy' | 'dd-MMM-yyyy' | 'HH:mm:ss a' | 'dd-MMM-yyyy hh:mm:ss a';

/**
 * Supported currency display formats.
 */
export type CurrencyFormat = 'USD' | 'INR' | 'EUR';

/**
 * Supported Angular decimal pipe formats.
 */
export type DecimalFormat = '1.0-0' | '1.0-2' | '1.2-2' | '1.2-3';

/**
 * Link column configuration.
 */
export interface LinkFormat {
  /** Data key for static URL value. */
  staticUrl?: string;
  /**
   * Function to dynamically construct the URL based on the cell value and row data.
   * Overrides `hrefKey` if provided.
   *
   * @param value - The raw cell value for this column.
   * @param row - The entire row data object.
   * @returns A complete URL string.
   */
  getUrlFn?: (value: any, row?: any) => string;
  /** Link target behavior. */
  target?: '_blank' | '_self' | '_parent' | '_top';
}

/**
 * Highlight column configuration for conditional styling.
 */
export interface HighlightColumn {
  /** Type of highlight display. */
  type?: 'badge' | 'text';
  /** Static class mapping based on cell value. */
  classMap?: { [key: string]: string };
  /** Function to dynamically determine CSS class based on value and row data. */
  getClassFn?: (value: any, row?: any) => ('badge badge-light-success' | 'badge badge-light-warning' | 'badge badge-light-danger' | 'badge badge-light-secondary' | 'badge badge-light');
}

/**
 * Generic row data item representation.
 */
export interface DataItem {
  [key: string]: any;
}

/**
 * Text filter configuration.
 */
export interface TextFilter {
  operator: 'equals' | 'notEquals' | 'beginsWith' | 'notBeginsWith' | 'endsWith' | 'notEndsWith' | 'contains' | 'notContains';
  value: string;
}

/**
 * Number filter configuration.
 */
export interface NumberFilter {
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'greaterThanOrEqual' | 'lessThan' | 'lessThanOrEqual' | 'between' | 'top10' | 'bottom10' | 'aboveAverage' | 'belowAverage';
  value?: number;
  value2?: number;
}

/**
 * Date filter configuration.
 */
export interface DateFilter {
  operator: 'equals' | 'before' | 'after' | 'between' | 'today' | 'yesterday' | 'tomorrow' | 'thisWeek' | 'lastWeek' | 'nextWeek' | 'thisMonth' | 'lastMonth' | 'nextMonth' | 'thisQuarter' | 'lastQuarter' | 'nextQuarter' | 'thisYear' | 'lastYear' | 'nextYear' | 'yearToDate' | 'allDatesInPeriod';
  value?: string;
  value2?: string;
}

/**
 * Filter option for list-based filters.
 */
export interface FilterOption {
  key: string;
  value: any;
  count: number;
  selected: boolean;
}

/**
 * Base column configuration shared by all column types.
 */
export interface BaseColumnConfig {
  key: string;
  label: string;
  columnClass?: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  link?: LinkFormat;
  highlightColumn?: HighlightColumn;
  template?: TemplateRef<any>;
  /** Function to transform cell data before display. */
  displayDataFn?: (value: any, row?: any) => string;
  showColumn?: boolean; 
  mergeRows?: boolean;
}

/**
 * Configuration for text columns.
 */
export interface TextColumnConfig extends BaseColumnConfig {
  type: 'text';
  format?: string;
}

/**
 * Configuration for number columns.
 */
export interface NumberColumnConfig extends BaseColumnConfig {
  type: 'number';
  digit?: number;
}

/**
 * Configuration for boolean columns.
 */
export interface BooleanColumnConfig extends BaseColumnConfig {
  type: 'boolean';
}

/**
 * Configuration for currency columns.
 */
export interface CurrencyColumnConfig extends BaseColumnConfig {
  type: 'currency';
  /** Whether to display the currency symbol. */
  symbol?: boolean;
  format?: CurrencyFormat;
  digit?: number;
}

/**
 * Configuration for date columns.
 */
interface DateColumnConfig extends BaseColumnConfig {
  type: 'date';
  format?: DateFormat;
}

/**
 * Main column configuration type.
 */
export type ColumnConfig =
  | TextColumnConfig
  | NumberColumnConfig
  | BooleanColumnConfig
  | CurrencyColumnConfig
  | DateColumnConfig;

/**
 * Table sorting configuration.
 */
export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

/**
 * Table filtering configuration.
 */
export interface FilterConfig {
  column: string;
  values: any[];
  searchTerm?: string;
  filterType?: 'list' | 'text' | 'number' | 'date';
  textFilter?: TextFilter;
  numberFilter?: NumberFilter;
  dateFilter?: DateFilter;
}

/**
 * Pagination configuration.
 */
export interface PaginationConfig {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
}

/**
 * Event data for applying filter panel selections.
 */
export interface FilterPanelApplyEvent {
  values?: any[];
  textFilter?: {
    operator: 'equals' | 'notEquals' | 'beginsWith' | 'notBeginsWith' | 'endsWith' | 'notEndsWith' | 'contains' | 'notContains';
    value: string;
  };
  numberFilter?: {
    operator: 'equals' | 'notEquals' | 'greaterThan' | 'greaterThanOrEqual' | 'lessThan' | 'lessThanOrEqual' | 'between' | 'top10' | 'bottom10' | 'aboveAverage' | 'belowAverage';
    value?: number;
    value2?: number;
  };
  dateFilter?: {
    operator: 'equals' | 'before' | 'after' | 'between' | 'today' | 'yesterday' | 'tomorrow' | 'thisWeek' | 'lastWeek' | 'nextWeek' | 'thisMonth' | 'lastMonth' | 'nextMonth' | 'thisQuarter' | 'lastQuarter' | 'nextQuarter' | 'thisYear' | 'lastYear' | 'nextYear' | 'yearToDate' | 'allDatesInPeriod';
    value?: string;
    value2?: string;
  };
}
