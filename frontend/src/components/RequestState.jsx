import { AlertCircle, LoaderCircle } from 'lucide-react';

export function ErrorNotice({ message, onRetry, retryLabel = 'Retry' }) {
    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between" role="alert">
            <span className="flex min-w-0 items-start gap-2 wrap-break-words">
                <AlertCircle className="mt-0.5 shrink-0" size={18} />
                {message}
            </span>
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="min-h-11 shrink-0 rounded-xl border border-red-200 bg-white px-4 py-2 font-bold transition-colors hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                >
                    {retryLabel}
                </button>
            )}
        </div>
    );
}

export function LoadingNotice({ message = 'Loading...' }) {
    return (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-6 text-sm font-semibold text-blue-800" role="status" aria-live="polite">
            <LoaderCircle className="animate-spin motion-reduce:animate-none" size={18} />
            {message}
        </div>
    );
}
