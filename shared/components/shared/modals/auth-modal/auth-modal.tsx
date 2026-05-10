'use client';

import { Button } from '@/shared/components';
import { Dialog, DialogContent } from '@/shared/components/ui/dialog';
import { signIn } from 'next-auth/react';
import React from 'react';
import { LoginForm } from './forms/login-form';
import { RegisterForm } from './forms/register-form';

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

              <Button
                variant="secondary"
                onClick={() =>
                  signIn('apple', {
                    callbackUrl: '/',
                    redirect: true,
                  })
                }
                type="button"
                className="gap-2 h-12 p-2 flex-1 bg-foreground text-background hover:bg-foreground/90 hover:text-background">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12-.99.358-2.04 1.103-2.9.744-.83 1.99-1.5 2.987-1.75.067.33.074.66.074.99zM20.5 17.36c-.563 1.27-.83 1.84-1.555 2.97-1.01 1.57-2.43 3.53-4.18 3.55-1.55.02-1.95-1.01-4.06-1-2.11.01-2.55 1.02-4.1 1-1.75-.02-3.1-1.79-4.1-3.36C-.27 16.84-.74 11.18 1.65 8.13c1.7-2.16 4.38-3.43 6.9-3.43 2.56 0 4.17 1.4 6.28 1.4 2.05 0 3.3-1.4 6.27-1.4 2.25 0 4.63 1.23 6.33 3.34-5.56 3.05-4.66 11.02-2.93 9.32z"/>
                </svg>
                Apple
              </Button>
            </div>

            <Button variant="outline" onClick={onSwitchType} type="button" className="h-12">
              {type !== 'login' ? 'Войти' : 'Регистрация'}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
