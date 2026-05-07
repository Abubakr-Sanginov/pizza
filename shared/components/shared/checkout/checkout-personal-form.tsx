'use client';

import React from 'react';
import { WhiteBlock } from '../white-block';
import { FormInput } from '../form';
import { useTranslation } from 'react-i18next';

interface Props {
  className?: string;
}

export const CheckoutPersonalForm: React.FC<Props> = ({ className }) => {
  const { t } = useTranslation();
  return (
    <WhiteBlock title={t('checkout.personalTitle')} className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormInput name="firstName" className="text-base" placeholder={t('checkout.firstName')} />
        <FormInput name="lastName" className="text-base" placeholder={t('checkout.lastName')} />
        <FormInput name="email" className="text-base" placeholder={t('checkout.email')} />
        <FormInput name="phone" className="text-base" placeholder={t('checkout.phone')} />
      </div>
    </WhiteBlock>
  );
};
