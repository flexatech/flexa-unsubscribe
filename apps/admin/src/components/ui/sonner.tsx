import { Toaster as SonnerToaster, type ToasterProps } from 'sonner';

export function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'bg-card text-card-foreground border border-border shadow-lg',
        },
      }}
      {...props}
    />
  );
}
