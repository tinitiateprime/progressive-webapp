import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "../../lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

export function SheetContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Dialog.Content>) {
  return (
    <Dialog.Portal>
      {/* Overlay */}
      <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" />

      {/* Content */}
      <Dialog.Content
        className={cn(
          "fixed z-[110] top-0 left-0 h-full w-[86vw] max-w-sm",
          "bg-background text-foreground",
          "border-r border-border",
          "p-4",
          "shadow-soft",
          "transition-transform duration-300 ease-out",
          "data-[state=open]:translate-x-0 data-[state=closed]:-translate-x-full",
          className
        )}
        {...props}
      >
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}
