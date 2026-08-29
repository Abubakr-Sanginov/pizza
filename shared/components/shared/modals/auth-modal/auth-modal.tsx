'use client';

import { Button } from '@/shared/components';
import { Dialog, DialogContent } from '@/shared/components/ui/dialog';
import { signIn } from 'next-auth/react';
import React from 'react';
import { LoginForm } from './forms/login-form';
import { RegisterForm } from './forms/register-form';
import { TelegramLoginButton } from './telegram-login-button';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<Props> = ({ open, onClose }) => {
  const [type, setType] = React.useState<'login' | 'register'>('login');
  const [step, setStep] = React.useState<'register' | 'verify'>('register');

  const onSwitchType = () => {
    setType(type === 'login' ? 'register' : 'login');
    setStep('register');
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[460px] w-[95vw] glass-strong p-10 outline-none rounded-[32px] shadow-soft-lg">
        {type === 'login' ? (
          <LoginForm onClose={handleClose} />
        ) : (
          <RegisterForm onClose={handleClose} onStepChange={setStep} />
        )}

        {step !== 'verify' && (
          <>
            <hr />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() =>
                  signIn('github', {
                    callbackUrl: '/',
                    redirect: true,
                  })
                }
                type="button"
                className="gap-2 h-12 p-2 flex-1">
                <img className="w-6 h-6" src="https://github.githubassets.com/favicons/favicon.svg" />
                GitHub
              </Button>

              <Button
                variant="secondary"
                onClick={() =>
                  signIn('google', {
                    callbackUrl: '/',
                    redirect: true,
                  })
                }
                type="button"
                className="gap-2 h-12 p-2 flex-1">
                <img
                  className="w-6 h-6"
                  src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg"
                />
                Google
              </Button>
            </div>

            <TelegramLoginButton />

            <Button variant="outline" onClick={onSwitchType} type="button" className="h-12">
              {type !== 'login' ? 'Войти' : 'Регистрация'}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
