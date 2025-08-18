import React from 'react';
import { Download, FileText, File, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface ConversionRecord {
  id: string;
  originalName: string;
  convertedName: string;
  fromType: string;
  toType: string;
  timestamp: Date;
  downloadUrl?: string;
}

interface ConversionHistoryProps {
  history: ConversionRecord[];
  onDownload: (record: ConversionRecord) => void;
}

export const ConversionHistory: React.FC<ConversionHistoryProps> = ({
  history,
  onDownload,
}) => {
  if (history.length === 0) {
    return (
      <div className="bg-gradient-card rounded-xl p-8 shadow-soft text-center">
        <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No conversion history yet</p>
      </div>
    );
  }

  const getFileIcon = (type: string) => {
    if (type.toLowerCase().includes('pdf')) {
      return <File className="w-5 h-5 text-red-500" />;
    }
    return <FileText className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="bg-gradient-card rounded-xl p-6 shadow-medium">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Recent Conversions</h3>
      <div className="space-y-3">
        {history.map((record) => (
          <div
            key={record.id}
            className="flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:shadow-soft transition-smooth"
          >
            <div className="flex items-center space-x-3">
              {getFileIcon(record.toType)}
              <div>
                <p className="font-medium text-foreground">{record.convertedName}</p>
                <p className="text-sm text-muted-foreground">
                  {record.fromType.toUpperCase()} → {record.toType.toUpperCase()} •{' '}
                  {formatDistanceToNow(record.timestamp, { addSuffix: true })}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDownload(record)}
              className="text-primary hover:text-primary"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};