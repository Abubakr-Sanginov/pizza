// components/shared/search-input.tsx
"use client";

import { cn } from "@/lib/utils";
import { Api } from "@/services/api-client";
import { Product } from "@prisma/client";
import { Search } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useClickAway, useDebounce } from "react-use";

interface Props {
  className?: string;
}

export const SearchInput: React.FC<Props> = ({ className }) => {
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [focused, setFocused] = React.useState<boolean>(false);
  const [products, setProducts] = React.useState<Product[]>([]);
  const ref = React.useRef<HTMLDivElement | null>(null);

  useClickAway(ref, () => {
    setFocused(false);
  });

  // 1) Обёртка для запроса, зависит от searchQuery:
  const doSearch = React.useCallback(async () => {
    try {
      const result: Product[] = await Api.products.search(searchQuery);
      setProducts(result);
    } catch (err: unknown) {
      console.error("Search error:", err);
    }
  }, [searchQuery]);

  // 2) Debounce: вызовет doSearch() через 300 мс после последнего изменения searchQuery
  useDebounce(doSearch, 300, [doSearch]);

  const onClickItem = React.useCallback(() => {
    setFocused(false);
    setSearchQuery("");
    setProducts([]);
  }, []);

  return (
    <>
      {focused && (
        <div className="fixed inset-0 bg-black/50 z-30" />
      )}
      <div
        ref={ref}
        className={cn(
          "flex rounded-2xl flex-1 justify-between relative h-11 z-30",
          className
        )}
      >
        <Search className="absolute top-1/2 -translate-y-1/2 left-3 h-5 text-gray-400" />
        <input
          className="rounded-2xl outline-none w-full bg-gray-100 pl-11"
          type="text"
          placeholder="Найти пиццу..."
          value={searchQuery}
          onFocus={() => setFocused(true)}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
        />

        {products.length > 0 && (
          <div
            className={cn(
              "absolute w-full bg-white rounded-xl py-2 top-14 shadow-md transition-all duration-200 invisible opacity-0 z-30",
              focused && "visible opacity-100 top-12"
            )}
          >
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                onClick={onClickItem}
                className="flex items-center gap-3 w-full px-3 py-2 hover:bg-primary/10"
              >
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  width={32}
                  height={32}
                  className="rounded-sm h-8 w-8"
                />
                <span>{product.name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
