import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataItem, FilterConfig, SortConfig, PaginationConfig, FilterOption, ColumnConfig } from '../interfaces/data-table.interface';

// Utility function for date validation
function isDateValue(value: any): boolean {
  if (!value) return false;
  const dateStr = String(value);
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/,                      // YYYY-MM-DD
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,    // ISO datetime
    /^\d{2}\/\d{2}\/\d{4}$/,                    // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/,                      // MM-DD-YYYY
    /^\d{2}\/\d{2}\/\d{4}$/,                    // dd/MM/yyyy
    /^\d{2}-[A-Za-z]{3}-\d{4}$/,                // dd-MMM-yyyy
    /^\d{2}:[0-5]\d:[0-5]\d [APap][Mm]$/,       // HH:mm:ss a
    /^\d{2}-[A-Za-z]{3}-\d{4} \d{2}:\d{2}:\d{2} [APap][Mm]$/ // dd-MMM-yyyy hh:mm:ss a
  ];
  return datePatterns.some(pattern => pattern.test(dateStr)) || !isNaN(Date.parse(dateStr));
}

@Injectable({
  providedIn: 'root'
})
export class GenericDataService<T extends DataItem> {
  private originalData: T[] = [];
  private columns: ColumnConfig[] = [];
  
  private filtersSubject = new BehaviorSubject<Map<string, FilterConfig>>(new Map());
  private sortSubject = new BehaviorSubject<SortConfig | null>(null);
  private paginationSubject = new BehaviorSubject<PaginationConfig>({
    currentPage: 1,
    pageSize: 25,
    totalRecords: 0
  });
  private searchSubject = new BehaviorSubject<string>('');

  public filters$ = this.filtersSubject.asObservable();
  public sort$ = this.sortSubject.asObservable();
  public pagination$ = this.paginationSubject.asObservable();
  public search$ = this.searchSubject.asObservable();

  public filteredData$: Observable<T[]> = combineLatest([
    this.filters$,
    this.sort$,
    this.search$
  ]).pipe(
    map(([filters, sort, search]) => {
      let data = [...this.originalData];

      // Apply global search
      if (search) {
        const searchLower = search.toLowerCase();
        const isNumericSearch = /^\d+$/.test(search);
        
        data = data.filter(item => {
          // Check each field for search term
          for (const [key, value] of Object.entries(item)) {
            if (value === null || value === undefined) continue;
            
            let stringValue: string;
            
            // Handle nested objects and arrays
            if (typeof value === 'object') {
              stringValue = JSON.stringify(value).toLowerCase();
            } else {
              stringValue = String(value).toLowerCase();
            }
            
            // Quick numeric search
            if (isNumericSearch && stringValue.includes(search)) {
              return true;
            }
            
            // Text search
            if (stringValue.includes(searchLower)) {
              return true;
            }
            
            // Boolean field search
            if (typeof value === 'boolean') {
              if ((value && (searchLower === 'true' || searchLower === 'active' || searchLower === '✓')) ||
                  (!value && (searchLower === 'false' || searchLower === 'inactive' || searchLower === '✗'))) {
                return true;
              }
            }
          }
          return false;
        });
      }

      // Apply filters
      filters.forEach((filter, column) => {
        if (filter.filterType === 'text' && filter.textFilter) {
          data = data.filter(item => {
            const value = String(item[column]).toLowerCase();
            const filterValue = filter.textFilter!.value.toLowerCase();
            
            switch (filter.textFilter!.operator) {
              case 'equals': return value === filterValue;
              case 'notEquals': return value !== filterValue;
              case 'beginsWith': return value.startsWith(filterValue);
              case 'notBeginsWith': return !value.startsWith(filterValue);
              case 'endsWith': return value.endsWith(filterValue);
              case 'notEndsWith': return !value.endsWith(filterValue);
              case 'contains': return value.includes(filterValue);
              case 'notContains': return !value.includes(filterValue);
              default: return true;
            }
          });
        } else if (filter.filterType === 'number' && filter.numberFilter) {
          data = data.filter(item => {
            const rawValue = this.getNestedValue(item, column);
            const value = Number(rawValue);
            
            // Skip invalid numbers
            if (isNaN(value)) return false;
            
            const filterValue = filter.numberFilter!.value;
            const filterValue2 = filter.numberFilter!.value2;
            
            switch (filter.numberFilter!.operator) {
              case 'equals': return value === filterValue!;
              case 'notEquals': return value !== filterValue!;
              case 'greaterThan': return value > filterValue!;
              case 'greaterThanOrEqual': return value >= filterValue!;
              case 'lessThan': return value < filterValue!;
              case 'lessThanOrEqual': return value <= filterValue!;
              case 'between': return filterValue !== undefined && filterValue2 !== undefined && 
                                   value >= filterValue && value <= filterValue2;
              case 'top10':
                // This will be handled separately after all filters
                return true;
              case 'bottom10':
                // This will be handled separately after all filters
                return true;
              case 'aboveAverage':
                const avg = this.originalData.reduce((sum, item) => {
                  const itemValue = Number(this.getNestedValue(item, column));
                  return sum + (isNaN(itemValue) ? 0 : itemValue);
                }, 0) / this.originalData.length;
                return value > avg;
              case 'belowAverage':
                const avgBelow = this.originalData.reduce((sum, item) => {
                  const itemValue = Number(this.getNestedValue(item, column));
                  return sum + (isNaN(itemValue) ? 0 : itemValue);
                }, 0) / this.originalData.length;
                return value < avgBelow;
              default: return true;
            }
          });
        } else if (filter.filterType === 'date' && filter.dateFilter) {
          data = data.filter(item => {
            const itemDate = new Date(item[column] as string);
            
            // Skip invalid dates
            if (isNaN(itemDate.getTime())) {
              return false;
            }
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            switch (filter.dateFilter!.operator) {
              case 'equals':
                if (!filter.dateFilter!.value) return false;
                const targetDate = new Date(filter.dateFilter!.value);
                if (isNaN(targetDate.getTime())) return false;
                targetDate.setHours(0, 0, 0, 0);
                itemDate.setHours(0, 0, 0, 0);
                return itemDate.getTime() === targetDate.getTime();
              case 'before':
                if (!filter.dateFilter!.value) return false;
                const beforeDate = new Date(filter.dateFilter!.value);
                if (isNaN(beforeDate.getTime())) return false;
                beforeDate.setHours(0, 0, 0, 0);
                itemDate.setHours(0, 0, 0, 0);
                return itemDate.getTime() < beforeDate.getTime();
              case 'after':
                if (!filter.dateFilter!.value) return false;
                const afterDate = new Date(filter.dateFilter!.value);
                if (isNaN(afterDate.getTime())) return false;
                afterDate.setHours(23, 59, 59, 999);
                return itemDate.getTime() > afterDate.getTime();
              case 'between':
                if (!filter.dateFilter!.value || !filter.dateFilter!.value2) return false;
                const startDate = new Date(filter.dateFilter!.value);
                const endDate = new Date(filter.dateFilter!.value2);
                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return false;
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
                itemDate.setHours(0, 0, 0, 0);
                return itemDate.getTime() >= startDate.getTime() && itemDate.getTime() <= endDate.getTime();
              case 'today':
                itemDate.setHours(0, 0, 0, 0);
                return itemDate.getTime() === today.getTime();
              case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                itemDate.setHours(0, 0, 0, 0);
                return itemDate.getTime() === yesterday.getTime();
              case 'thisWeek':
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                endOfWeek.setHours(23, 59, 59, 999);
                itemDate.setHours(0, 0, 0, 0);
                return itemDate.getTime() >= startOfWeek.getTime() && itemDate.getTime() <= endOfWeek.getTime();
              case 'thisMonth':
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                endOfMonth.setHours(23, 59, 59, 999);
                itemDate.setHours(0, 0, 0, 0);
                return itemDate.getTime() >= startOfMonth.getTime() && itemDate.getTime() <= endOfMonth.getTime();
              case 'thisYear':
                const startOfYear = new Date(today.getFullYear(), 0, 1);
                const endOfYear = new Date(today.getFullYear(), 11, 31);
                endOfYear.setHours(23, 59, 59, 999);
                itemDate.setHours(0, 0, 0, 0);
                return itemDate.getTime() >= startOfYear.getTime() && itemDate.getTime() <= endOfYear.getTime();
              default: return true;
            }
          });
        } else if (filter.values && filter.values.length > 0) {
          data = data.filter(item => filter.values.includes(item[column]));
        }
      });

      // Handle top10/bottom10 filters
      filters.forEach((filter, column) => {
        if (filter.filterType === 'number' && filter.numberFilter) {
          if (filter.numberFilter.operator === 'top10') {
            data.sort((a, b) => {
              const aVal = Number(this.getNestedValue(a, column));
              const bVal = Number(this.getNestedValue(b, column));
              return (isNaN(bVal) ? 0 : bVal) - (isNaN(aVal) ? 0 : aVal);
            });
            data = data.slice(0, 10);
          } else if (filter.numberFilter.operator === 'bottom10') {
            data.sort((a, b) => {
              const aVal = Number(this.getNestedValue(a, column));
              const bVal = Number(this.getNestedValue(b, column));
              return (isNaN(aVal) ? 0 : aVal) - (isNaN(bVal) ? 0 : bVal);
            });
            data = data.slice(0, 10);
          }
        }
      });

      // Apply sorting
      if (sort) {
        data.sort((a, b) => {
          const aVal = this.getNestedValue(a, sort.column);
          const bVal = this.getNestedValue(b, sort.column);
          
          // Handle null/undefined values
          if (aVal === null || aVal === undefined) {
            if (bVal === null || bVal === undefined) return 0;
            return sort.direction === 'asc' ? 1 : -1; // null values go to end
          }
          if (bVal === null || bVal === undefined) {
            return sort.direction === 'asc' ? -1 : 1; // null values go to end
          }
          
          // Handle different data types
          let comparison = 0;
          
          // For numbers
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            comparison = aVal - bVal;
          }
          // For dates
          else if (isDateValue(aVal) && isDateValue(bVal)) {
            const dateA = new Date(aVal);
            const dateB = new Date(bVal);
            comparison = dateA.getTime() - dateB.getTime();
          }
          // For booleans
          else if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
            comparison = aVal === bVal ? 0 : (aVal ? 1 : -1);
          }
          // For strings and everything else
          else {
            const strA = String(aVal).toLowerCase();
            const strB = String(bVal).toLowerCase();
            comparison = strA.localeCompare(strB);
          }
          
          return sort.direction === 'desc' ? -comparison : comparison;
        });
      }

      // Update pagination total
      const currentPagination = this.paginationSubject.value;
      this.paginationSubject.next({
        ...currentPagination,
        totalRecords: data.length
      });

      return data;
    })
  );

  public paginatedData$: Observable<T[]> = combineLatest([
    this.filteredData$,
    this.pagination$
  ]).pipe(
    map(([data, pagination]) => {
      if (pagination.pageSize === -1) {
        return data;
      }
      
      const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
      const endIndex = startIndex + pagination.pageSize;
      return data.slice(startIndex, endIndex);
    })
  );

  // Initialize with data and column configuration
  initialize(data: T[], columns: ColumnConfig[]): void {
    console.log('GenericDataService.initialize called with:', data.length, 'records');
    console.log('Sample record:', data[0]);
    console.log('Columns to set:', columns.map(c => c.key));
    
    this.originalData = data;
    this.columns = columns;
    
    // Reset all state
    this.filtersSubject.next(new Map());
    this.sortSubject.next(null);
    this.searchSubject.next('');
    
    this.paginationSubject.next({
      currentPage: 1,
      pageSize: 25,
      totalRecords: data.length
    });
  }

  getColumns(): ColumnConfig[] {
    return this.columns;
  }

  getFilterOptions(column: string): Observable<FilterOption[]> {
    return new Observable<FilterOption[]>(observer => {
      setTimeout(() => {
        let dataToAnalyze = [...this.originalData];
        
        // Apply all filters except the one for the column we're currently filtering
        const currentFilters = this.filtersSubject.value;
        const searchTerm = this.searchSubject.value;
        
        // Apply global search
        if (searchTerm) {
          dataToAnalyze = dataToAnalyze.filter(item =>
            Object.values(item).some(value => {
              if (typeof value === 'object') {
                return JSON.stringify(value).toLowerCase().includes(searchTerm.toLowerCase());
              }
              return value.toString().toLowerCase().includes(searchTerm.toLowerCase());
            })
          );
        }
        
        // Apply other filters (excluding current column)
        currentFilters.forEach((filter, filterColumn) => {
          if (filterColumn === column) return;
          
          if (filter.filterType === 'text' && filter.textFilter) {
            dataToAnalyze = dataToAnalyze.filter(item => {
              const rawValue = this.getNestedValue(item, filterColumn);
              const value = String(rawValue).toLowerCase();
              const filterValue = filter.textFilter!.value.toLowerCase();
              
              switch (filter.textFilter!.operator) {
                case 'equals': return value === filterValue;
                case 'contains': return value.includes(filterValue);
                default: return true;
              }
            });
          } else if (filter.values && filter.values.length > 0) {
            dataToAnalyze = dataToAnalyze.filter(item => {
              const value = this.getNestedValue(item, filterColumn);
              return filter.values.includes(value);
            });
          }
        });
        
        // Count unique values
        const valueCountMap = new Map<any, number>();
        for (const item of dataToAnalyze) {
          const value = this.getNestedValue(item, column);
          const displayValue = this.formatValueForDisplay(value);
          valueCountMap.set(value, (valueCountMap.get(value) || 0) + 1);
        }
        
        // Get current active filters
        const currentFilter = currentFilters.get(column);
        
        // Create filter options
        const options = Array.from(valueCountMap.entries()).map(([value, count]) => ({
          key: String(value),
          value: this.formatValueForDisplay(value),
          count: count,
          selected: currentFilter ? currentFilter.values.includes(value) : false
        }));
        
        observer.next(options);
        observer.complete();
      }, 0);
    });
  }

  private getNestedValue(obj: any, path: string): any {
    if (!path.includes('.') && !path.includes('[')) {
      return obj[path];
    }

    // Handle array notation like "key[0].subkey"
    if (path.includes('[')) {
      const arrayMatch = path.match(/^([^[]+)\[(\d+)\]\.(.+)$/);
      if (arrayMatch) {
        const [, arrayKey, index, subPath] = arrayMatch;
        const arrayValue = obj[arrayKey];
        if (Array.isArray(arrayValue) && arrayValue[parseInt(index)]) {
          return this.getNestedValue(arrayValue[parseInt(index)], subPath);
        }
        return null;
      }
    }

    // Handle dot notation like "key.subkey"
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined) return null;
      current = current[key];
    }
    
    return current;
  }

  private formatValueForDisplay(value: any): any {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.length > 0 ? `[${value.length} items]` : '[]';
      } else {
        // For objects, try to show a meaningful representation
        if (value.name) return value.name;
        if (value.title) return value.title;
        if (value.label) return value.label;
        if (value.id) return `ID: ${value.id}`;
        return '[Object]';
      }
    }
    return value;
  }
  setFilter(column: string, values: any[]): void {
    const currentFilters = new Map(this.filtersSubject.value);
    if (values.length === 0) {
      currentFilters.delete(column);
    } else {
      currentFilters.set(column, { column, values });
    }
    this.filtersSubject.next(currentFilters);
    this.resetPagination();
  }

  setFilterWithConfig(column: string, filterData: { values?: any[], textFilter?: any, numberFilter?: any, dateFilter?: any }): void {
    const currentFilters = new Map(this.filtersSubject.value);
    
    if (filterData.textFilter) {
      currentFilters.set(column, { 
        column, 
        values: [], 
        filterType: 'text',
        textFilter: filterData.textFilter
      });
    } else if (filterData.numberFilter) {
      currentFilters.set(column, { 
        column, 
        values: [], 
        filterType: 'number',
        numberFilter: filterData.numberFilter
      });
    } else if (filterData.dateFilter) {
      currentFilters.set(column, { 
        column, 
        values: [], 
        filterType: 'date',
        dateFilter: filterData.dateFilter
      });
    } else if (filterData.values && filterData.values.length > 0) {
      currentFilters.set(column, { 
        column, 
        values: filterData.values,
        filterType: 'list'
      });
    } else {
      currentFilters.delete(column);
    }
    
    this.filtersSubject.next(currentFilters);
    this.resetPagination();
  }
  
  clearAllFilters(): void {
    this.filtersSubject.next(new Map());
    this.resetPagination();
  }

  setSort(column: string, direction: 'asc' | 'desc'): void {
    this.sortSubject.next({ column, direction });
  }

  clearSort(): void {
    this.sortSubject.next(null);
  }

  setPagination(config: Partial<PaginationConfig>): void {
    const current = this.paginationSubject.value;
    this.paginationSubject.next({ ...current, ...config });
  }

  setSearch(term: string): void {
    this.searchSubject.next(term);
    this.resetPagination();
  }

  private resetPagination(): void {
    const current = this.paginationSubject.value;
    this.paginationSubject.next({ ...current, currentPage: 1 });
  }

  getActiveFilters(): Observable<Map<string, FilterConfig>> {
    return this.filters$.pipe(
      map(filters => {
        const activeFilters = new Map<string, FilterConfig>();
        for (const [column, config] of filters) {
          if (config.filterType === 'text' && config.textFilter) {
            activeFilters.set(column, config);
          } else if (config.filterType === 'number' && config.numberFilter) {
            activeFilters.set(column, config);
          } else if (config.filterType === 'date' && config.dateFilter) {
            activeFilters.set(column, config);
          } else if (config.filterType === 'list' && config.values && config.values.length > 0) {
            activeFilters.set(column, config);
          }
        }
        return activeFilters;
      })
    );
  }

  getTotalRecords(): number {
    return this.originalData.length;
  }
}