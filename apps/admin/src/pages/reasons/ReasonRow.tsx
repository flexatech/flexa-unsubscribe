import { useEffect, useRef, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { ArrowDown, ArrowUp, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Reason } from '@/lib/api/reasons';

interface Props {
  reason: Reason;
  index: number;
  total: number;
  disabled?: boolean;
  onRename: (id: number, newText: string) => void;
  onMoveUp: (id: number) => void;
  onMoveDown: (id: number) => void;
  onDelete: (reason: Reason) => void;
}

/**
 * One row in the reasons list.
 *
 * Display mode: click the text (or the Edit dropdown item) to flip to
 * edit mode - an inline `<Input>` replaces the span. Enter and blur
 * (click-away) both commit; Esc reverts. Matches the convention used
 * by Notion / Linear / Sheets - users expect clicking out to save the
 * value they just typed, not to throw it away. `commit()` is a no-op
 * when the trimmed draft is empty or unchanged, so accidental blurs
 * on stray clicks are still safe.
 */
export function ReasonRow({
  reason,
  index,
  total,
  disabled,
  onRename,
  onMoveUp,
  onMoveDown,
  onDelete,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(reason.reason_text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(reason.reason_text);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [editing, reason.reason_text]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== reason.reason_text) {
      onRename(reason.id, trimmed);
    }
    setEditing(false);
  }

  function cancel() {
    setEditing(false);
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 border-b border-border last:border-0',
        'hover:bg-muted/40 transition-colors',
      )}
    >
      {/* Arrows */}
      <div className="flex flex-col">
        <button
          type="button"
          aria-label={__('Move up', 'flexa-unsubscribe')}
          disabled={disabled || index === 0}
          onClick={() => onMoveUp(reason.id)}
          className="h-5 w-5 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowUp className="size-3" />
        </button>
        <button
          type="button"
          aria-label={__('Move down', 'flexa-unsubscribe')}
          disabled={disabled || index === total - 1}
          onClick={() => onMoveDown(reason.id)}
          className="h-5 w-5 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowDown className="size-3" />
        </button>
      </div>

      {/* Reason text */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <Input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commit();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
              }
            }}
            className="h-8"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="block w-full text-left text-sm text-foreground truncate hover:underline cursor-text"
            title={__('Click to edit', 'flexa-unsubscribe')}
          >
            {reason.reason_text}
          </button>
        )}
      </div>

      {/* Sort order badge (read-only) */}
      <span className="text-xs text-muted-foreground font-mono tabular-nums w-6 text-right">
        {reason.sort_order}
      </span>

      {/* Row actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={sprintf(
              /* translators: %s: reason text */
              __('Actions for %s', 'flexa-unsubscribe'),
              reason.reason_text,
            )}
            className="h-7 w-7"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditing(true)}>
            <Pencil />
            {__('Edit', 'flexa-unsubscribe')}
          </DropdownMenuItem>
          <DropdownMenuItem destructive onClick={() => onDelete(reason)}>
            <Trash2 />
            {__('Delete', 'flexa-unsubscribe')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
