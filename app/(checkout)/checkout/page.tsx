'use client';

import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  CheckoutSidebar,
  Container,
  Title,
  CheckoutAddressForm,
  CheckoutCart,
  CheckoutPersonalForm,
  CheckoutScheduleForm,
} from '@/shared/components';
import { CheckoutFormValues, checkoutFormSchema } from '@/shared/constants';
import { useCart } from '@/shared/hooks';
import { createOrder } from '@/app/actions';
import toast from 'react-hot-toast';
import React from 'react';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { Api } from '@/back/services/api-client';
import { getStores } from '@/back/actions/store-actions';
import { Store } from '@prisma/client';

export default function CheckoutPage() {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = React.useState(false);
  const [stores, setStores] = React.useState<Store[]>([]);
  const { totalAmount, updateItemQuantity, items, removeCartItem, loading } = useCart();
  const { data: session } = useSession();
  const [settings, setSettings] = React.useState<{ vatPrice: number; deliveryPrice: number } | null>(null);

  React.useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        setSettings(data);
      } catch (error) {
        console.error(error);
      }
    }
    fetchSettings();
  }, []);
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      address: '',
      deliveryType: 'DELIVERY',
      comment: '',
      paymentMethod: 'CASH_ON_DELIVERY',
    },
  });

  React.useEffect(() => {
    async function fetchData() {
      const storesData = await getStores();
      setStores(storesData);

      if (storesData.length > 0) {
        form.setValue('storeId', storesData[0].id);
      }
    }

    fetchData();
  }, [form]);

  React.useEffect(() => {
    async function fetchUserInfo() {
      const data = await Api.auth.getMe();
      const [firstName, lastName] = data.fullName.split(' ');

      form.setValue('firstName', firstName);
      form.setValue('lastName', lastName);
      form.setValue('email', data.email);
      form.setValue('address', data.address || '');
    }

    if (session) {
      fetchUserInfo();
    }
  }, [session, form]);

  const onSubmit = async (data: CheckoutFormValues) => {
    try {
      setSubmitting(true);

      const url = await createOrder(data);

      toast.success(t('checkout.success'), {
        icon: 'вњ…',
      });

      if (url) {
        location.href = url;
      }
    } catch (err) {
      console.log(err);
      setSubmitting(false);
      toast.error(t('checkout.error'), {
        icon: 'вќЊ',
      });
    }
  };

  const onClickCountButton = (id: number, quantity: number, type: 'plus' | 'minus') => {
    const newQuantity = type === 'plus' ? quantity + 1 : quantity - 1;
    updateItemQuantity(id, newQuantity);
  };

  return (
    <Container className="mt-10">
      <Title text={t('checkout.title')} className="font-extrabold mb-8 text-[28px] md:text-[36px]" />

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex flex-col lg:flex-row gap-10">
            {}
            <div className="flex flex-col gap-10 flex-1 mb-20">
              <CheckoutCart
                onClickCountButton={onClickCountButton}
                removeCartItem={removeCartItem}
                items={items}
                loading={loading}
              />

              <CheckoutScheduleForm className={loading ? 'opacity-40 pointer-events-none' : ''}  />

              <CheckoutPersonalForm className={loading ? 'opacity-40 pointer-events-none' : ''} />

              <CheckoutAddressForm stores={stores} className={loading ? 'opacity-40 pointer-events-none' : ''} />
            </div>

            {}
            <div className="w-full lg:w-[450px]">
              <CheckoutSidebar
                totalAmount={totalAmount}
                loading={loading || submitting || !settings}
                vatPrice={settings?.vatPrice}
                deliveryPrice={settings?.deliveryPrice}
              />
            </div>
          </div>
        </form>
      </FormProvider>
    </Container>
  );
}

