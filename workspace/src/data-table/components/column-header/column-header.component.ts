import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColumnConfig } from '../../interfaces/data-table.interface';
/**
* @ignore
*/
@Component({
  selector: 'app-column-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './column-header.component.html',
  styleUrls: ['./column-header.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ColumnHeaderComponent {
  // Configuration for the column (label, key, filterable, sortable, etc.)
  @Input() config!: ColumnConfig;

  // Indicates if the column currently has an active filter
  @Input() hasActiveFilter = false;

  // Enables or disables Excel-style filters
  @Input() excelFiltersEnabled = false;

  // Current sort direction for the column ('asc', 'desc', or null)
  @Input() sortDirection: 'asc' | 'desc' | null = null;

  // Emits when a filter action is triggered
  @Output() filter = new EventEmitter<{ column: string, event: MouseEvent }>();

  // Emits when a sort action is triggered
  @Output() sort = new EventEmitter<{ column: string, direction: 'asc' | 'desc' }>();

  /**
   * Handles filter icon click event.
   * Emits filter event if filtering is enabled for the column.
   */
  onFilter(event: MouseEvent): void {
    if (!this.config.filterable || !this.excelFiltersEnabled) return;
    event.stopPropagation();
    this.filter.emit({ column: this.config.key, event });
  }

  /**
   * Handles header click event for sorting.
   * Toggles sort direction and emits sort event if sorting is enabled.
   */
  onHeaderClick(): void {
    if (!this.config.sortable) return;

    let newDirection: 'asc' | 'desc';
    if (this.sortDirection === 'asc') {
      newDirection = 'desc';
    } else {
      newDirection = 'asc';
    }

    console.log('Header clicked, emitting sort:', this.config.key, newDirection);
    this.sort.emit({ column: this.config.key, direction: newDirection });
  }
}