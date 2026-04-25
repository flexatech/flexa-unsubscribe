import { __ } from '@wordpress/i18n';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-3xl font-bold text-foreground">404</h1>
      <p className="text-muted-foreground">{__('Page not found.')}</p>
      <Button asChild>
        <Link to="/">{__('Back to dashboard')}</Link>
      </Button>
    </div>
  );
}
