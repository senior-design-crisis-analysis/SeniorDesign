<<<<<<< HEAD
import * as React from "react";

import { cn } from "@/lib/utils";
=======
import * as React from "react"

import { cn } from "@/lib/utils"
>>>>>>> ada522895db17382558e1210d4ac6962414f9051

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
<<<<<<< HEAD
  );
=======
  )
>>>>>>> ada522895db17382558e1210d4ac6962414f9051
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
<<<<<<< HEAD
  );
=======
  )
>>>>>>> ada522895db17382558e1210d4ac6962414f9051
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
<<<<<<< HEAD
  );
=======
  )
>>>>>>> ada522895db17382558e1210d4ac6962414f9051
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
<<<<<<< HEAD
  );
=======
  )
>>>>>>> ada522895db17382558e1210d4ac6962414f9051
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
<<<<<<< HEAD
  );
=======
  )
>>>>>>> ada522895db17382558e1210d4ac6962414f9051
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
<<<<<<< HEAD
  );
=======
  )
>>>>>>> ada522895db17382558e1210d4ac6962414f9051
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
<<<<<<< HEAD
  );
=======
  )
>>>>>>> ada522895db17382558e1210d4ac6962414f9051
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
<<<<<<< HEAD
};
=======
}
>>>>>>> ada522895db17382558e1210d4ac6962414f9051
