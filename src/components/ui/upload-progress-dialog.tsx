'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface UploadProgressDialogProps {
  isOpen: boolean;
  fileName: string;
  status: 'queued' | 'processing' | 'complete' | 'error' | 'failed';
  progressPercent: number;
  message: string;
  onOpenChange?: (open: boolean) => void;
}

export function UploadProgressDialog({
  isOpen,
  fileName,
  status,
  progressPercent,
  message,
  onOpenChange,
}: UploadProgressDialogProps) {
  const isComplete = status === 'complete';
  const isError = status === 'error' || status === 'failed';
  const isProcessing = status === 'processing' || status === 'queued';

  const getStatusIcon = () => {
    if (isComplete) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
    if (isError) {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    if (isProcessing) {
      return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    }
    return null;
  };

  const getProgressColor = () => {
    if (isComplete) return 'bg-green-500';
    if (isError) return 'bg-red-500';
    return 'bg-blue-500';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Document Upload
          </DialogTitle>
          <DialogDescription className="truncate">{fileName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="text-muted-foreground">{progressPercent}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Status Message */}
          {message && (
            <div className={`p-3 rounded-md text-sm ${
              isError ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              {message}
            </div>
          )}

          {/* Status Text */}
          <div className="text-center text-sm">
            {isProcessing && (
              <p className="text-muted-foreground">
                {status === 'queued' ? 'Waiting to process...' : 'Processing document...'}
              </p>
            )}
            {isComplete && <p className="text-green-600 font-medium">Upload complete!</p>}
            {isError && <p className="text-red-600 font-medium">Upload failed</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
