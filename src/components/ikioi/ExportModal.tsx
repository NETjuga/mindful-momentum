import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Table, 
  Layers,
  X,
  Check,
  Settings,
  Eye,
  EyeOff,
  Calendar,
  BarChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';

export interface ExportOptions {
  format: 'pdf' | 'png' | 'json' | 'csv';
  layout: 'whiteboard' | 'table' | 'hierarchy';
  includeMetadata: boolean;
  includeStatistics: boolean;
  theme: 'light' | 'dark' | 'print';
  fileName: string;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  userName: string;
  columnsCount: number;
  isLoading?: boolean;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  userName,
  columnsCount,
  isLoading = false
}) => {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'pdf',
    layout: 'whiteboard',
    includeMetadata: true,
    includeStatistics: true,
    theme: 'print',
    fileName: `ikioi-${userName}-${new Date().toISOString().split('T')[0]}`
  });

  const handleExport = () => {
    onExport(options);
  };

  const handleFormatChange = (format: ExportOptions['format']) => {
    setOptions(prev => ({ ...prev, format }));
    
    // Adjust layout based on format
    if (format === 'csv' || format === 'json') {
      setOptions(prev => ({ ...prev, layout: 'table' }));
    }
  };

  const handleLayoutChange = (layout: ExportOptions['layout']) => {
    setOptions(prev => ({ ...prev, layout }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-700">
        {/* Header - Fixed at top */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Export Whiteboard
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Export your goals and sequences
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto flex-1 p-4">
          <div className="space-y-5">
            {/* Format Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Settings className="h-4 w-4" />
                Export Format
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'pdf', label: 'PDF', icon: FileText, color: 'bg-blue-500' },
                  { value: 'png', label: 'PNG', icon: ImageIcon, color: 'bg-green-500' },
                  { value: 'json', label: 'JSON', icon: Layers, color: 'bg-purple-500' },
                  { value: 'csv', label: 'CSV', icon: Table, color: 'bg-orange-500' }
                ].map((format) => (
                  <button
                    key={format.value}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      options.format === format.value
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => handleFormatChange(format.value as any)}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className={`p-2 rounded-lg ${format.color} text-white`}>
                        <format.icon className="h-4 w-4" />
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {format.label}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Selection (only for PDF) */}
            {options.format === 'pdf' && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Layers className="h-4 w-4" />
                  Layout Style
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'whiteboard', label: 'Board', icon: Eye },
                    { value: 'table', label: 'Table', icon: Table },
                    { value: 'hierarchy', label: 'Tree', icon: BarChart }
                  ].map((layout) => (
                    <button
                      key={layout.value}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        options.layout === layout.value
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => handleLayoutChange(layout.value as any)}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <layout.icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-xs font-medium">{layout.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Options */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Eye className="h-4 w-4" />
                Options
              </Label>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="include-metadata" className="text-xs">
                      Include metadata
                    </Label>
                  </div>
                  <Switch
                    id="include-metadata"
                    checked={options.includeMetadata}
                    onCheckedChange={(checked) =>
                      setOptions(prev => ({ ...prev, includeMetadata: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="include-statistics" className="text-xs">
                      Include statistics
                    </Label>
                  </div>
                  <Switch
                    id="include-statistics"
                    checked={options.includeStatistics}
                    onCheckedChange={(checked) =>
                      setOptions(prev => ({ ...prev, includeStatistics: checked }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* File Name */}
            <div className="space-y-2">
              <Label htmlFor="filename" className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                File Name
              </Label>
              <input
                id="filename"
                type="text"
                value={options.fileName}
                onChange={(e) => setOptions(prev => ({ ...prev, fileName: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500">
                Saves as: {options.fileName}.{options.format}
              </p>
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Export Summary
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {options.format.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Goals:</span>
                  <span className="font-medium">{columnsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Layout:</span>
                  <span className="font-medium capitalize">{options.layout}</span>
                </div>
                <div className="flex justify-between">
                  <span>Includes:</span>
                  <span className="font-medium">
                    {options.includeMetadata ? 'Metadata' : ''}
                    {options.includeMetadata && options.includeStatistics ? ', ' : ''}
                    {options.includeStatistics ? 'Stats' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            size="sm"
            className="text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isLoading || columnsCount === 0}
            size="sm"
            className="gap-2 text-sm"
          >
            {isLoading ? (
              <>
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-3 w-3" />
                Export
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;