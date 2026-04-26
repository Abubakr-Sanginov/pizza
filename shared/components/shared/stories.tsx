'use client';

import { Api } from '@/back/services/api-client';
import { IStory } from '@/back/services/stories';
import React from 'react';
import { Container } from './container';
import { cn } from '@/shared/lib/utils';
import { X } from 'lucide-react';
import ReactStories from 'react-insta-stories';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  className?: string;
}

export const Stories: React.FC<Props> = ({ className }) => {
  const [stories, setStories] = React.useState<IStory[]>([]);
  const [open, setOpen] = React.useState(false);
  const [selectedStory, setSelectedStory] = React.useState<IStory>();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchStories() {
      try {
        const data = await Api.stories.getAll();
        setStories(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStories();
  }, []);

  const onClickStory = (story: IStory) => {
    setSelectedStory(story);

    if (story.items.length > 0) {
      setOpen(true);
    }
  };

  if (!isLoading && stories.length === 0) {
    return null;
  }

  return (
    <>
      <Container className={cn('flex items-center justify-between gap-2 my-10 overflow-x-auto scrollbar-hide p-2', className)}>
        {isLoading &&
          [...Array(6)].map((_, index) => (
            <div key={index} className="w-[150px] md:w-[200px] h-[200px] md:h-[250px] bg-gray-200 rounded-md animate-pulse flex-shrink-0" />
          ))}

        {stories.map((story, index) => (
          <motion.img
            key={story.id}
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onClickStory(story)}
            className="rounded-lg cursor-pointer transition-all duration-300 border shadow-md flex-shrink-0"
            src={story.previewImageUrl}
            style={{ width: 'clamp(140px, 20vw, 200px)', height: 'auto', aspectRatio: '4/5' }}
          />
        ))}

        <AnimatePresence>
          {open && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed left-0 top-0 w-full h-full bg-black/90 flex items-center justify-center z-50 p-4"
            >
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-[520px]"
              >
                <button 
                  className="absolute -top-10 right-0 md:-right-16 md:-top-5 z-50 p-2 hover:bg-white/10 rounded-full transition-colors" 
                  onClick={() => setOpen(false)}
                >
                  <X className="w-8 h-8 md:w-10 md:h-10 text-white/70 hover:text-white" />
                </button>

                <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center">
                  <ReactStories
                    onAllStoriesEnd={() => setOpen(false)}
                    stories={selectedStory?.items.map((item) => ({ url: item.sourceUrl })) || []}
                    defaultInterval={3000}
                    width="100%"
                    height="100vh"
                    storyContainerStyles={{ borderRadius: '16px' }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </>
  );
};
