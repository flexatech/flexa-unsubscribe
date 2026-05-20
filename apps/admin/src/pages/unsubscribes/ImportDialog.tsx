import { useRef, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { AlertCircle, CheckCircle2, FileUp, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { showToast } from '@/lib/toast';
import { useImportUnsubscribesMutation } from '@/lib/queries/unsubscribes';
import type { ImportResult } from '@/lib/api/unsubscribes';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Two-screen modal: a file-picker screen, then a result-summary screen
 * once the import returns. Closing the dialog (or hitting "Import
 * another file") resets state so the next open starts fresh.
 *
 * The CSV format note matches the server-side controller: Email
 * required, Reason and Date optional, header row auto-detected. A
 * "Download sample" link generates a 2-row example via data URL so
 * users can see the exact shape without a network round-trip.
 */
export function ImportDialog({ open, onOpenChange }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mutation = useImportUnsubscribesMutation();

  function reset() {
    setFile(null);
    setResult(null);
    mutation.reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      reset();
    }
    onOpenChange(next);
  }

  async function handleSubmit() {
    if (!file) return;
    try {
      const res = await mutation.mutateAsync(file);
      setResult(res);
      if (res.imported > 0) {
        showToast.success(
          sprintf(
            /* translators: %d: number of newly imported unsubscribe records. */
            __('%d records imported.', 'flexa-unsubscribe'),
            res.imported,
          ),
        );
      }
    } catch {
      // Error is surfaced via `mutation.error` below - no toast.
    }
  }

  const sampleHref =
    'data:text/csv;charset=utf-8,' +
    encodeURIComponent(
      'Email,Reason,Date\n' +
        'first@example.com,Too many emails,2024-01-15\n' +
        'second@example.com,,\n',
    );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{__('Import unsubscribes from CSV', 'flexa-unsubscribe')}</DialogTitle>
          <DialogDescription>
            {__(
              'Upload a CSV file to bulk-add unsubscribe records. Existing emails are skipped.',
              'flexa-unsubscribe',
            )}
          </DialogDescription>
        </DialogHeader>

        {result === null ? (
          <ImportPickStep
            file={file}
            onFileChange={setFile}
            fileInputRef={fileInputRef}
            sampleHref={sampleHref}
            error={mutation.error?.message ?? null}
            isPending={mutation.isPending}
          />
        ) : (
          <ImportResultStep result={result} />
        )}

        <DialogFooter>
          {result === null ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={mutation.isPending}
              >
                {__('Cancel', 'flexa-unsubscribe')}
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={!file || mutation.isPending}>
                <Upload />
                {mutation.isPending
                  ? __('Importing…', 'flexa-unsubscribe')
                  : __('Import', 'flexa-unsubscribe')}
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={reset}>
                {__('Import another file', 'flexa-unsubscribe')}
              </Button>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                {__('Done', 'flexa-unsubscribe')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface PickStepProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  sampleHref: string;
  error: string | null;
  isPending: boolean;
}

function ImportPickStep({
  file,
  onFileChange,
  fileInputRef,
  sampleHref,
  error,
  isPending,
}: PickStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <label
        htmlFor="flexa-import-file"
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-muted/30 p-6 text-center transition hover:border-primary/60 hover:bg-muted/50"
      >
        <FileUp className="size-8 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-medium">
          {file
            ? file.name
            : __('Click to choose a CSV file', 'flexa-unsubscribe')}
        </span>
        <span className="text-xs text-muted-foreground">
          {__('Maximum 2 MB · 10,000 rows', 'flexa-unsubscribe')}
        </span>
        <input
          ref={fileInputRef}
          id="flexa-import-file"
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          disabled={isPending}
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />
      </label>

      <div className="rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">
          {__('CSV format', 'flexa-unsubscribe')}
        </p>
        <p>
          {__(
            'Columns: Email (required), Reason (optional), Date (optional). A header row is auto-detected.',
            'flexa-unsubscribe',
          )}
        </p>
        <p className="mt-2">
          <a
            href={sampleHref}
            download="flexa-unsubscribes-sample.csv"
            className="text-primary underline-offset-2 hover:underline"
          >
            {__('Download sample CSV', 'flexa-unsubscribe')}
          </a>
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

function ImportResultStep({ result }: { result: ImportResult }) {
  const { imported, skipped_duplicate, failed_count, failed } = result;
  const hasErrors = failed_count > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat
          label={__('Imported', 'flexa-unsubscribe')}
          value={imported}
          tone="success"
        />
        <Stat
          label={__('Skipped', 'flexa-unsubscribe')}
          value={skipped_duplicate}
          tone="muted"
        />
        <Stat
          label={__('Failed', 'flexa-unsubscribe')}
          value={failed_count}
          tone={hasErrors ? 'destructive' : 'muted'}
        />
      </div>

      {imported > 0 && skipped_duplicate === 0 && !hasErrors && (
        <div className="flex items-start gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{__('All rows imported successfully.', 'flexa-unsubscribe')}</span>
        </div>
      )}

      {skipped_duplicate > 0 && (
        <p className="text-xs text-muted-foreground">
          {sprintf(
            /* translators: %d: number of CSV rows skipped because the email was already unsubscribed. */
            __(
              '%d rows were skipped because the email was already in the unsubscribes list.',
              'flexa-unsubscribe',
            ),
            skipped_duplicate,
          )}
        </p>
      )}

      {hasErrors && (
        <details className="rounded-md border border-border bg-muted/30 p-3 text-xs">
          <summary className="cursor-pointer font-medium text-foreground">
            {sprintf(
              /* translators: %d: number of CSV rows that failed to import. */
              __('%d failed rows', 'flexa-unsubscribe'),
              failed_count,
            )}
          </summary>
          <ul className="mt-2 flex flex-col gap-1">
            {failed.map((f) => (
              <li key={`${f.row}-${f.email}`} className="text-muted-foreground">
                <span className="font-mono text-foreground">
                  {sprintf(
                    /* translators: %d: CSV row number that failed (1-indexed). */
                    __('Row %d', 'flexa-unsubscribe'),
                    f.row,
                  )}
                </span>
                {f.email && (
                  <>
                    {' · '}
                    <span className="font-mono">{f.email}</span>
                  </>
                )}
                {' — '}
                {f.error}
              </li>
            ))}
            {failed.length < failed_count && (
              <li className="italic text-muted-foreground">
                {sprintf(
                  /* translators: %d: number of additional errors not shown. */
                  __('… and %d more errors not shown.', 'flexa-unsubscribe'),
                  failed_count - failed.length,
                )}
              </li>
            )}
          </ul>
        </details>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'success' | 'muted' | 'destructive';
}) {
  const toneClass =
    tone === 'success'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'destructive'
        ? 'text-destructive'
        : 'text-muted-foreground';
  return (
    <div className="rounded-md border border-border bg-background p-3 text-center">
      <div className={`text-2xl font-semibold ${toneClass}`}>{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
