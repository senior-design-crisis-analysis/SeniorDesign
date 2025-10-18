import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils.ts";

const badgeVariants = cva(
  "items-center justify-center rounded-full text-[12px] font-medium w-fit h-[22px]",
  {
    variants: {
      variant: {
        disaster: "rounded-full text-black",
        help_alert: "rounded-full text-white",
      },
    },
    defaultVariants: {
      variant: "disaster",
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
