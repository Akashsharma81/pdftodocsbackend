import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface ConversionProgressProps {
  status: 'idle' | 'uploading' | 'converting' | 'completed' | 'error';
  progress: number;
  fileName?: string;
  errorMessage?: string;
}

export const ConversionProgress: React.FC<ConversionProgressProps> = ({
  status,
  progress,
  fileName,
  errorMessage,
}) => {
  const getStatusMessage = () => {
    switch (status) {
      case 'uploading':
        return 'Uploading file...';
      case 'converting':
        return `Converting ${fileName}...`;
      case 'completed':
        return 'Conversion completed successfully!';
      case 'error':
        return 'Conversion failed';
      default:
        return '';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
      case 'converting':
        return <Loader2 className="w-5 h-5 animate-spin text-primary" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return null;
    }
  };

  if (status === 'idle') return null;

  return (
    <div className="bg-gradient-card rounded-xl p-6 shadow-medium">
      <div className="flex items-center space-x-3 mb-4">
        {getStatusIcon()}
        <span className="font-medium text-foreground">{getStatusMessage()}</span>
      </div>

      {(status === 'uploading' || status === 'converting') && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground text-right">{progress}%</p>
        </div>
      )}

      {status === 'error' && errorMessage && (
        <p className="text-sm text-destructive mt-2">{errorMessage}</p>
      )}
    </div>
  );
};