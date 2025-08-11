import React, { useState } from 'react';
import { Button } from './ui/button';
import { Loader2, Check } from 'lucide-react';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick: () => Promise<void> | void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  successMessage?: string;
  loadingMessage?: string;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onClick,
  variant = 'default',
  size = 'default',
  className = '',
  disabled = false,
  successMessage = 'Concluído!',
  loadingMessage = 'Processando...'
}) => {
  const [state, setState] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleClick = async () => {
    if (state !== 'idle' || disabled) return;

    setState('loading');

    try {
      await onClick();
      setState('success');
      
      // Voltar ao estado normal após 2 segundos
      setTimeout(() => {
        setState('idle');
      }, 2000);
    } catch (error) {
      setState('idle');
      console.error('Button action failed:', error);
    }
  };

  const getContent = () => {
    switch (state) {
      case 'loading':
        return (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {loadingMessage}
          </>
        );
      case 'success':
        return (
          <>
            <Check className="w-4 h-4 mr-2 text-green-600" />
            {successMessage}
          </>
        );
      default:
        return children;
    }
  };

  const getVariant = () => {
    if (state === 'success') return 'outline';
    return variant;
  };

  return (
    <Button
      onClick={handleClick}
      variant={getVariant()}
      size={size}
      disabled={disabled || state === 'loading'}
      className={`transition-all duration-200 ${
        state === 'success' ? 'border-green-500 text-green-600' : ''
      } ${className}`}
    >
      {getContent()}
    </Button>
  );
};

export default AnimatedButton;