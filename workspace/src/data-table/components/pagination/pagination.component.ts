import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginationConfig } from '../../interfaces/data-table.interface';

/**
* @ignore
*/
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss', './../../styles/styles.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class PaginationComponent {
  @Input() config!: PaginationConfig;
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() goToPage = new EventEmitter<number>();

  pageSizeOptions = [25, 50, 100, 1000];
  goToPageValue = '';

  get totalPages(): number {
    if (this.config.pageSize === -1) return 1;
    return Math.ceil(this.config.totalRecords / this.config.pageSize);
  }

  get startRecord(): number {
    if (this.config.pageSize === -1) return 1;
    return (this.config.currentPage - 1) * this.config.pageSize + 1;
  }

  get endRecord(): number {
    if (this.config.pageSize === -1) return this.config.totalRecords;
    return Math.min(this.config.currentPage * this.config.pageSize, this.config.totalRecords);
  }

  get visiblePages(): number[] {
    if (this.config.pageSize === -1) return [1];
    const total = this.totalPages;
    const current = this.config.currentPage;
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        pages.push(1, 2, 3, 4, 5, -1, total);
      } else if (current >= total - 3) {
        pages.push(1, -1, total - 4, total - 3, total - 2, total - 1, total);
      } else {
        pages.push(1, -1, current - 1, current, current + 1, -1, total);
      }
    }

    return pages;
  }

  canGoPrevious(): boolean {
    if (this.config.pageSize === -1) return false;
    return this.config.currentPage > 1;
  }

  canGoNext(): boolean {
    if (this.config.pageSize === -1) return false;
    return this.config.currentPage < this.totalPages;
  }

  onPageClick(page: number): void {
    if (this.config.pageSize === -1) return;
    if (page !== -1 && page !== this.config.currentPage) {
      this.pageChange.emit(page);
    }
  }

  onPreviousClick(): void {
    if (this.config.pageSize === -1) return;
    if (this.canGoPrevious()) {
      this.pageChange.emit(this.config.currentPage - 1);
    }
  }

  onNextClick(): void {
    if (this.config.pageSize === -1) return;
    if (this.canGoNext()) {
      this.pageChange.emit(this.config.currentPage + 1);
    }
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newPageSize = parseInt(target.value, 10);
    this.pageSizeChange.emit(newPageSize);
  }

  onGoToPageSubmit(): void {
    if (this.config.pageSize === -1) return;
    const page = parseInt(this.goToPageValue, 10);
    if (page >= 1 && page <= this.totalPages) {
      this.goToPage.emit(page);
      this.goToPageValue = '';
    }
  }

  getPageSizeLabel(size: number): string {
    return size === -1 ? 'All' : size.toString();
  }
}