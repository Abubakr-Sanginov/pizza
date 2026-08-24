import React from "react";
import Link from "next/link";
import { cn } from "@/shared/lib/utils";

interface Props {
  title: string;
  href?: string;
  linkText?: string;
  className?: string;
}

export const SectionHeader: React.FC<Props> = ({
  title,
  href,
  linkText,
  className,
}) => {
  return (
    <div
      className={cn("flex items-baseline gap-3 md:gap-4 mb-6 md:mb-8", className)}
    >
      <h2 className="font-display text-[26px] md:text-[34px] leading-none shrink-0">
        {title}
      </h2>
      <span aria-hidden className="menu-leader hidden sm:block" />
      {href && linkText && (
        <Link
          href={href}
          className="text-sm font-bold text-primary hover:underline underline-offset-4 decoration-2 whitespace-nowrap shrink-0"
        >
          {linkText}
        </Link>
      )}
    </div>
  );
};
