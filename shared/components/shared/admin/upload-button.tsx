'use client';

import React from 'react';
import { Button } from '@/shared/components/ui';
import { Image as ImageIcon, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

interface Props {
  value?: string;
  onChange: (url: string) => void;
  className?: string;
}

export const UploadButton: React.FC<Props> = ({ value, onChange, className }) => {
  const [loading, setLoading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const onSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onChange(data.url);
      toast.success('Изображение загружено');
    } catch (error) {
      console.error(error);
      toast.error('Не удалось загрузить изображение');
    } finally {
      setLoading(false);
    }
  };

  const onRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className={className}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={onSelectFile}
        accept="image/*"
        className="hidden"
      />

      {value ? (
        <div className="relative w-40 h-40 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <img src={value} alt="Preview" className="w-full h-full object-cover rounded-xl border" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
            <ImageIcon className="text-white" size={32} />
          </div>
          <button
            onClick={onRemove}
            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors">
            <X size={16} />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-40 h-40 border-dashed flex flex-col gap-2 rounded-xl"
          disabled={loading}
          onClick={() => fileInputRef.current?.click()}>
          {loading ? <Loader2 className="animate-spin" /> : <ImageIcon size={32} className="text-gray-400" />}
          <span className="text-xs text-gray-500 font-medium">
            {loading ? 'Загрузка...' : 'Загрузить фото'}
          </span>
        </Button>
      )}
    </div>
  );
};
