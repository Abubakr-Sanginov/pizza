"use client";

import { cn } from "@/shared/lib/utils";
import { Api } from "@/back/services/api-client";
import { Product } from "@prisma/client";
import { Search, Clock, X, SearchX } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useClickAway, useDebounce } from "react-use";
import { motion, AnimatePresence } from "framer-motion";
import { recordSearch } from "@/app/actions";

interface Props {
  className?: string;
  placeholder?: string;
}

export const SearchInput: React.FC<Props> = ({ className, placeholder }) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [focused, setFocused] = React.useState(false);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [history, setHistory] = React.useState<string[]>([]);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const savedHistory = localStorage.getItem("search_history");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  useClickAway(ref, () => {
    setFocused(false);
  });

  useDebounce(
    async () => {
      try {
        if (searchQuery) {
          const response = await Api.products.search(searchQuery);
          setProducts(response);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.log(error);
      }
    },
    250,
    [searchQuery],
  );

  const onClickItem = (productName: string) => {
    setFocused(false);
    setSearchQuery("");
    setProducts([]);
    recordSearch(productName);

    const newHistory = [
      productName,
      ...history.filter((h) => h !== productName),
    ].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem("search_history", JSON.stringify(newHistory));
  };

  const removeHistoryItem = (e: React.MouseEvent, item: string) => {
    e.preventDefault();
    e.stopPropagation();
    const newHistory = history.filter((h) => h !== item);
    setHistory(newHistory);
    localStorage.setItem("search_history", JSON.stringify(newHistory));
  };

  const clearHistory = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setHistory([]);
    localStorage.removeItem("search_history");
  };

  return (
    <>
      {focused && (
        <div className="fixed top-0 left-0 bottom-0 right-0 bg-black/50 z-30 transition-all duration-300" />
      )}

      <div
        ref={ref}
        className={cn(
          "flex rounded-2xl flex-1 justify-between relative h-11 z-30",
          className,
        )}
      >
        <Search className="absolute top-1/2 translate-y-[-50%] left-3 h-5 text-muted-foreground" />
        <input
          className="rounded-2xl outline-none w-full bg-muted text-foreground placeholder:text-muted-foreground pl-11 focus:bg-card transition-all duration-300"
          type="text"
          placeholder={placeholder ?? "Найти пиццу..."}
          onFocus={() => setFocused(true)}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <AnimatePresence>
          {focused && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-0 right-0 md:min-w-[480px] bg-card text-card-foreground rounded-2xl py-3 top-14 shadow-2xl z-30 border border-border overflow-hidden"
            >
              {searchQuery && products.length > 0 && (
                <div className="max-h-[420px] overflow-y-auto">
                  {products.map((product) => (
                    <Link
                      onClick={() => onClickItem(product.name)}
                      key={product.id}
                      className="flex items-center gap-4 w-full px-5 py-3 hover:bg-muted transition-colors group"
                      href={`/product/${product.id}`}
                    >
                      <img
                        className="rounded-xl h-14 w-14 object-cover flex-shrink-0"
                        src={product.imageUrl}
                        alt={product.name}
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-base group-hover:text-primary transition-colors">
                          {product.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Популярный выбор
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {searchQuery && products.length === 0 && (
                <div className="px-6 py-8 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-muted to-muted/40 ring-2 ring-border flex items-center justify-center mb-3">
                    <SearchX
                      size={24}
                      className="text-muted-foreground"
                      strokeWidth={2.2}
                    />
                  </div>
                  <p className="font-bold mb-1">Ничего не нашли</p>
                  <p className="text-sm text-muted-foreground">
                    По запросу «
                    <span className="text-foreground font-semibold">
                      {searchQuery}
                    </span>
                    » пусто. Попробуйте иначе.
                  </p>
                </div>
              )}

              {!searchQuery && (
                <div>
                  {history.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <span>Недавние запросы</span>
                        <button
                          onClick={clearHistory}
                          className="hover:text-primary transition-colors lowercase font-normal"
                        >
                          очистить
                        </button>
                      </div>
                      {history.map((item, i) => (
                        <div
                          key={i}
                          onClick={() => setSearchQuery(item)}
                          className="flex items-center justify-between gap-3 w-full px-5 py-3 hover:bg-muted cursor-pointer group transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Clock
                              size={18}
                              className="text-muted-foreground flex-shrink-0"
                            />
                            <span className="text-base text-foreground group-hover:text-primary">
                              {item}
                            </span>
                          </div>
                          <X
                            size={16}
                            className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                            onClick={(e) => removeHistoryItem(e, item)}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="px-5 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                    Популярное сейчас
                  </div>
                  <div className="flex flex-col gap-1 px-3 pb-2">
                    {[
                      { name: "Пепперони", id: 1 },
                      { name: "Маргарита", id: 2 },
                      { name: "Четыре сезона", id: 3 },
                    ].map((item) => (
                      <div
                        key={item.name}
                        onClick={() => setSearchQuery(item.name)}
                        className="flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-muted cursor-pointer group transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex-shrink-0">
                          <Search size={16} />
                        </div>
                        <span className="text-base font-semibold text-foreground group-hover:text-primary">
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
