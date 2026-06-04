'use client';

import React, { useState, useEffect } from 'react';
import { Container } from '@/shared/components/shared/container';
import { Title } from '@/shared/components/shared/title';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Users, Share2, Plus, Clock } from 'lucide-react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { cn } from '@/shared/lib/utils';

export default function GroupOrderPage() {
  const { data: session } = useSession();
  const [mode, setMode] = useState<'menu' | 'room'>('menu');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [groupOrder, setGroupOrder] = useState<any>(null);
  const [myParticipant, setMyParticipant] = useState<any>(null);

  const handleCreateRoom = async () => {
    if (!session?.user) {
      toast.error('Войдите в аккаунт для создания комнаты');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post('/api/group-orders', {
        creatorId: (session.user as any).id,
      });
      setGroupOrder(data);

      const participant = await axios.post(
        `/api/group-orders/${data.code}/join`,
        { userId: (session.user as any).id }
      );
      setMyParticipant(participant.data);
      setMode('room');
      toast.success('Комната создана!');
    } catch (error) {
      console.error('Failed to create group order:', error);
      toast.error('Не удалось создать комнату');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) {
      toast.error('Введите код комнаты');
      return;
    }

    setLoading(true);
    try {
      const { data: order } = await axios.get(
        `/api/group-orders?code=${joinCode.toUpperCase()}`
      );
      setGroupOrder(order);

      const { data: participant } = await axios.post(
        `/api/group-orders/${joinCode.toUpperCase()}/join`,
        session?.user
          ? { userId: (session.user as any).id }
          : { guestName: 'Гость' }
      );
      setMyParticipant(participant);
      setMode('room');
      toast.success('Вы присоединились к комнате!');
    } catch (error: any) {
      console.error('Failed to join group order:', error);
      if (error.response?.status === 404) {
        toast.error('Комната не найдена');
      } else if (error.response?.status === 410) {
        toast.error('Комната истекла');
      } else {
        toast.error('Не удалось присоединиться');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShareCode = async () => {
    if (!groupOrder) return;
    try {
      await navigator.share({
        title: 'Групповой заказ пиццы',
        text: `Присоединяйся к групповому заказу! Код: ${groupOrder.code}`,
        url: window.location.href,
      });
    } catch (error) {
      navigator.clipboard.writeText(groupOrder.code);
      toast.success('Код скопирован в буфер обмена');
    }
  };

  const refreshGroupOrder = async () => {
    if (!groupOrder) return;
    try {
      const { data } = await axios.get(
        `/api/group-orders?code=${groupOrder.code}`
      );
      setGroupOrder(data);
    } catch (error) {
      console.error('Failed to refresh:', error);
    }
  };

  useEffect(() => {
    if (groupOrder && mode === 'room') {
      const interval = setInterval(refreshGroupOrder, 5000);
      return () => clearInterval(interval);
    }
  }, [groupOrder, mode]);

  if (mode === 'menu') {
    return (
      <Container className="py-10">
        <Title text="Групповой заказ" size="lg" className="mb-8" />

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-center">Создать комнату</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                Создайте комнату и пригласите друзей. Каждый добавит свои
                позиции в общий заказ.
              </p>
              <Button
                onClick={handleCreateRoom}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? 'Создание...' : 'Создать'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <Plus className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-center">Присоединиться</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                Введите код комнаты, чтобы присоединиться к групповому заказу.
              </p>
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Введите код"
                maxLength={8}
                className="text-center text-lg font-bold tracking-wider"
              />
              <Button
                onClick={handleJoinRoom}
                disabled={loading || !joinCode.trim()}
                className="w-full"
                size="lg"
              >
                {loading ? 'Подключение...' : 'Присоединиться'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </Container>
    );
  }

  if (!groupOrder || !myParticipant) {
    return (
      <Container className="py-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Container>
    );
  }

  const totalAmount = groupOrder.participants.reduce(
    (sum: number, p: any) => sum + p.totalAmount,
    0
  );

  return (
    <Container className="py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Title text={`Комната ${groupOrder.code}`} size="lg" />
          <p className="text-muted-foreground mt-2">
            Поделитесь кодом с друзьями
          </p>
        </div>
        <Button onClick={handleShareCode} variant="outline" size="lg">
          <Share2 className="w-5 h-5 mr-2" />
          Поделиться
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Участники ({groupOrder.participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {groupOrder.participants.map((p: any) => (
                <div
                  key={p.id}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg border',
                    p.id === myParticipant.id && 'bg-primary/5 border-primary'
                  )}
                >
                  <div>
                    <p className="font-semibold">
                      {p.user?.fullName || p.guestName || 'Гость'}
                      {p.id === myParticipant.id && ' (Вы)'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {p.totalAmount} TJS
                    </p>
                  </div>
                  {p.id === myParticipant.id && (
                    <Button size="sm" asChild>
                      <a href="/">Добавить товары</a>
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="pt-6 text-center">
              <p className="text-sm opacity-90 mb-2">Общая сумма</p>
              <p className="text-4xl font-bold">{totalAmount} TJS</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>
                  Истекает:{' '}
                  {new Date(groupOrder.expiresAt).toLocaleString('ru')}
                </span>
              </div>
              <Button className="w-full" size="lg">
                Оформить заказ
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}
