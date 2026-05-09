'use client';

import React from 'react';
import { Title } from '../title';
import { Button, Input } from '../../ui';
import { Textarea } from '../../ui/textarea';
import toast from 'react-hot-toast';
import axios from 'axios';
import { X, Trash2 } from 'lucide-react';

export const NotificationsForm: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [imageUrl, setImageUrl] = React.useState('');
  const [history, setHistory] = React.useState<any[]>([]);

  const fetchHistory = async () => {
    try {
      const { data } = await axios.get('/api/notifications');
      setHistory(data);
    } catch (error) {
      console.error(error);
    }
  };

  React.useEffect(() => {
    fetchHistory();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post('/api/admin/notifications/send', {
        title,
        body,
        imageUrl: imageUrl || null,
      });
      toast.success('Уведомления успешно отправлены!');
      setTitle('');
      setBody('');
      setImageUrl('');
      fetchHistory();
    } catch (error) {
      console.error(error);
      toast.error('Не удалось отправить уведомления');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить это уведомление из истории?')) return;
    
    try {
      await axios.delete(`/api/admin/notifications/${id}`);
      toast.success('Удалено');
      fetchHistory();
    } catch (error) {
      toast.error('Ошибка при удалении');
    }
  };

  return (
    <div className="flex flex-col gap-10 mt-10">
      <div className="max-w-[600px] mx-auto w-full p-10 bg-white rounded-3xl shadow-sm border">
        <Title text="Рассылка уведомлений" size="md" className="font-bold mb-5" />
        <p className="text-gray-400 mb-8">
          Введите заголовок и текст уведомления. Оно будет отправлено всем пользователям (на сайт и в мобильное приложение).
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div>
            <label className="text-sm font-medium mb-1 block">Заголовок</label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Например: Скидка 20% на все пиццы!" 
              required 
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Текст сообщения</label>
            <Textarea 
              value={body} 
              onChange={(e) => setBody(e.target.value)} 
              placeholder="Текст уведомления..." 
              rows={4} 
              required 
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Изображение (необязательно)</label>
            <div className="flex gap-2 mb-2">
              <Input 
                value={imageUrl} 
                onChange={(e) => setImageUrl(e.target.value)} 
                placeholder="https://example.com/image.jpg" 
                className="flex-1"
              />
              <Input
                type="file"
                id="file-upload"
                className="hidden"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      const formData = new FormData();
                      formData.append('file', file);
                      const { data } = await axios.post('/api/upload', formData);
                      setImageUrl(data.url);
                      toast.success('Изображение загружено');
                    } catch (error) {
                      toast.error('Ошибка при загрузке');
                    }
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                Загрузить
              </Button>
            </div>
            {imageUrl && (
              <div className="relative w-full h-40 bg-gray-100 rounded-xl overflow-hidden border">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-contain" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-1 shadow-sm"
                >
                  <X size={16} className="text-gray-600" />
                </button>
              </div>
            )}
          </div>

          <Button loading={loading} type="submit" className="h-12 text-base font-bold mt-2">
            Отправить всем
          </Button>
        </form>
      </div>

      <div className="max-w-[800px] mx-auto w-full p-10 bg-white rounded-3xl shadow-sm border mb-20">
        <Title text="История уведомлений" size="md" className="font-bold mb-5" />
        
        <div className="flex flex-col gap-4">
          {history.length === 0 ? (
            <p className="text-gray-400 text-center py-10">История пуста</p>
          ) : (
            history.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl border bg-gray-50/50">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt="" className="w-12 h-12 object-cover rounded-lg" />
                )}
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold truncate">{item.title}</h4>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{item.body}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-red-500 hover:bg-red-50"
                  onClick={() => onDelete(item.id)}
                >
                  <Trash2 size={20} />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

