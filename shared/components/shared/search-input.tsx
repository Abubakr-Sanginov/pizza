'use client';

import { cn } from '@/shared/lib/utils';
import { Api } from '@/back/services/api-client';
import { Product } from '@prisma/client';
import { Search, Clock, X } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { useClickAway, useDebounce } from 'react-use';
import { motion, AnimatePresence } from 'framer-motion';
import { recordSearch } from '@/app/actions';

interface Props {
  className?: string;
}

export const SearchInput: React.FC<Props> = ({ className }) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [focused, setFocused] = React.useState(false);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [history, setHistory] = React.useState<string[]>([]);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const savedHistory = localStorage.getItem('search_history');
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
    setSearchQuery('');
    setProducts([]);
    recordSearch(productName);

    const newHistory = [productName, ...history.filter((h) => h !== productName)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('search_history', JSON.stringify(newHistory));
  };

  const removeHistoryItem = (e: React.MouseEvent, item: string) => {
    e.preventDefault();
    e.stopPropagation();
    const newHistory = history.filter((h) => h !== item);
    setHistory(newHistory);
    localStorage.setItem('search_history', JSON.stringify(newHistory));
  };

  const clearHistory = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setHistory([]);
    localStorage.removeItem('search_history');
  };

  return (
    <>
      {focused && <div className="fixed top-0 left-0 bottom-0 right-0 bg-black/50 z-30 transition-all duration-300" />}

      <div
        ref={ref}
        className={cn('flex rounded-2xl flex-1 justify-between relative h-11 z-30', className)}>
        <Search className="absolute top-1/2 translate-y-[-50%] left-3 h-5 text-gray-400" />
        <input
          className="rounded-2xl outline-none w-full bg-gray-100 pl-11 focus:bg-white transition-all duration-300"
          type="text"
          placeholder="Найти пиццу..."
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
              className="absolute w-full bg-white rounded-xl py-2 top-12 shadow-2xl z-30 border border-gray-100 overflow-hidden"
            >
              {searchQuery && products.length > 0 && (
                <div className="max-h-[350px] overflow-y-auto">
                  {products.map((product) => (
                    <Link
                      onClick={() => onClickItem(product.name)}
                      key={product.id}
                      className="flex items-center gap-3 w-full px-4 py-2 hover:bg-primary/5 transition-colors group"
                      href={`/product/${product.id}`}>
                      <img className="rounded-full h-10 w-10 object-cover" src={product.imageUrl} alt={product.name} />
                      <div className="flex flex-col">
                        <span className="font-medium group-hover:text-primary transition-colors">{product.name}</span>
                        <span className="text-xs text-gray-400">Популярный выбор</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {searchQuery && products.length === 0 && (
                <div className="px-4 py-8 text-center text-gray-400">
                  <p>Ничего не найдено по запросу "{searchQuery}"</p>
                </div>
              )}

              {!searchQuery && (
                <div>
                  {history.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
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
                          className="flex items-center justify-between gap-3 w-full px-4 py-2 hover:bg-gray-50 cursor-pointer group transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Clock size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-700 group-hover:text-primary">{item}</span>
                          </div>
                          <X 
                            size={14} 
                            className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            onClick={(e) => removeHistoryItem(e, item)}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Популярное сейчас
                  </div>
                  <div className="grid grid-cols-1 gap-1 px-2">
                    {[
                      { name: 'Пепперони', id: 1 },
                      { name: 'Маргарита', id: 2 },
                      { name: 'Четыре сезона', id: 3 }
                    ].map((item) => (
                      <div
                        key={item.name}
                        onClick={() => setSearchQuery(item.name)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary/5 cursor-pointer group transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          <Search size={14} />
                        </div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-primary">{item.name}</span>
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
