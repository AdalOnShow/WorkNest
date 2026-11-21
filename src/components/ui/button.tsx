import * as React from 'react'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { cn } from '#/lib/utils.ts'

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-sm font-medium tracking-wide whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out outline-none active:scale-[0.98] focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Solid and outlined buttons use the chamfered (cut-corner) shape.
        // clip-path hides outer focus rings, so those variants draw the ring inset.
        default:
          'chamfer rounded-none bg-foreground text-background hover:bg-foreground/85 focus-visible:ring-inset',
        destructive:
          'chamfer rounded-none bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-inset focus-visible:ring-white/40',
        outline:
          'chamfer chamfer-frame rounded-none bg-background hover:bg-muted focus-visible:ring-inset',
        secondary:
          'chamfer rounded-none bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-inset',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 py-2 has-[>svg]:px-4',
        xs: "h-6 gap-1 px-2.5 text-xs [--cut:4px] has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8 gap-1.5 px-3.5 [--cut:6px] has-[>svg]:px-3',
        lg: 'h-11 px-6 has-[>svg]:px-5',
        icon: 'size-10',
        'icon-xs': "size-6 [--cut:4px] [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8 [--cut:6px]',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
