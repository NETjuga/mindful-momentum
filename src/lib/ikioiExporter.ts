import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { IkioiColumnData } from '@/components/ikioi/IkioiColumn';
import autoTable, { Color } from 'jspdf-autotable';

// Update the ExportOptions interface:
export interface ExportOptions {
  format: 'pdf' | 'png' | 'json' | 'csv';
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
  
  // SIMPLIFIED COLOR PALETTE with exact sage green
  private colors = {
    // Primary sage green - exact from your CSS
    primary: [115, 168, 124] as [number, number, number], // hsl(142 35% 45%) = #73A87C
    
    // Warm amber (secondary accent)
    accent: [224, 172, 105] as [number, number, number], // hsl(35, 85%, 55%)
    
    // Text colors
    text: [51, 51, 51] as [number, number, number],      // #333 - Dark gray/black
    textLight: [102, 102, 102] as [number, number, number], // #666 - Medium gray
    textLighter: [153, 153, 153] as [number, number, number], // #999 - Light gray
    
    // Backgrounds
    background: [252, 250, 245] as [number, number, number], // hsl(40, 33%, 98%) - Warm cream
    border: [221, 221, 221] as [number, number, number]      // #DDD - Light border
  };

  constructor(options: Partial<ExportOptions> = {}) {
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
      orientation: 'portrait',
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
      onProgress?.({
        current: 1,
        total: 4,
        message: 'Preparing export...'
      });

      // Add header
      await this.addHeader(userName);
      this.currentY += 10;

      // Add metadata if enabled
      if (this.options.includeMetadata) {
        onProgress?.({
          current: 2,
          total: 4,
          message: 'Adding metadata...'
        });
        await this.addMetadata(statistics);
        this.currentY += 10;
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
          await this.renderSimpleHierarchy(columns);
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
   * Export as image
   */
  async exportAsImage(
    element: HTMLElement,
    fileName: string
  ): Promise<Blob> {
    try {
      if (typeof html2canvas === 'undefined') {
        throw new Error('html2canvas library not loaded');
      }
      
      const canvas = await html2canvas(element, {
        scale: 1.5,
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
        }, 'image/png', 0.95);
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
          '', '', '', ''
        ]);
      } else {
        column.sequences.forEach(sequence => {
          if (sequence.dailySteps.length === 0) {
            rows.push([
              column.category,
              column.goal,
              column.targetYear.toString(),
              sequence.description,
              '', '', ''
            ]);
          } else {
            sequence.dailySteps.forEach(step => {
              rows.push([
                column.category,
                column.goal,
                column.targetYear.toString(),
                sequence.description,
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
  const startY = this.currentY;

  /* ================================
     LEFT — BRAND
  ================================= */
  this.pdf.setFont('times', 'bold'); // serif, semi-bold equivalent
  this.pdf.setFontSize(24);
  this.pdf.setTextColor(...this.colors.primary);
  this.pdf.text('Ikioi', this.margin, startY);

  this.pdf.setFont('times', 'normal');
  this.pdf.setFontSize(12);
  this.pdf.setTextColor(...this.colors.textLight);
  this.pdf.text('Productivity System', this.margin, startY + 8);

  /* ================================
     RIGHT — USER INFO
  ================================= */
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  this.pdf.setFont('times', 'bold');
  this.pdf.setFontSize(16);
  this.pdf.setTextColor(...this.colors.primary);
  this.pdf.text('Ikioi', this.pageWidth - this.margin, startY, { align: 'right' });

  this.pdf.setFont('times', 'normal');
  this.pdf.setFontSize(9);
  this.pdf.setTextColor(...this.colors.textLight);
  this.pdf.text(`For: ${userName}`, this.pageWidth - this.margin, startY + 8, { align: 'right' });
  this.pdf.text(`Date: ${dateStr}`, this.pageWidth - this.margin, startY + 13, { align: 'right' });

  /* ================================
     SEPARATOR
  ================================= */
  this.pdf.setDrawColor(...this.colors.border);
  this.pdf.setLineWidth(0.5);
  this.pdf.line(
    this.margin,
    startY + 18,
    this.pageWidth - this.margin,
    startY + 18
  );

  /* ================================
     ADVANCE CURSOR (IMPORTANT)
  ================================= */
  this.currentY = startY + 30;
}


  private async addMetadata(statistics: any): Promise<void> {
    if (!this.options.includeStatistics) return;

    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(this.colors.text[0], this.colors.text[1], this.colors.text[2]);
    this.pdf.text('Summary', this.margin, this.currentY);
    this.currentY += 8;

    const stats = [
      { label: 'Goals', value: statistics.goalsCount },
      { label: 'Sequences', value: statistics.sequencesCount },
      { label: 'Daily Steps', value: statistics.dailyStepsCount },
      { label: 'Total Time', value: `${Math.round(statistics.totalDailyTime / 60)}h ${statistics.totalDailyTime % 60}m` }
    ];

    const boxWidth = (this.pageWidth - (this.margin * 2) - 15) / 4;
    const boxHeight = 20;

    stats.forEach((stat, index) => {
      const x = this.margin + (index * (boxWidth + 5));

      // Simple clean cards without colored borders
      this.pdf.setDrawColor(this.colors.border[0], this.colors.border[1], this.colors.border[2]);
      this.pdf.setFillColor(255, 255, 255);
      this.pdf.rect(x, this.currentY, boxWidth, boxHeight, 'FD');

      // Number - primary color for the first stat, text for others
      this.pdf.setFontSize(16);
      this.pdf.setFont('helvetica', 'bold');
      if (index === 0) {
        this.pdf.setTextColor(this.colors.primary[0], this.colors.primary[1], this.colors.primary[2]);
      } else {
        this.pdf.setTextColor(this.colors.text[0], this.colors.text[1], this.colors.text[2]);
      }
      this.pdf.text(stat.value.toString(), x + boxWidth / 2, this.currentY + 10, { align: 'center' });

      // Label
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(this.colors.textLight[0], this.colors.textLight[1], this.colors.textLight[2]);
      this.pdf.text(stat.label.toUpperCase(), x + boxWidth / 2, this.currentY + 16, { align: 'center' });
    });

    this.currentY += boxHeight + 10;
  }

  private async renderWhiteboardLayout(columns: IkioiColumnData[]): Promise<void> {
    if (columns.length === 0) {
      this.addNoDataMessage();
      return;
    }

    const colWidth = 80;
    const colHeight = 60;
    const gap = 15;
    const colsPerRow = 2;

    columns.forEach((column, index) => {
      const row = Math.floor(index / colsPerRow);
      const col = index % colsPerRow;
      const yPos = this.currentY + (row * (colHeight + gap));

      if (yPos + colHeight > this.pageHeight - this.margin - 30) {
        this.pdf.addPage();
        this.currentY = this.margin;
        return this.renderWhiteboardLayout(columns.slice(index));
      }

      const xPos = this.margin + (col * (colWidth + gap));
      this.renderColumnCard(column, xPos, yPos, colWidth, colHeight);
    });

    this.currentY += Math.ceil(columns.length / colsPerRow) * (colHeight + gap);
  }

//renderTABLELAYOUT

  private async renderTableLayout(columns: IkioiColumnData[]): Promise<void> {
  if (columns.length === 0) {
    this.addNoDataMessage();
    return;
  }

  columns.forEach((column, columnIndex) => {
    // Check if we need a page break before starting a new column
    // Estimate minimum space needed for a column header: ~25mm
    if (this.currentY + 25 > this.pageHeight - this.margin) {
      this.pdf.addPage();
      this.currentY = this.margin;
    }

    /* ================================
       CATEGORY
    ================================= */
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(130, 130, 130);
    this.pdf.text(column.category.toUpperCase(), this.margin, this.currentY);
    this.currentY += 4;

    /* ================================
       GOAL TITLE
    ================================= */
    this.pdf.setFontSize(11);
    this.pdf.setFont(undefined, 'bold');
    this.pdf.setTextColor(...this.colors.text);
    this.pdf.text(column.goal, this.margin, this.currentY);

    /* ================================
       TARGET YEAR
    ================================= */
    this.pdf.setFontSize(8);
    this.pdf.setFont(undefined, 'normal');
    this.pdf.setTextColor(120, 120, 120);
    this.pdf.text(
      `Target ${column.targetYear}`,
      this.pdf.internal.pageSize.getWidth() - this.margin,
      this.currentY,
      { align: 'right' }
    );

    this.currentY += 8; // Increased from 6 for better spacing

    /* ================================
       SEQUENCES (TABLES)
    ================================= */
    column.sequences.forEach((sequence, seqIndex) => {
      // Calculate exact space needed for this sequence
      let spaceNeeded = 0;
      
      if (sequence.dailySteps.length === 0) {
        // Empty sequence: just the header line
        spaceNeeded = 12; // 6 for header + 6 for spacing
      } else {
        // Sequence with table: header + table rows + spacing
        const tableHeaderHeight = 10; // Approximate
        const rowHeight = 6; // Approximate per row
        spaceNeeded = tableHeaderHeight + (sequence.dailySteps.length * rowHeight) + 6;
      }
      
      // Check if this sequence fits on current page
      // Leave at least 50mm for summary if this is the last sequence of last column
      const isLastSequence = columnIndex === columns.length - 1 && 
                            seqIndex === column.sequences.length - 1;
      const minSpaceForSummary = isLastSequence ? 50 : 0;
      
      if (this.currentY + spaceNeeded + minSpaceForSummary > this.pageHeight - this.margin) {
        // Only break if it truly won't fit
        this.pdf.addPage();
        this.currentY = this.margin;
      }

      const sequenceTime = sequence.dailySteps.reduce(
        (s, d) => s + d.timeMinutes,
        0
      );
      const sequenceTimeText =
        sequenceTime >= 60
          ? `${Math.floor(sequenceTime / 60)}h ${sequenceTime % 60}m`
          : `${sequenceTime}m`;

      if (sequence.dailySteps.length === 0) {
        // Sequence header (no table)
        this.pdf.setFontSize(9);
        this.pdf.setFont(undefined, 'bold');
        this.pdf.setTextColor(84, 149, 115); // Sage green
        this.pdf.text(sequence.description, this.margin + 4, this.currentY);

        this.pdf.setFontSize(8);
        this.pdf.setFont(undefined, 'italic');
        this.pdf.setTextColor(150, 150, 150);
        this.pdf.text(
          'No daily steps defined',
          this.pageWidth - this.margin,
          this.currentY,
          { align: 'right' }
        );

        this.currentY += 8; // Increased from 6
      } else {
        autoTable(this.pdf, {
          startY: this.currentY,
          head: [
            [
              {
                content: sequence.description,
                colSpan: 2,
                styles: {
                  fontStyle: 'bold',
                  halign: 'left',
                  textColor: [84, 149, 115] // Sage green
                }
              }
            ],
            ['Steps:', `Time: ${sequenceTimeText}`]
          ],
          body: sequence.dailySteps.map(step => {
            const timeText =
              step.timeMinutes >= 60
                ? `${Math.floor(step.timeMinutes / 60)}h ${step.timeMinutes % 60}m`
                : `${step.timeMinutes}m`;

            return [step.description, timeText];
          }),
          theme: 'plain',
          styles: {
            fontSize: 8,
            textColor: this.colors.text as Color,
            cellPadding: { left: 4, top: 2, bottom: 2 },
            lineWidth: 0.1
          },
          headStyles: {
            fontSize: 8,
            fontStyle: 'bold',
            textColor: [80, 80, 80],
            fillColor: [245, 247, 250],
            lineWidth: 0.1
          },
          columnStyles: {
            0: { cellWidth: 110 },
            1: { cellWidth: 25, halign: 'right' }
          },
          margin: { left: this.margin + 6 },
          tableWidth: this.pageWidth - (this.margin * 2) - 12,
          // Let autoTable handle page breaks internally
          didDrawPage: (data) => {
            // Update currentY to the actual final position
            this.currentY = data.cursor.y;
          }
        });

        // Get the final Y position from the table
        const finalY = (this.pdf as any).lastAutoTable?.finalY;
        if (finalY) {
          this.currentY = finalY;
        } else {
          // Estimate position if finalY not available
          this.currentY += 10 + (sequence.dailySteps.length * 6);
        }
      }

      // Spacing between sequences
      this.currentY += 6;
    });

    // Spacing between columns (only if not last column)
    if (columnIndex < columns.length - 1) {
      this.currentY += 10;
    }
  });

  // Check if summary fits on current page
  // Summary box is about 50mm tall
  if (this.currentY + 50 > this.pageHeight - this.margin) {
    this.pdf.addPage();
    this.currentY = this.margin;
  }

  // Add the summary at the end
  this.addSimpleSummary(columns);
}



  private async renderSimpleHierarchy(columns: IkioiColumnData[]): Promise<void> {
  if (columns.length === 0) {
    this.addNoDataMessage();
    return;
  }

  /* ================================
     TITLE (compact)
  ================================= */
  this.pdf.setFontSize(15);
  this.pdf.setFont('helvetica', 'bold');
  this.pdf.setTextColor(...this.colors.text);
  this.pdf.text('Goals Hierarchy', this.margin, this.currentY);
  this.currentY += 7;

  this.pdf.setFontSize(9);
  this.pdf.setFont('helvetica', 'normal');
  this.pdf.setTextColor(...this.colors.textLight);
  this.pdf.text(
    'How goals break down into sequences and daily actions',
    this.margin,
    this.currentY
  );
  this.currentY += 12;

  for (const column of columns) {
    this.ensureSpace(45);

    /* ================================
       GOAL HEADER
    ================================= */
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(...this.colors.primary);
    this.pdf.text(column.category.toUpperCase(), this.margin, this.currentY);
    this.currentY += 4;

    this.pdf.setFontSize(11);
    this.pdf.setTextColor(...this.colors.text);
    this.pdf.text(column.goal, this.margin, this.currentY);

    this.pdf.setFontSize(8);
    this.pdf.setTextColor(...this.colors.textLight);
    this.pdf.text(
      `Target ${column.targetYear}`,
      this.pageWidth - this.margin,
      this.currentY,
      { align: 'right' }
    );
    this.currentY += 7;

    /* ================================
       SEQUENCES
    ================================= */
    if (column.sequences.length === 0) {
      this.pdf.setFontSize(8);
      this.pdf.setFont('helvetica', 'italic');
      this.pdf.setTextColor(...this.colors.textLighter);
      this.pdf.text('No sequences defined', this.margin + 6, this.currentY);
      this.currentY += 6;
    }

    for (const sequence of column.sequences) {
      this.ensureSpace(30);

      // Vertical guide line (lighter + tighter)
      this.pdf.setDrawColor(...this.colors.border);
      this.pdf.setLineWidth(0.25);
      this.pdf.line(
        this.margin + 3,
        this.currentY - 3,
        this.margin + 3,
        this.currentY + 4
      );

      // Sequence label
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor(...this.colors.text);
      this.pdf.text(sequence.description, this.margin + 8, this.currentY);

      // Sequence total time
      const totalTime = sequence.dailySteps.reduce((s, d) => s + d.timeMinutes, 0);
      const timeText =
        totalTime >= 60
          ? `${Math.floor(totalTime / 60)}h ${totalTime % 60}m`
          : `${totalTime}m`;

      this.pdf.setFontSize(8);
      this.pdf.setTextColor(...this.colors.textLight);
      this.pdf.text(
        timeText,
        this.pageWidth - this.margin,
        this.currentY,
        { align: 'right' }
      );
      this.currentY += 6;

      /* ================================
         DAILY STEPS
      ================================= */
      if (sequence.dailySteps.length === 0) {
        this.pdf.setFontSize(7);
        this.pdf.setFont('helvetica', 'italic');
        this.pdf.setTextColor(...this.colors.textLighter);
        this.pdf.text('No daily steps', this.margin + 14, this.currentY);
        this.currentY += 5;
      }

      for (const step of sequence.dailySteps) {
        this.ensureSpace(12);

        // Step bullet
        this.pdf.setFontSize(8);
        this.pdf.setTextColor(...this.colors.text);
        this.pdf.text('-', this.margin + 14, this.currentY);

        // Step text
        this.pdf.setFontSize(8);
        this.pdf.text(step.description, this.margin + 19, this.currentY);

        // Step time
        const stepTime =
          step.timeMinutes >= 60
            ? `${Math.floor(step.timeMinutes / 60)}h ${step.timeMinutes % 60}m`
            : `${step.timeMinutes}m`;

        this.pdf.setFontSize(7);
        this.pdf.setTextColor(...this.colors.textLight);
        this.pdf.text(
          stepTime,
          this.pageWidth - this.margin,
          this.currentY,
          { align: 'right' }
        );
        this.currentY += 5;
      }

      this.currentY += 4;
    }

    /* ================================
       GOAL SEPARATOR
    ================================= */
    this.currentY += 3;
    this.pdf.setDrawColor(...this.colors.border);
    this.pdf.setLineWidth(0.25);
    this.pdf.line(
      this.margin,
      this.currentY,
      this.pageWidth - this.margin,
      this.currentY
    );
    this.currentY += 8;
  }

  this.addSimpleSummary(columns);
}

/* ================================
   SAFE PAGE BREAK HELPER
================================ */
private ensureSpace(required: number): void {
  if (this.currentY + required > this.pageHeight - this.margin) {
    this.pdf.addPage();
    this.currentY = this.margin;
  }
}


 private addSimpleSummary(columns: IkioiColumnData[]): void {
  if (columns.length === 0) return;

  const totalSequences = columns.reduce((sum, col) => sum + col.sequences.length, 0);
  const totalSteps = columns.reduce(
    (sum, col) =>
      sum + col.sequences.reduce((seqSum, seq) => seqSum + seq.dailySteps.length, 0),
    0
  );

  const totalTimeMinutes = columns.reduce(
    (sum, col) =>
      sum +
      col.sequences.reduce(
        (seqSum, seq) =>
          seqSum + seq.dailySteps.reduce((stepSum, step) => stepSum + step.timeMinutes, 0),
        0
      ),
    0
  );

  const totalHours = Math.floor(totalTimeMinutes / 60);
  const totalMinutes = totalTimeMinutes % 60;
  const totalTime =
    totalHours > 0 ? `${totalHours}h ${totalMinutes}m` : `${totalMinutes}m`;

  const boxHeight = 36;
  const boxY = this.currentY + 8;
  const boxWidth = this.pageWidth - this.margin * 2;

  /* ================================
     BACKGROUND
  ================================= */
  this.pdf.setFillColor(...this.colors.background);
  this.pdf.rect(this.margin, boxY, boxWidth, boxHeight, 'F');

  /* ================================
     TITLE
  ================================= */
  this.pdf.setFontSize(11);
  this.pdf.setFont('helvetica', 'bold');
  this.pdf.setTextColor(...this.colors.text);
  this.pdf.text('Summary', this.margin + 10, boxY + 10);

  /* ================================
     LEFT COLUMN — COUNTS
  ================================= */
  const leftX = this.margin + 12;
  const labelX = leftX;
  const valueX = leftX + 45;

  this.pdf.setFontSize(9);
  this.pdf.setFont('helvetica', 'normal');
  this.pdf.setTextColor(...this.colors.textLight);

  this.pdf.text('Goals', labelX, boxY + 18);
  this.pdf.text('Sequences', labelX, boxY + 24);
  this.pdf.text('Daily Steps', labelX, boxY + 30);

  this.pdf.setFont('helvetica', 'bold');
  this.pdf.setTextColor(...this.colors.text);

  this.pdf.text(String(columns.length), valueX, boxY + 18);
  this.pdf.text(String(totalSequences), valueX, boxY + 24);
  this.pdf.text(String(totalSteps), valueX, boxY + 30);

  /* ================================
     RIGHT COLUMN — TOTAL TIME
  ================================= */
  const rightX = this.pageWidth - this.margin - 12;

  this.pdf.setFont('helvetica', 'normal');
  this.pdf.setFontSize(9);
  this.pdf.setTextColor(...this.colors.textLight);
  this.pdf.text('Total Time', rightX, boxY + 18, { align: 'right' });

  this.pdf.setFont('helvetica', 'bold');
  this.pdf.setFontSize(14);
  this.pdf.setTextColor(...this.colors.accent);
  this.pdf.text(totalTime, rightX, boxY + 30, { align: 'right' });

  this.currentY = boxY + boxHeight;
}


  private addFooter(): void {
    const totalPages = this.pdf.getNumberOfPages();
    
    for (let i = 1; i <= totalPages; i++) {
      this.pdf.setPage(i);
      
      // Footer with light background
      this.pdf.setFillColor(this.colors.background[0], this.colors.background[1], this.colors.background[2]);
      this.pdf.rect(0, this.pageHeight - 12, this.pageWidth, 12, 'F');
      
      // Separator line
      this.pdf.setDrawColor(this.colors.border[0], this.colors.border[1], this.colors.border[2]);
      this.pdf.line(this.margin, this.pageHeight - 12, this.pageWidth - this.margin, this.pageHeight - 12);
      
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(this.colors.textLight[0], this.colors.textLight[1], this.colors.textLight[2]);
      
      // Page number
      this.pdf.text(
        `Page ${i} of ${totalPages}`,
        this.pageWidth - this.margin,
        this.pageHeight - 5,
        { align: 'right' }
      );
      
      // Copyright
      this.pdf.text(
        'Ikioi Productivity System',
        this.margin,
        this.pageHeight - 5
      );
      
      // Export date
      const exportDate = new Date().toLocaleDateString();
      this.pdf.text(
        exportDate,
        this.pageWidth / 2,
        this.pageHeight - 5,
        { align: 'center' }
      );
    }
  }

  private renderColumnCard(
    column: IkioiColumnData,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    // Card with subtle background
    this.pdf.setFillColor(this.colors.background[0], this.colors.background[1], this.colors.background[2]);
    this.pdf.roundedRect(x, y, width, height, 2, 2, 'F');
    
    // Category label with primary color
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(this.colors.primary[0], this.colors.primary[1], this.colors.primary[2]);
    this.pdf.text(column.category || 'General', x + 5, y + 8);
    
    // Goal title
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(this.colors.text[0], this.colors.text[1], this.colors.text[2]);
    const goalLines = this.wrapText(column.goal, width - 10);
    goalLines.forEach((line, index) => {
      this.pdf.text(line, x + 5, y + 20 + (index * 5));
    });
    
    // Stats
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(this.colors.textLight[0], this.colors.textLight[1], this.colors.textLight[2]);
    this.pdf.text(`Target Year: ${column.targetYear}`, x + 5, y + 35);
    
    const seqCount = column.sequences.length;
    const stepCount = column.sequences.reduce((sum, seq) => sum + seq.dailySteps.length, 0);
    this.pdf.text(`Steps: ${stepCount}`, x + width - 5, y + 35, { align: 'right' });
    
    // Preview first sequence if exists
    if (column.sequences.length > 0) {
      this.pdf.setDrawColor(this.colors.border[0], this.colors.border[1], this.colors.border[2]);
      this.pdf.line(x, y + 40, x + width, y + 40);
      
      const firstSeq = column.sequences[0];
      this.pdf.setFontSize(7);
      
      const seqText = firstSeq.description.length > 25 
        ? firstSeq.description.substring(0, 22) + '...' 
        : firstSeq.description;
      
      this.pdf.text(`• ${seqText}`, x + 5, y + 47);
    }
    
    // Card border
    this.pdf.setDrawColor(this.colors.border[0], this.colors.border[1], this.colors.border[2]);
    this.pdf.roundedRect(x, y, width, height, 2, 2, 'D');
  }

  private addNoDataMessage(): void {
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'italic');
    this.pdf.setTextColor(this.colors.textLighter[0], this.colors.textLighter[1], this.colors.textLighter[2]);
    this.pdf.text('No goals to display', this.pageWidth / 2, this.currentY + 50, { align: 'center' });
    
    this.pdf.setFontSize(10);
    this.pdf.text('Start by adding goals to your whiteboard', this.pageWidth / 2, this.currentY + 60, { align: 'center' });
  }

  private hexToRgb(hex: string): [number, number, number] {
    // Remove # if present
    const hexColor = hex.replace('#', '');
    
    // Parse the hex color
    if (hexColor.length === 3) {
      // Short hex notation (#RGB)
      const r = parseInt(hexColor[0] + hexColor[0], 16);
      const g = parseInt(hexColor[1] + hexColor[1], 16);
      const b = parseInt(hexColor[2] + hexColor[2], 16);
      return [r, g, b];
    } else if (hexColor.length === 6) {
      // Full hex notation (#RRGGBB)
      const r = parseInt(hexColor.substring(0, 2), 16);
      const g = parseInt(hexColor.substring(2, 4), 16);
      const b = parseInt(hexColor.substring(4, 6), 16);
      return [r, g, b];
    }
    
    // Default sage green color if parsing fails
    return [this.colors.primary[0], this.colors.primary[1], this.colors.primary[2]];
  }

  private getLevelLabel(level: string): string {
    switch(level) {
      case 'goal': return 'GOAL';
      case 'sequence': return 'SEQ';
      case 'step': return 'STEP';
      default: return '';
    }
  }

  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine + ' ' + word;
      
      // Simple width estimation based on character count
      const estimatedWidth = testLine.length * 2; // Rough estimation in mm
      
      if (estimatedWidth < maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    
    lines.push(currentLine);
    return lines.slice(0, 3); // Limit to 3 lines max
  }
}