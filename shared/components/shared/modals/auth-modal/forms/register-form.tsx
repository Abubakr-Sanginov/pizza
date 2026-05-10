'use client';

import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { registerUser, verifyUser } from '@/app/actions';
import { TFormRegisterValues, formRegisterSchema } from './schemas';
import { FormInput } from '../../../form';
import { Button } from '@/shared/components/ui';
import { Title } from '@/shared/components/shared';
import { signIn } from 'next-auth/react';

interface Props {
  onClose?: VoidFunction;
  onClickLogin?: VoidFunction;
  onStepChange?: (step: 'register' | 'verify') => void;
}

export const RegisterForm: React.FC<Props> = ({ onClose, onClickLogin, onStepChange }) => {
  const [step, setStep] = React.useState<'register' | 'verify'>('register');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [verifying, setVerifying] = React.useState(false);
  const [verificationCode, setVerificationCode] = React.useState('');

  const handleSetStep = (newStep: 'register' | 'verify') => {
    setStep(newStep);
    onStepChange?.(newStep);
  };

  const form = useForm<TFormRegisterValues>({
    resolver: zodResolver(formRegisterSchema),
    defaultValues: {
      email: '',
      fullName: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: TFormRegisterValues) => {
    try {
      await registerUser({
        email: data.email,
        fullName: data.fullName,
        password: data.password,
      });

      toast.success('Регистрация успешна 📝. Код подтверждения отправлен на почту', {
        icon: '✅',
      });

      setEmail(data.email);
      setPassword(data.password);
      handleSetStep('verify');
    } catch (error) {
      return toast.error('Пользователь с такой почтой уже существует или данные неверны', {
        icon: '❌',
      });
    }
  };

  const onVerify = async () => {
    if (!verificationCode) return toast.error('Введите код');

    try {
      setVerifying(true);
      await verifyUser(verificationCode, email);
      
      toast.success('Почта подтверждена! Входим в аккаунт...', {
        icon: '✅',
      });
      
      await signIn('credentials', {
        email,
        password,
        callbackUrl: '/',
        redirect: true,
      });

      onClose?.();
    } catch (error) {
      toast.error('Неверный код подтверждения');
    } finally {
      setVerifying(false);
    }
  };

  if (step === 'verify') {
    return (
      <div className="flex flex-col gap-6 text-center py-4">
        <div className="flex flex-col gap-2">
          <Title text="Подтверждение почты" size="md" className="font-bold text-2xl" />
          <p className="text-muted-foreground text-sm">
            Мы отправили код на <br />
            <span className="text-foreground font-semibold break-all">{email}</span>
          </p>
        </div>

        <div className="flex flex-col gap-4">
           <input
             autoFocus
             className="w-full h-14 text-center text-3xl tracking-[0.2em] font-bold border-2 border-border bg-card text-foreground rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all px-2"
             placeholder="000000"
             maxLength={6}
             value={verificationCode}
             onChange={(e) => setVerificationCode(e.target.value)}
           />
           <p className="text-xs text-muted-foreground">Введите 6-значный код из письма</p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            loading={verifying}
            onClick={onVerify}
            className="h-12 text-base font-bold shadow-lg shadow-primary/20"
          >
            Подтвердить и войти
          </Button>

          <button
            onClick={() => handleSetStep('register')}
            className="text-muted-foreground hover:text-primary transition-colors text-sm"
          >
            ← Вернуться к заполнению данных
          </button>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
        <FormInput name="email" label="E-Mail" required />
        <FormInput name="fullName" label="Полное имя" required />
        <FormInput name="password" label="Пароль" type="password" required />
        <FormInput name="confirmPassword" label="Подтвердите пароль" type="password" required />

        <Button loading={form.formState.isSubmitting} className="h-12 text-base" type="submit">
          Зарегистрироваться
        </Button>
      </form>
    </FormProvider>
  );
};
