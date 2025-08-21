import { Component, OnInit, OnDestroy, HostListener, ViewEncapsulation, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, combineLatest, debounceTime, distinctUntilChanged, retry, take } from 'rxjs';
import { ThemeService } from '../services/theme.service';
import { ColumnConfig, PaginationConfig, FilterPanelApplyEvent, FilterConfig, SortConfig, DataItem } from '../interfaces/data-table.interface';
import { ColumnHeaderComponent } from './column-header/column-header.component';
import { FilterPanelComponent } from './filter-panel/filter-panel.component';
import { PaginationComponent } from './pagination/pagination.component';
import { SettingsComponent } from './settings/settings.component';
import { DEFAULT_FORMATS } from './../utils/constants'
import { GenericDataService } from '../services/generic-data.service';

/**
 * @component
 * @name DataTable
 * @description
 * A highly configurable, generic Angular data table component supporting sorting, filtering (Excel-style), pagination, column visibility, and custom formatting.
 * 
 * @typeparam T - The type of data item displayed in the table. Defaults to `DataItem`.
 * 
 * @example
 * <data-table [data]="myData" [columns]="myColumns"></data-table>
 * 
 * @inputs
 * @param {T[]} data - The array of data items to display in the table.
 * @param {ColumnConfig[]} columns - The configuration for each column, including type, formatting, and filtering options.
 * 
 * @outputs
 * @event rowClick - Emits the row data when a row is clicked.
 * @event columnClick - Emits an object containing the row and column configuration when a column cell is clicked.
 * 
 * @usageNotes
 * - Supports Excel-style filtering, multi-type column formatting, and dynamic column visibility.
 * - Integrates with a `GenericDataService` for data operations (filtering, sorting, pagination).
 * - Use `onRowClick` and `onColumnClick` to handle user interactions.
 * - Use `clearAllFilters()` to reset all filters and search.
 * 
 * @see ColumnConfig
 * @see FilterConfig
 * @see SortConfig
 * @see PaginationConfig
 * 
 * @author
 * @since 1.0.0
 */
@Component({
  selector: 'data-table',
  /**
  * @ignore
  */
  imports: [
    CommonModule,
    FormsModule,
    ColumnHeaderComponent,
    FilterPanelComponent,
    PaginationComponent,
    SettingsComponent,
  ],
  /**
  * @ignore
  */
  providers: [
    DecimalPipe,
    CurrencyPipe,
  ],
  templateUrl: './data-table.html',

  styleUrls: ['./data-table.scss', './../styles/styles.scss'],
})
export class DataTable<T extends DataItem = DataItem> implements OnInit, OnDestroy {
  @Input() data: T[] = [];
  @Input() columns: ColumnConfig[] = [];

  @Output() rowClick = new EventEmitter<any>();
  @Output() columnClick = new EventEmitter<{ row: any; column: ColumnConfig }>();
  @Output() exportData = new EventEmitter<{ row: any; column: ColumnConfig }>();

  /**
  * @ignore
  */
  visibleColumns = new Set<string>();
  /**
  * @ignore
  */
  displayColumns: ColumnConfig[] = [];
  /**
  * @ignore
  */
  totalRecords = 0;
  /**
  * @ignore
  */
  filteredRecords = 0;
  /**
  * @ignore
  */
  excelFiltersEnabled = true;
  /**
  * @ignore
  */
  searchTerm = '';

  /**
  * @ignore
  */
  displayData: T[] = [];
  /**
  * @ignore
  */
  sortConfig: SortConfig | null = null;
  /**
  * @ignore
  */
  paginationConfig: PaginationConfig = {
    currentPage: 1,
    pageSize: 25,
    totalRecords: 0
  };

  /**
  * @ignore
  */
  activeFilters = new Map<string, FilterConfig>();
  /**
  * @ignore
  */
  activeFiltersArray: { column: string, config: FilterConfig }[] = [];

  // Filter Panel State
  /**
  * @ignore
  */
  filterPanelVisible = false;
  /**
  * @ignore
  */
  filterPanelColumn: string | null = null;
  /**
  * @ignore
  */
  filterPanelPosition = { top: 0, left: 0 };
  /**
  * @ignore
  */
  private searchSubject = new Subject<string>();
  /**
  * @ignore
  */
  private destroy$ = new Subject<void>();
  /**
   * @ignore
   */
  public settingsVisible = false;
  /**
   * @ignore
   */
  public showTotals = false;

  constructor(
    private dataService: GenericDataService<T>,
    private themeService: ThemeService,
    private decimalPipe: DecimalPipe,
  ) { }

  ngOnInit(): void {
    this.themeService.initializeTheme();
    this.setupSubscriptions();
    this.initializeData(this.data);
  }

  /**
  * @ignore
  */
  async ngOnChanges() {
    // Reinitialize when input data changes (important for API data loading)
    if (this.data && this.columns) {
      // console.time("forLoopTime");
      // const formattedData = await this.bindData(this.data);
      // console.timeEnd("forLoopTime");
      this.initializeData(this.data);
    }
  }

  /**
  * @ignore
  */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
  * @ignore
  */
  private initializeData(formattedData: T[]): void {
    if (formattedData.length > 0 && this.columns.length > 0) {
      // Initialize all columns as visible by default
      this.visibleColumns = new Set(this.columns.map(c => c.key));
      this.updateDisplayColumns();

      // Clear any existing filters and state
      this.dataService.clearAllFilters();
      this.searchTerm = '';
      this.dataService.setSearch('');

      // Initialize with new data
      this.dataService.initialize(formattedData, this.columns);
      this.totalRecords = this.dataService.getTotalRecords();
    }
  }

  /**
  * @ignore
  */
  private updateDisplayColumns(): void {
    this.displayColumns = this.columns.filter(column => this.visibleColumns.has(column.key));
  }

  /**
  * @ignore
  */
  private setupSubscriptions(): void {
    // Setup debounced search
    this.searchSubject.pipe(
      debounceTime(300), // Wait 300ms after user stops typing
      distinctUntilChanged(), // Only emit if value actually changed
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.dataService.setSearch(searchTerm);
    });

    // Subscribe to paginated data
    this.dataService.paginatedData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.displayData = data;
      });

    // Subscribe to filtered data to get count
    this.dataService.filteredData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.filteredRecords = data.length;
      });

    // Subscribe to sort changes
    this.dataService.sort$
      .pipe(takeUntil(this.destroy$))
      .subscribe(sort => {
        this.sortConfig = sort;
      });

    // Subscribe to pagination changes
    this.dataService.pagination$
      .pipe(takeUntil(this.destroy$))
      .subscribe(pagination => {
        this.paginationConfig = pagination;
      });

    // Subscribe to active filters
    this.dataService.getActiveFilters()
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.activeFilters = filters;
        this.activeFiltersArray = Array.from(filters.entries()).map(([column, config]) => ({ column, config }));
      });
  }

  /**
  * @ignore
  */
  onSort(event: { column: string, direction: 'asc' | 'desc' }): void {
    this.dataService.setSort(event.column, event.direction);
  }

  /**
  * @ignore
  */
  onFilter(event: { column: string, event: MouseEvent }): void {
    if (!this.excelFiltersEnabled) return;

    console.log('onFilter called with column:', event.column);

    const rect = (event.event.target as HTMLElement).getBoundingClientRect();
    const columnIndex = this.columns.findIndex(col => col.key === event.column);
    const isLastTwoColumns = columnIndex >= this.columns.length - 2;

    // Calculate position relative to viewport, not accounting for scroll
    // since we're using fixed positioning

    this.filterPanelPosition = {
      top: rect.bottom + 5,
      left: isLastTwoColumns
        ? rect.right - 320  // 320px is the filter panel width
        : rect.left
    };

    this.filterPanelColumn = event.column;
    console.log('Setting filterPanelColumn to:', this.filterPanelColumn);
    this.filterPanelVisible = true;
  }
  /**
  * @ignore
  */
  onFilterApply(filterData: FilterPanelApplyEvent): void {
    if (this.filterPanelColumn) {
      console.log('Filter apply called with:', filterData);
      this.dataService.setFilterWithConfig(this.filterPanelColumn, filterData);
    }
  }

  /**
  * @ignore
  */
  onFilterClose(): void {
    this.filterPanelVisible = false;
    this.filterPanelColumn = null;
  }

  /**
  * @ignore
  */
  hasActiveFilter(column: string): boolean {
    return this.activeFilters.has(column);
  }

  /**
  * @ignore
  */
  onPageChange(page: number): void {
    this.dataService.setPagination({ currentPage: page });
  }

  /**
  * @ignore
  */
  onPageSizeChange(pageSize: number): void {
    // If "All" is selected (pageSize = -1), set currentPage to 1
    this.dataService.setPagination({
      pageSize,
      currentPage: 1
    });
  }

  /**
  * @ignore
  */
  onGoToPage(page: number): void {
    this.dataService.setPagination({ currentPage: page });
  }
  /**
  * @ignore
  */
  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  /**
  * @ignore
  */
  clearAllFilters(): void {
    this.dataService.clearAllFilters();
    this.searchTerm = '';
    this.dataService.setSearch('');
  }

  /**
  * @ignore
  */
  toggleExcelFilters(): void {
    if (!this.excelFiltersEnabled) {
      this.filterPanelVisible = false;
    }
  }

  /**
  * @ignore
  */
  removeFilter(column: string): void {
    this.dataService.setFilter(column, []);
  }


  /**
  * @ignore
  */
  getFilterLabel(column: string): string {
    const config = this.activeFilters.get(column);
    if (!config) return '';

    const columnLabel = this.columns.find(c => c.key === column)?.label || column;

    if (config.filterType === 'text' && config.textFilter) {
      const operatorLabel = this.getTextFilterOperatorLabel(config.textFilter.operator);
      return `${columnLabel}: ${operatorLabel} "${config.textFilter.value}"`;
    } else if (config.filterType === 'number' && config.numberFilter) {
      const operatorLabel = this.getNumberFilterOperatorLabel(config.numberFilter.operator);
      if (['top10', 'bottom10', 'aboveAverage', 'belowAverage'].includes(config.numberFilter.operator)) {
        return `${columnLabel}: ${operatorLabel}`;
      } else if (config.numberFilter.operator === 'between') {
        return `${columnLabel}: ${operatorLabel} ${config.numberFilter.value} and ${config.numberFilter.value2}`;
      } else {
        return `${columnLabel}: ${operatorLabel} ${config.numberFilter.value}`;
      }
    } else if (config.filterType === 'date' && config.dateFilter) {
      const operatorLabel = this.getDateFilterOperatorLabel(config.dateFilter.operator);
      if (['today', 'yesterday', 'tomorrow', 'thisWeek', 'lastWeek', 'nextWeek', 'thisMonth', 'lastMonth', 'nextMonth', 'thisQuarter', 'lastQuarter', 'nextQuarter', 'thisYear', 'lastYear', 'nextYear', 'yearToDate', 'allDatesInPeriod'].includes(config.dateFilter.operator)) {
        return `${columnLabel}: ${operatorLabel}`;
      } else if (config.dateFilter.operator === 'between') {
        return `${columnLabel}: ${operatorLabel} ${config.dateFilter.value} and ${config.dateFilter.value2}`;
      } else {
        return `${columnLabel}: ${operatorLabel} ${config.dateFilter.value}`;
      }
    } else {
      const count = config.values?.length || 0;
      return `${columnLabel} ${count} selected`;
    }
  }

  /**
  * @ignore
  */
  private getTextFilterOperatorLabel(operator: string): string {
    const operators: { [key: string]: string } = {
      'equals': 'Equals',
      'notEquals': 'Does Not Equal',
      'beginsWith': 'Begins with',
      'notBeginsWith': 'Does Not Begin with',
      'endsWith': 'Ends with',
      'notEndsWith': 'Does Not End with',
      'contains': 'Contains',
      'notContains': 'Does Not Contain'
    };
    return operators[operator] || operator;
  }

  /**
  * @ignore
  */
  private getNumberFilterOperatorLabel(operator: string): string {
    const operators: { [key: string]: string } = {
      'equals': 'Equals',
      'notEquals': 'Does Not Equal',
      'greaterThan': 'Greater than',
      'greaterThanOrEqual': 'Greater than or Equal to',
      'lessThan': 'Less than',
      'lessThanOrEqual': 'Less than or Equal to',
      'between': 'Between',
      'top10': 'Top 10',
      'bottom10': 'Bottom 10',
      'aboveAverage': 'Above Average',
      'belowAverage': 'Below Average'
    };
    return operators[operator] || operator;
  }

  /**
  * @ignore
  */
  private getDateFilterOperatorLabel(operator: string): string {
    const operators: { [key: string]: string } = {
      'equals': 'Equals',
      'before': 'Before',
      'after': 'After',
      'between': 'Between',
      'today': 'Today',
      'yesterday': 'Yesterday',
      'tomorrow': 'Tomorrow',
      'thisWeek': 'This Week',
      'lastWeek': 'Last Week',
      'nextWeek': 'Next Week',
      'thisMonth': 'This Month',
      'lastMonth': 'Last Month',
      'nextMonth': 'Next Month',
      'thisQuarter': 'This Quarter',
      'lastQuarter': 'Last Quarter',
      'nextQuarter': 'Next Quarter',
      'thisYear': 'This Year',
      'lastYear': 'Last Year',
      'nextYear': 'Next Year',
      'yearToDate': 'Year to Date',
      'allDatesInPeriod': 'All Dates in the Period'
    };
    return operators[operator] || operator;
  }

  // private async bindData(data: T[]): Promise<T[]> {
  //   if (!data || data.length === 0) {
  //     return [];
  //   }
  //   const result = [];
  //   for (const row of data) {
  //     const formattedRow: any = { ...row };
  //     for (const column of this.columns) {
  //       formattedRow[column.key] = this.formatCellValue(row, column);
  //     }
  //     result.push(formattedRow);
  //   }
  //   return result;
  // }

  /**
  * @ignore
  */
  private async bindData(data: T[]): Promise<T[]> {
    if (!data?.length) return [];

    // Prepare formatters once per column
    const formatters = this.columns.map((column: any) => {
      const { type, format = '', symbol = '', digit = 0 } = column;

      if (type === 'currency') {
        const defaultFormat = format || DEFAULT_FORMATS.currency;
        const [locale, currency] = this.getCurrencyFormat(defaultFormat);
        const options: Intl.NumberFormatOptions = symbol
          ? { style: 'currency', currency, maximumFractionDigits: digit }
          : { style: 'decimal', maximumFractionDigits: digit };
        const formatter = new Intl.NumberFormat(locale, options);
        return (val: any) => formatter.format(val);
      }

      if (type === 'number') {
        return (val: any) =>
          digit > 0
            ? this.decimalPipe.transform(val, `1.${digit}-${digit}`) || ''
            : typeof val === 'number'
              ? val.toLocaleString()
              : val.toString();
      }

      if (type === 'date') {
        const dateFormat = format || DEFAULT_FORMATS.date;
        return (val: any) => formatDate(val, dateFormat, 'en-IN');
      }

      if (type === 'boolean') {
        return (val: any) => (val ? '✓' : '✗');
      }

      return (val: any) => (val !== null && val !== undefined ? val.toString() : '');
    });

    const result: T[] = new Array(data.length);

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const formatYestedRow: any = {};

      for (let j = 0; j < this.columns.length; j++) {
        const col = this.columns[j];
        const rawValue = row[col.key];
        formatYestedRow[col.key] = formatters[j](rawValue);
      }

      result[i] = formatYestedRow;
    }

    return result;
  }
  /**
  * @ignore
  */
  getHighlightClass(value: any, column: ColumnConfig, row?: any): string {
    const config = column.highlightColumn;
    if (!config) return '';
    if (config.getClassFn) return config.getClassFn(value, row);
    if (config.classMap) return config.classMap[value] || '';
    return '';
  }

  /**
  * @ignore
  */
  getFormattedCell(row: any, column: ColumnConfig): string {
    const rawValue = row[column.key];
    const formatted = this.formatCellValue(row, column);
    return this.searchTerm ? this.highlightSearchTerm(formatted) : formatted;
  }

  /**
  * @ignore
  */
  /**
    * Formats the cell value based on its type and any specified format.
    * @param row The data row containing the value.
    * @param column The column configuration defining how to format the value.
    * @returns The formatted cell value as a string.
    */
  formatCellValue(row: any, column: ColumnConfig): string {
    const value = row[column.key];
    const type = column.type;
    const format = (column as any).format || '';
    const symbol = (column as any).symbol || '';
    const digit = (column as any).digit || 0;
    const link = (column as any).link;

    if (column.displayDataFn) return column.displayDataFn(row);

    if (value === null || value === undefined) {
      return '';
    }
    switch (type) {
      case 'date':
        const dateFormat = format ? format : DEFAULT_FORMATS.date;
        return formatDate(value, dateFormat, 'en-IN');
      case 'currency':
        const defaultFormat = format ? format : DEFAULT_FORMATS.currency;
        const [locale, currencyFormat] = this.getCurrencyFormat(defaultFormat);
        const options: Intl.NumberFormatOptions = {
          style: 'decimal',
          maximumFractionDigits: digit
        };
        if (symbol) {
          options['style'] = 'currency';
          options['currency'] = currencyFormat;
        }
        return new Intl.NumberFormat(locale, options).format(value);
      case 'number':
        if (digit > 0) {
          return this.decimalPipe.transform(value, `1.${digit}-${digit}`) || '';
        }
        return typeof value === 'number' ? value.toLocaleString() : value.toString();
      case 'boolean':
        return value ? '✓' : '✗';
      default:
        return value.toString();
    }
  }

  /**
  * @ignore
  */
  private getCurrencyFormat(format: string): [string, string] {
    switch (format) {
      case 'USD':
        return ['en-US', 'USD'];
      case 'INR':
        return ['en-IN', 'INR'];
      case 'EUR':
        return ['de-DE', 'EUR'];
      default:
        return ['', ''];
    }
  }

  /**
  * @ignore
  */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-panel') && !target.closest('[data-filter-trigger]')) {
      this.filterPanelVisible = false;
    }
  }
  /**
  * @ignore
  */
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (this.filterPanelVisible) {
      this.filterPanelVisible = false;
    }
  }

  /**
  * @ignore
  */
  @HostListener('document:scroll', [])
  onDocumentScroll(): void {
    if (this.filterPanelVisible) {
      this.filterPanelVisible = false;
    }
  }

  /**
  * @ignore
  */
  hasActiveFiltersOrSearch(): boolean {
    return this.activeFilters.size > 0 || this.searchTerm.trim() !== '';
  }

  /**
  * @ignore
  */
  hasActiveFilters(): boolean {
    // Check if any filters are actually active (not just empty filter configs)
    for (const [column, config] of this.activeFilters) {
      if (config.filterType === 'text' && config.textFilter) {
        return true;
      } else if (config.filterType === 'number' && config.numberFilter) {
        return true;
      } else if (config.filterType === 'date' && config.dateFilter) {
        return true;
      } else if (config.filterType === 'list' && config.values && config.values.length > 0) {
        return true;
      }
    }
    return false;
  }

  /**
  * @ignore
  */
  highlightSearchTerm(text: string): string {
    if (!this.searchTerm || !this.searchTerm.trim()) {
      return text;
    }

    const searchTerm = this.searchTerm.trim();

    // Simple case-insensitive replacement for better performance
    const lowerText = text.toLowerCase();
    const lowerSearch = searchTerm.toLowerCase();

    if (!lowerText.includes(lowerSearch)) {
      return text;
    }

    // Find all matches and replace them
    let result = '';
    let lastIndex = 0;
    let index = lowerText.indexOf(lowerSearch);

    while (index !== -1) {
      // Add text before match
      result += text.substring(lastIndex, index);
      // Add highlighted match
      result += `<mark class="search-highlight">${text.substring(index, index + searchTerm.length)}</mark>`;
      lastIndex = index + searchTerm.length;
      index = lowerText.indexOf(lowerSearch, lastIndex);
    }

    // Add remaining text
    result += text.substring(lastIndex);
    return result;
  }

  /**
  * @ignore
  */
  getSortDirection(column: string): 'asc' | 'desc' | null {
    if (this.sortConfig && this.sortConfig.column === column) {
      return this.sortConfig.direction;
    }
    return null;
  }

  /**
  * @ignore
  */
  onColumnVisibilityChange(event: { column: string, visible: boolean }): void {
    if (event.visible) {
      this.visibleColumns.add(event.column);
    } else {
      this.visibleColumns.delete(event.column);
    }
    this.updateDisplayColumns();
  }

  /**
  * @ignore
  */
  onRowClick(row: any): void {
    this.rowClick.emit(row);
  }

  /**
  * @ignore
  */
  onColumnClick(event: MouseEvent, row: any, column: ColumnConfig): void {
    event.stopPropagation(); // prevent rowClick
    this.columnClick.emit({ row, column });
  }

  onTotalChange(showTotals: boolean): void {
    this.showTotals = showTotals;
  }

  onSettings() {
    this.settingsVisible = !this.settingsVisible;
  }

  onColumnsChange(event: { column: string, visible: boolean }): void {
    if (event.visible) {
      this.visibleColumns.add(event.column);
    } else {
      this.visibleColumns.delete(event.column);
    }
    this.updateDisplayColumns();
  }

  onClose() {
    this.settingsVisible = false;
  }

  getColumnValue(row: any, columnKey: string): any {
    console.log(`Getting value for key: ${columnKey} from row:`, row);

    // Handle nested keys like "address.city"
    if (columnKey.includes('.')) {
      const keys = columnKey.split('.');
      let value = row;
      for (const key of keys) {
        if (value === null || value === undefined) return null;
        value = value[key];
      }
      console.log(`Nested value for ${columnKey}:`, value);
      return value;
    }
    // Handle direct keys
    const directValue = row[columnKey];
    console.log(`Direct value for ${columnKey}:`, directValue);
    return directValue;
  }

  calculateColumnTotal(columnKey: string): number {
    if (!this.displayData || this.displayData.length === 0) return 0;

    const column = this.columns.find(col => col.key === columnKey);
    if (!column || (column.type !== 'number' && column.type !== 'currency')) return 0;

    // Get all filtered data, not just current page
    let filteredData: T[] = [];
    this.dataService.filteredData$.pipe(take(1)).subscribe(data => {
      filteredData = data;
    });

    return filteredData.reduce((sum, row) => {
      // const value = this.getColumnValue(row, columnKey);
      const value = row[columnKey];
      const numValue = Number(value);
      return sum + (isNaN(numValue) ? 0 : numValue);
    }, 0);
  }

  calculateColumnGrandTotal(columnKey: string): number {
    const column = this.columns.find(col => col.key === columnKey);
    if (!column || (column.type !== 'number' && column.type !== 'currency')) return 0;

    // Calculate from original data (no filters applied)
    return this.data.reduce((sum, row) => {
      // const value = this.getColumnValue(row, columnKey);
      const value = row[columnKey];
      const numValue = Number(value);
      return sum + (isNaN(numValue) ? 0 : numValue);
    }, 0);
  }
}
