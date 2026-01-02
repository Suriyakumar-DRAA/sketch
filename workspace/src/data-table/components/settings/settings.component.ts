import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColumnConfig } from '../../interfaces/data-table.interface';
import { FormsModule } from '@angular/forms';
/**
* @ignore
*/
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class SettingsComponent {
  @Input() isSettingsVisible: boolean = false;
  @Input() columns: Array<ColumnConfig> = [];
  @Input() visibleColumns: Set<string> = new Set();
  @Input() showTotals = false;

  @Output() close = new EventEmitter<void>();
  @Output() columnsChange = new EventEmitter<{ column: string, visible: boolean }>();
  @Output() totalChange = new EventEmitter<boolean>();

  allColumnsVisible: boolean = false;
  enableShowTotalsToggle: boolean = false;

  constructor() {
  }

  async ngOnChanges() {
    const self = this;
    if (this.columns || this.visibleColumns) {
      this.allColumnsVisible = this.columns.length === this.visibleColumns.size;
      this.enableShowTotalsToggle = this.columns.some(col => col.type === 'number' || col.type === 'currency');
    }
  }

  onClose() {
    this.close.emit();
  }

  onShowTotalsChange(): void {
    this.totalChange.emit(this.showTotals);
  }

  onColumnVisibilityChange(column: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const visible = target.checked;
    if (visible) {
      this.visibleColumns.add(column);
    } else {
      this.visibleColumns.delete(column);
    }
    this.allColumnsVisible = this.columns.length === this.visibleColumns.size;
    this.columnsChange.emit({ column, visible });
  }

  isColumnVisible(column: string): boolean {
    return this.visibleColumns.has(column);
  }

  toggleAllColumns(showAll: boolean): void {
    this.columns.forEach(column => {
      this.columnsChange.emit({ column: column.key, visible: showAll });
      if (showAll) {
        this.visibleColumns.add(column.key);
      } else {
        this.visibleColumns.delete(column.key);
      }
    });
  }
}