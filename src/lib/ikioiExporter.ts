import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { IkioiColumnData } from '@/components/ikioi/IkioiColumn';

// Update the ExportOptions interface:
export interface ExportOptions {
  format: 'pdf' | 'png' | 'json' | 'csv'; // ADD THIS LINE
  layout: 'whiteboard' | 'table' | 'hierarchy';
  includeMetadata: boolean;
  includeStatistics: boolean;
  theme: 'light' | 'dark' | 'print';
  fileName: string;
}

export interface ExportProgress {
  current: number;
  total: number;
  message: string;
}


export class IkioiExporter {
  private pdf: jsPDF;
  private options: ExportOptions;
  private margin = 20; // mm
  private pageWidth = 210; // A4 width in mm
  private pageHeight = 297; // A4 height in mm
  private currentY = 0;
  private pageNumber = 1;

  constructor(options: Partial<ExportOptions> = {}) {
    // Create complete options with all required fields
    const defaultOptions: ExportOptions = {
      format: 'pdf',
      layout: 'whiteboard',
      includeMetadata: true,
      includeStatistics: true,
      theme: 'print',
      fileName: `ikioi-export-${new Date().toISOString().split('T')[0]}`
    };

    this.options = {
      ...defaultOptions,
      ...options
    };

    this.pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    this.currentY = this.margin;
  }

  /**
   * Main export method
   */
  async export(
    columns: IkioiColumnData[],
    userName: string,
    statistics: {
      goalsCount: number;
      sequencesCount: number;
      dailyStepsCount: number;
      totalDailyTime: number;
    },
    onProgress?: (progress: ExportProgress) => void
  ): Promise<Blob> {
    try {
      // Update progress
      onProgress?.({
        current: 1,
        total: 4,
        message: 'Preparing export...'
      });

      // Add header
      await this.addHeader(userName);
      this.currentY += 15;

      // Add metadata if enabled
      if (this.options.includeMetadata) {
        onProgress?.({
          current: 2,
          total: 4,
          message: 'Adding metadata...'
        });
        await this.addMetadata(statistics);
        this.currentY += 20;
      }

      // Add content based on layout
      onProgress?.({
        current: 3,
        total: 4,
        message: 'Generating content...'
      });

      switch (this.options.layout) {
        case 'whiteboard':
          await this.renderWhiteboardLayout(columns);
          break;
        case 'table':
          await this.renderTableLayout(columns);
          break;
        case 'hierarchy':
          await this.renderHierarchyLayout(columns);
          break;
      }

      // Add footer to all pages
      onProgress?.({
        current: 4,
        total: 4,
        message: 'Finalizing export...'
      });
      this.addFooter();

      // Generate blob
      const pdfBlob = this.pdf.output('blob');
      return pdfBlob;

    } catch (error) {
      console.error('Export error:', error);
      throw new Error(`Failed to export: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export as image (screenshot of whiteboard)
   */
 // In the exportAsImage method, add better error handling:
async exportAsImage(
  element: HTMLElement,
  fileName: string
): Promise<Blob> {
  try {
    // Ensure html2canvas is loaded
    if (typeof html2canvas === 'undefined') {
      throw new Error('html2canvas library not loaded');
    }
    
    const canvas = await html2canvas(element, {
      scale: 1.5, // Reduced from 2 for better performance
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      allowTaint: true
    });

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create image from canvas'));
        }
      }, 'image/png', 0.95); // Slightly reduced quality for smaller files
    });
  } catch (error) {
    console.error('Image export error:', error);
    throw new Error(`Failed to export image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
 
  /**
   * Export as JSON data
   */
  exportAsJson(
    columns: IkioiColumnData[],
    userName: string,
    statistics: any
  ): Blob {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      exportedBy: userName,
      statistics,
      columns: columns.map(col => ({
        id: col.id,
        category: col.category,
        goal: col.goal,
        targetYear: col.targetYear,
        color: col.color,
        position: col.position,
        sequences: col.sequences.map(seq => ({
          id: seq.id,
          description: seq.description,
          dueMonth: seq.dueMonth,
          completed: seq.completed,
          dailySteps: seq.dailySteps.map(step => ({
            id: step.id,
            description: step.description,
            timeMinutes: step.timeMinutes,
            completed: step.completed
          }))
        }))
      }))
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }

  /**
   * Export as CSV table
   */
  exportAsCsv(columns: IkioiColumnData[]): Blob {
    const headers = [
      'Category',
      'Goal',
      'Target Year',
      'Sequence',
      'Due Month',
      'Daily Step',
      'Time (min)',
      'Completed'
    ];

    const rows: string[][] = [];

    columns.forEach(column => {
      if (column.sequences.length === 0) {
        rows.push([
          column.category,
          column.goal,
          column.targetYear.toString(),
          '', '', '', '', ''
        ]);
      } else {
        column.sequences.forEach(sequence => {
          if (sequence.dailySteps.length === 0) {
            rows.push([
              column.category,
              column.goal,
              column.targetYear.toString(),
              sequence.description,
              sequence.dueMonth,
              '', '', ''
            ]);
          } else {
            sequence.dailySteps.forEach(step => {
              rows.push([
                column.category,
                column.goal,
                column.targetYear.toString(),
                sequence.description,
                sequence.dueMonth,
                step.description,
                step.timeMinutes.toString(),
                step.completed ? 'Yes' : 'No'
              ]);
            });
          }
        });
      }
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  /**
   * Download blob as file
   */
  static downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // ============ PRIVATE METHODS ============

  private async addHeader(userName: string): Promise<void> {
    // Title
    this.pdf.setFontSize(24);
    this.pdf.setTextColor(41, 128, 185); // Primary blue
    this.pdf.text('Ikioi Goals Whiteboard', this.margin, this.currentY);

    // Subtitle
    this.pdf.setFontSize(12);
    this.pdf.setTextColor(100, 100, 100);
    this.pdf.text(`Exported for: ${userName}`, this.margin, this.currentY + 8);

    // Date
    const dateStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    this.pdf.text(`Generated: ${dateStr}`, this.pageWidth - this.margin, this.currentY + 8, {
      align: 'right'
    });

    // Separator line
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.line(this.margin, this.currentY + 15, this.pageWidth - this.margin, this.currentY + 15);
  }

  private async addMetadata(statistics: any): Promise<void> {
    if (!this.options.includeStatistics) return;

    this.pdf.setFontSize(14);
    this.pdf.setTextColor(50, 50, 50);
    this.pdf.text('Summary', this.margin, this.currentY);
    this.currentY += 10;

    const stats = [
      { label: 'Goals', value: statistics.goalsCount, color: [66, 153, 225] },
      { label: 'Sequences', value: statistics.sequencesCount, color: [72, 187, 120] },
      { label: 'Daily Steps', value: statistics.dailyStepsCount, color: [237, 137, 54] },
      { label: 'Daily Time', value: `${Math.round(statistics.totalDailyTime / 60)}h`, color: [245, 101, 101] }
    ];

    const boxWidth = (this.pageWidth - (this.margin * 2) - 15) / 4;
    const boxHeight = 25;

    stats.forEach((stat, index) => {
      const x = this.margin + (index * (boxWidth + 5));

      // Box background with color
      this.pdf.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
      this.pdf.roundedRect(x, this.currentY, boxWidth, boxHeight, 3, 3, 'F');

      // White text
      this.pdf.setTextColor(255, 255, 255);
      this.pdf.setFontSize(18);
      this.pdf.text(stat.value.toString(), x + boxWidth / 2, this.currentY + 12, { align: 'center' });

      this.pdf.setFontSize(10);
      this.pdf.text(stat.label.toUpperCase(), x + boxWidth / 2, this.currentY + 20, { align: 'center' });
    });

    this.currentY += boxHeight + 10;
  }

  private async renderWhiteboardLayout(columns: IkioiColumnData[]): Promise<void> {
    if (columns.length === 0) {
      this.pdf.setFontSize(14);
      this.pdf.setTextColor(150, 150, 150);
      this.pdf.text('No goals to display', this.margin + 50, this.currentY + 50);
      return;
    }

    const colWidth = 80;
    const colHeight = 60;
    const gap = 15;
    const colsPerRow = 2;

    columns.forEach((column, index) => {
      // Check if we need new page
      const row = Math.floor(index / colsPerRow);
      const col = index % colsPerRow;
      const yPos = this.currentY + (row * (colHeight + gap));

      if (yPos + colHeight > this.pageHeight - this.margin - 30) {
        this.pdf.addPage();
        this.currentY = this.margin;
        return this.renderWhiteboardLayout(columns.slice(index));
      }

      const xPos = this.margin + (col * (colWidth + gap));
      this.renderColumn(column, xPos, yPos, colWidth, colHeight);
    });

    this.currentY += Math.ceil(columns.length / colsPerRow) * (colHeight + gap);
  }

  private renderColumn(
    column: IkioiColumnData,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    // Background color
    const rgb = this.hexToRgb(column.color);
    this.pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
    this.pdf.roundedRect(x, y, width, 15, 2, 2, 'F');

    // Category
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.text(column.category || 'General', x + 5, y + 10);

    // Goal title
    this.pdf.setFontSize(11);
    this.pdf.setTextColor(0, 0, 0);
    const goalText = this.wrapText(column.goal, width - 10);
    this.pdf.text(goalText, x + 5, y + 25, { maxWidth: width - 10 });

    // Target year
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(100, 100, 100);
    this.pdf.text(`🎯 ${column.targetYear}`, x + 5, y + 35);

    // Sequences count
    const seqCount = column.sequences.length;
    this.pdf.text(`📋 ${seqCount} sequence${seqCount !== 1 ? 's' : ''}`, x + width - 5, y + 35, { align: 'right' });

    // Preview first sequence
    if (column.sequences.length > 0) {
      this.pdf.setDrawColor(220, 220, 220);
      this.pdf.line(x, y + 40, x + width, y + 40);

      const firstSeq = column.sequences[0];
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(80, 80, 80);
      
      const seqText = firstSeq.description.length > 25 
        ? firstSeq.description.substring(0, 25) + '...' 
        : firstSeq.description;
      
      this.pdf.text(`→ ${seqText}`, x + 5, y + 47);
      
      if (firstSeq.dueMonth) {
        this.pdf.text(`📅 ${firstSeq.dueMonth}`, x + width - 5, y + 47, { align: 'right' });
      }

      // Show more indicator
      if (column.sequences.length > 1) {
        this.pdf.setTextColor(150, 150, 150);
        this.pdf.text(`+${column.sequences.length - 1} more...`, x + width - 5, y + height - 5, { align: 'right' });
      }
    }
  }

  private async renderTableLayout(columns: IkioiColumnData[]): Promise<void> {
    this.pdf.setFontSize(16);
    this.pdf.setTextColor(50, 50, 50);
    this.pdf.text('Goals Detailed View', this.margin, this.currentY);
    this.currentY += 10;

    // Table headers
    const headers = ['Category', 'Goal', 'Year', 'Sequence', 'Due', 'Steps', 'Time'];
    const colWidths = [25, 40, 15, 50, 20, 20, 20];

    // Header background
    this.pdf.setFillColor(240, 240, 240);
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - (this.margin * 2), 10, 'F');

    // Header text
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(0, 0, 0);
    let x = this.margin;
    headers.forEach((header, i) => {
      this.pdf.text(header, x + 2, this.currentY + 7);
      x += colWidths[i];
    });

    this.currentY += 10;

    // Data rows
    let rowIndex = 0;
    for (const column of columns) {
      if (this.currentY > this.pageHeight - this.margin - 20) {
        this.pdf.addPage();
        this.currentY = this.margin;
      }

      if (column.sequences.length === 0) {
        this.addTableRow([column.category, column.goal, column.targetYear.toString(), '', '', '', ''], colWidths, rowIndex);
        rowIndex++;
        this.currentY += 8;
      } else {
        for (const seq of column.sequences) {
          if (this.currentY > this.pageHeight - this.margin - 20) {
            this.pdf.addPage();
            this.currentY = this.margin;
            rowIndex = 0;
          }

          const dailySteps = seq.dailySteps.length;
          const totalTime = seq.dailySteps.reduce((sum, step) => sum + step.timeMinutes, 0);
          
          this.addTableRow([
            column.category,
            column.goal,
            column.targetYear.toString(),
            seq.description,
            seq.dueMonth || '',
            dailySteps.toString(),
            `${Math.round(totalTime / 60)}h`
          ], colWidths, rowIndex);

          rowIndex++;
          this.currentY += 8;
        }
      }
    }
  }

  private async renderHierarchyLayout(columns: IkioiColumnData[]): Promise<void> {
    // Simplified hierarchy - will implement based on your needs
    this.pdf.setFontSize(16);
    this.pdf.setTextColor(50, 50, 50);
    this.pdf.text('Goals Hierarchy', this.margin, this.currentY);
    this.currentY += 10;

    columns.forEach((column, colIndex) => {
      if (this.currentY > this.pageHeight - this.margin - 50) {
        this.pdf.addPage();
        this.currentY = this.margin;
      }

      // Column header
      this.pdf.setFontSize(14);
      this.pdf.setTextColor(41, 128, 185);
      this.pdf.text(`${column.category}: ${column.goal}`, this.margin, this.currentY);
      this.currentY += 8;

      // Sequences
      column.sequences.forEach((seq, seqIndex) => {
        if (this.currentY > this.pageHeight - this.margin - 30) {
          this.pdf.addPage();
          this.currentY = this.margin;
        }

        this.pdf.setFontSize(11);
        this.pdf.setTextColor(0, 0, 0);
        this.pdf.text(`  • ${seq.description}`, this.margin + 10, this.currentY);
        this.currentY += 6;

        // Daily steps
        seq.dailySteps.forEach((step, stepIndex) => {
          this.pdf.setFontSize(9);
          this.pdf.setTextColor(100, 100, 100);
          this.pdf.text(`    ◦ ${step.description} (${step.timeMinutes}min)`, this.margin + 20, this.currentY);
          this.currentY += 5;
        });

        this.currentY += 3;
      });

      this.currentY += 10;
    });
  }

  private addFooter(): void {
    const totalPages = this.pdf.getNumberOfPages();
    
    for (let i = 1; i <= totalPages; i++) {
      this.pdf.setPage(i);
      
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(150, 150, 150);
      
      // Page number
      this.pdf.text(
        `Page ${i} of ${totalPages}`,
        this.pageWidth - this.margin,
        this.pageHeight - 10,
        { align: 'right' }
      );
      
      // App name
      this.pdf.text(
        'Ikioi • Mindful Momentum',
        this.margin,
        this.pageHeight - 10
      );
    }
  }

  private addTableRow(data: string[], colWidths: number[], rowIndex: number): void {
    let x = this.margin;
    
    // Alternate row colors
    if (rowIndex % 2 === 0) {
      this.pdf.setFillColor(250, 250, 250);
      this.pdf.rect(this.margin, this.currentY, this.pageWidth - (this.margin * 2), 8, 'F');
    }

    data.forEach((cell, i) => {
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.text(cell, x + 2, this.currentY + 5, { maxWidth: colWidths[i] - 4 });
      x += colWidths[i];
    });
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [186, 225, 255]; // Default color
  }

  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = this.pdf.getStringUnitWidth(currentLine + ' ' + word) * this.pdf.getFontSize() / this.pdf.internal.scaleFactor;
      
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    
    lines.push(currentLine);
    return lines;
  }
}