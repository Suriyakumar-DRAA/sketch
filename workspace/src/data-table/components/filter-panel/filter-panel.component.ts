import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { FilterOption, DataItem, FilterPanelApplyEvent } from '../../interfaces/data-table.interface';
import { GenericDataService } from '../../services/generic-data.service';

/**
* @ignore
*/
@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-panel.component.html',
  styleUrls: ['./filter-panel.component.scss', './../../styles/styles.scss']
})
export class FilterPanelComponent<T extends DataItem = DataItem> implements OnInit, OnDestroy, OnChanges {
  @Input() column!: string;
  @Input() isVisible = false;
  @Input() position = { top: 0, left: 0 };
  @Output() close = new EventEmitter<void>();
  @Output() apply = new EventEmitter<FilterPanelApplyEvent>();

  loading = false;
  filterOptions: FilterOption[] = [];
  searchTerm = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  autoApply = true;
  selectAll = false;
  
  // Text filter properties
  filterMode: 'list' | 'text' = 'list';
  textFilterOperator: 'equals' | 'notEquals' | 'beginsWith' | 'notBeginsWith' | 'endsWith' | 'notEndsWith' | 'contains' | 'notContains' = 'equals';
  textFilterValue = '';
  
  // Number filter properties
  numberFilterOperator: 'equals' | 'notEquals' | 'greaterThan' | 'greaterThanOrEqual' | 'lessThan' | 'lessThanOrEqual' | 'between' | 'top10' | 'bottom10' | 'aboveAverage' | 'belowAverage' = 'equals';
  numberFilterValue: number | null = null;
  numberFilterValue2: number | null = null; // For 'between' operator
  
  // Date filter properties
  dateFilterOperator: 'equals' | 'before' | 'after' | 'between' | 'today' | 'yesterday' | 'tomorrow' | 'thisWeek' | 'lastWeek' | 'nextWeek' | 'thisMonth' | 'lastMonth' | 'nextMonth' | 'thisQuarter' | 'lastQuarter' | 'nextQuarter' | 'thisYear' | 'lastYear' | 'nextYear' | 'yearToDate' | 'allDatesInPeriod' = 'equals';
  dateFilterValue: string | null = null;
  dateFilterValue2: string | null = null; // For 'between' operator

  get dateFilterOperators() {
    return [
      { value: 'equals', label: 'Equals' },
      { value: 'before', label: 'Before' },
      { value: 'after', label: 'After' },
      { value: 'between', label: 'Between' },
      { value: 'today', label: 'Today' },
      { value: 'yesterday', label: 'Yesterday' },
      { value: 'tomorrow', label: 'Tomorrow' },
      { value: 'thisWeek', label: 'This Week' },
      { value: 'lastWeek', label: 'Last Week' },
      { value: 'nextWeek', label: 'Next Week' },
      { value: 'thisMonth', label: 'This Month' },
      { value: 'lastMonth', label: 'Last Month' },
      { value: 'nextMonth', label: 'Next Month' },
      { value: 'thisQuarter', label: 'This Quarter' },
      { value: 'lastQuarter', label: 'Last Quarter' },
      { value: 'nextQuarter', label: 'Next Quarter' },
      { value: 'thisYear', label: 'This Year' },
      { value: 'lastYear', label: 'Last Year' },
      { value: 'nextYear', label: 'Next Year' },
      { value: 'yearToDate', label: 'Year to Date' },
      { value: 'allDatesInPeriod', label: 'All Dates in the Period' }
    ];
  }
  
  private destroy$ = new Subject<void>();

  constructor(private dataService: GenericDataService<T>) {}

  ngOnInit(): void {
    // Get current sort state from data service
    this.dataService.sort$
      .pipe(takeUntil(this.destroy$))
      .subscribe(sort => {
        if (sort && sort.column === this.column) {
          this.sortDirection = sort.direction;
        }
      });
      
    this.loadFilterOptions();
    // Always default to list mode (Choose One)
    this.filterMode = 'list';
  }

  ngOnChanges(): void {
    // Reload options when column changes
    if (this.column) {
      this.loadFilterOptions();
      // Always default to list mode (Choose One)
      this.filterMode = 'list';
    }
  }

  private loadFilterOptions(): void {
    console.log('FilterPanel loadFilterOptions with column:', this.column);
    this.loading = true;
    this.dataService.getFilterOptions(this.column)
      .pipe(takeUntil(this.destroy$))
      .subscribe(options => {
        console.log('FilterPanel received options for column', this.column, ':', options.slice(0, 5));
        this.filterOptions = options.sort((a, b) => {
          if (this.sortDirection === 'asc') {
            return a.value < b.value ? -1 : 1;
          } else {
            return a.value > b.value ? -1 : 1;
          }
        });
        this.updateSelectAllState();
        this.loading = false;
      });
  }

  private checkIfTextColumn(): void {
    // Check if this is a text column that should support text filtering
    const textColumns: string[] = ['name', 'email', 'department', 'location', 'description', 'supplier', 'phone', 'city'];
    const numberColumns: string[] = ['id', 'salary', 'price', 'totalOrders'];
    const dateColumns: string[] = ['joinDate', 'createdDate', 'registrationDate'];
    
    if (textColumns.includes(this.column)) {
      // Keep current mode, but allow switching
    } else if (numberColumns.includes(this.column)) {
      // For number columns, default to number filter mode
      this.filterMode = 'text'; // We'll use 'text' mode for number filters too
    } else if (dateColumns.includes(this.column)) {
      // For date columns, default to date filter mode
      this.filterMode = 'text'; // We'll use 'text' mode for date filters too
    } else {
      // Force list mode for non-text columns
      this.filterMode = 'list';
    }
  }

  get isTextColumn(): boolean {
    // Get column config from data service to check actual column type
    const columns = this.dataService.getColumns();
    const columnConfig = columns.find(col => col.key === this.column);
    return columnConfig?.type === 'text';
  }

  get isNumberColumn(): boolean {
    // Get column config from data service to check actual column type
    const columns = this.dataService.getColumns();
    const columnConfig = columns.find(col => col.key === this.column);
    return columnConfig?.type === 'number';
  }

  get isDateColumn(): boolean {
    // Get column config from data service to check actual column type
    const columns = this.dataService.getColumns();
    const columnConfig = columns.find(col => col.key === this.column);
    return columnConfig?.type === 'date';
  }
  get textFilterOperators() {
    return [
      { value: 'equals', label: 'Equals' },
      { value: 'notEquals', label: 'Does Not Equal' },
      { value: 'beginsWith', label: 'Begins with' },
      { value: 'notBeginsWith', label: 'Does Not Begin with' },
      { value: 'endsWith', label: 'Ends with' },
      { value: 'notEndsWith', label: 'Does Not End with' },
      { value: 'contains', label: 'Contains' },
      { value: 'notContains', label: 'Does Not Contain' }
    ];
  }

  get numberFilterOperators() {
    return [
      { value: 'equals', label: 'Equals' },
      { value: 'notEquals', label: 'Does Not Equal' },
      { value: 'greaterThan', label: 'Greater than' },
      { value: 'greaterThanOrEqual', label: 'Greater than or Equal to' },
      { value: 'lessThan', label: 'Less than' },
      { value: 'lessThanOrEqual', label: 'Less than or Equal to' },
      { value: 'between', label: 'Between' },
      { value: 'top10', label: 'Top 10' },
      { value: 'bottom10', label: 'Bottom 10' },
      { value: 'aboveAverage', label: 'Above Average' },
      { value: 'belowAverage', label: 'Below Average' }
    ];
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filteredOptions(): FilterOption[] {
    if (!this.searchTerm) return this.filterOptions;
    
    // Filter by search term but keep all options visible for multi-select
    const filtered = this.filterOptions.filter(option =>
      option.value.toString().toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    
    return filtered;
  }

  onSortChange(direction: 'asc' | 'desc'): void {
    this.sortDirection = direction;
    console.log('Filter panel sort change:', this.column, direction);
    
    // Apply sorting to the main data table
    this.dataService.setSort(this.column, direction);
    
    // Also sort the filter options for display
    this.filterOptions.sort((a, b) => {
      if (direction === 'asc') {
        return a.value < b.value ? -1 : 1;
      } else {
        return a.value > b.value ? -1 : 1;
      }
    });
  }

  onOptionChange(option: FilterOption): void {
    console.log('Option changed:', option.value, 'selected:', !option.selected);
    option.selected = !option.selected;
    this.updateSelectAllState();
    
    if (this.autoApply) {
      console.log('Auto-applying filter');
      this.applyFilter();
    }
  }

  onSelectAllChange(): void {
    console.log('Select all changed:', this.selectAll);
    const filteredOptions = this.filteredOptions;
    filteredOptions.forEach(option => {
      option.selected = this.selectAll;
    });
    
    if (this.autoApply) {
      console.log('Auto-applying select all filter');
      this.applyFilter();
    }
  }

  onTextFilterChange(): void {
    console.log('Text filter changed:', this.textFilterOperator, this.textFilterValue);
    if (this.autoApply) {
      this.applyFilter();
    }
  }

  onNumberFilterChange(): void {
    console.log('Number filter changed:', this.numberFilterOperator, this.numberFilterValue, this.numberFilterValue2);
    console.log('Column:', this.column, 'Is number column:', this.isNumberColumn);
    if (this.autoApply) {
      this.applyFilter();
    }
  }

  onDateFilterChange(): void {
    console.log('Date filter changed:', this.dateFilterOperator, this.dateFilterValue, this.dateFilterValue2);
    console.log('Column:', this.column, 'Is date column:', this.isDateColumn);
    if (this.autoApply) {
      this.applyFilter();
    }
  }
  switchToListMode(): void {
    this.filterMode = 'list';
    this.textFilterValue = '';
    this.numberFilterValue = null;
    this.numberFilterValue2 = null;
    this.dateFilterValue = null;
    this.dateFilterValue2 = null;
  }

  switchToTextMode(): void {
    this.filterMode = 'text';
    // Clear list selections
    this.filterOptions.forEach(option => option.selected = false);
    this.selectAll = false;
  }
  private updateSelectAllState(): void {
    const filteredOptions = this.filteredOptions;
    this.selectAll = filteredOptions.length > 0 && filteredOptions.every(option => option.selected);
  }

  applyFilter(): void {
    console.log('Apply filter called, mode:', this.filterMode, 'column:', this.column);
    if (this.filterMode === 'list') {
      const selectedValues = this.filterOptions
        .filter(option => option.selected)
        .map(option => option.value);
      
      console.log('Applying list filter with values:', selectedValues);
      this.apply.emit({ values: selectedValues });
    } else if (this.filterMode === 'text' && this.isTextColumn) {
      // Text filter mode for text columns
      if (this.textFilterValue.trim()) {
        console.log('Applying text filter:', this.textFilterOperator, this.textFilterValue);
        this.apply.emit({
          textFilter: {
            operator: this.textFilterOperator,
            value: this.textFilterValue.trim()
          }
        });
      } else {
        console.log('Clearing text filter - empty value');
        this.apply.emit({ values: [] });
      }
    } else if (this.filterMode === 'text' && this.isNumberColumn) {
      // Number filter mode for number columns
      const needsValue = !['top10', 'bottom10', 'aboveAverage', 'belowAverage'].includes(this.numberFilterOperator);
      const needsSecondValue = this.numberFilterOperator === 'between';
      
      if (!needsValue || (this.numberFilterValue !== null && (!needsSecondValue || this.numberFilterValue2 !== null))) {
        const numberFilter: any = {
          operator: this.numberFilterOperator
        };
        
        if (needsValue) {
          const parsedValue = parseFloat(String(this.numberFilterValue));
          if (isNaN(parsedValue)) {
            console.log('Invalid number value:', this.numberFilterValue);
            this.apply.emit({ values: [] });
            return;
          }
          numberFilter.value = parsedValue;
          
          if (needsSecondValue) {
            const parsedValue2 = parseFloat(String(this.numberFilterValue2));
            if (isNaN(parsedValue2)) {
              console.log('Invalid second number value:', this.numberFilterValue2);
              this.apply.emit({ values: [] });
              return;
            }
            numberFilter.value2 = parsedValue2;
          }
        }
        
        console.log('Applying number filter:', numberFilter);
        this.apply.emit({ numberFilter });
      } else {
        console.log('Clearing number filter - insufficient values');
        this.apply.emit({ values: [] });
      }
    } else if (this.filterMode === 'text' && this.isDateColumn) {
      // Date filter mode for date columns
      const needsValue = ['equals', 'before', 'after', 'between'].includes(this.dateFilterOperator);
      const needsSecondValue = this.dateFilterOperator === 'between';
      
      if (!needsValue || (this.dateFilterValue !== null && (!needsSecondValue || this.dateFilterValue2 !== null))) {
        const dateFilter: any = {
          operator: this.dateFilterOperator
        };
        
        if (needsValue) {
          if (!this.dateFilterValue) {
            console.log('Invalid date value:', this.dateFilterValue);
            this.apply.emit({ values: [] });
            return;
          }
          dateFilter.value = this.dateFilterValue;
          
          if (needsSecondValue) {
            if (!this.dateFilterValue2) {
              console.log('Invalid second date value:', this.dateFilterValue2);
              this.apply.emit({ values: [] });
              return;
            }
            dateFilter.value2 = this.dateFilterValue2;
          }
        }
        
        console.log('Applying date filter:', dateFilter);
        this.apply.emit({ dateFilter });
      } else {
        console.log('Clearing date filter - insufficient values');
        this.apply.emit({ values: [] });
      }
    } else {
      console.log('No matching filter mode or column type');
      this.apply.emit({ values: [] });
    }
  }

  clearFilter(): void {
    this.filterOptions.forEach(option => option.selected = false);
    this.selectAll = false;
    this.searchTerm = '';
    this.textFilterValue = '';
    this.numberFilterValue = null;
    this.numberFilterValue2 = null;
    this.dateFilterValue = null;
    this.dateFilterValue2 = null;
    this.apply.emit({ values: [] });
  }

  onClose(): void {
    this.close.emit();
  }

  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-panel')) {
      this.close.emit();
    }
  }
}