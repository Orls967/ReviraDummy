import { DropdownMenu as MenuPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '../../lib/cn';

export const DropdownMenu = MenuPrimitive.Root;
export const DropdownMenuTrigger = MenuPrimitive.Trigger;

export function DropdownMenuContent({ className, ...props }: ComponentProps<typeof MenuPrimitive.Content>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        align="end"
        sideOffset={4}
        className={cn('z-50 min-w-44 origin-(--radix-dropdown-menu-content-transform-origin) animate-menu-in overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md', className)}
        {...props}
      />
    </MenuPrimitive.Portal>
  );
}

type DropdownMenuItemProps = ComponentProps<typeof MenuPrimitive.Item> & { destructive?: boolean };

export function DropdownMenuItem({ className, destructive = false, ...props }: DropdownMenuItemProps) {
  return (
    <MenuPrimitive.Item
      className={cn(
        'relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
        destructive && 'text-destructive focus:bg-destructive/10 focus:text-destructive',
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof MenuPrimitive.Separator>) {
  return <MenuPrimitive.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />;
}
