import clsx from 'clsx';
import React from 'react';

type TitleSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface Props {
  size?: TitleSize;
  className?: string;
  text: string;
  children?: React.ReactNode;
}

export const Title: React.FC<Props> = ({ text, size = 'sm', className, children }) => {
  const mapTagBySize = {
    xs: 'h5',
    sm: 'h4',
    md: 'h3',
    lg: 'h2',
    xl: 'h1',
    '2xl': 'h1',
  } as const;

  const mapClassNameBySize = {
    xs: 'text-[14px] md:text-[16px]',
    sm: 'text-[18px] md:text-[22px]',
    md: 'text-[22px] md:text-[26px]',
    lg: 'text-[24px] md:text-[32px]',
    xl: 'text-[32px] md:text-[40px]',
    '2xl': 'text-[36px] md:text-[48px]',
  } as const;

  return React.createElement(
    mapTagBySize[size],
    { className: clsx(mapClassNameBySize[size], className) },
    text,
    children,
  );
};
