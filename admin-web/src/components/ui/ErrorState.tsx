import { RefreshCw } from 'lucide-react';
import { Alert } from './Alert';
import { Button } from './Button';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export function ErrorState({ message, onRetry, isRetrying = false }: ErrorStateProps) {
  return (
    <div className="p-5">
      <Alert tone="danger">
        <p className="font-medium">Data gagal dimuat</p>
        <p>{message}</p>
        <div>
          <Button variant="outline" size="sm" className="mt-1" onClick={onRetry} isLoading={isRetrying}>
            {!isRetrying && <RefreshCw aria-hidden="true" />}
            Coba lagi
          </Button>
        </div>
      </Alert>
    </div>
  );
}
