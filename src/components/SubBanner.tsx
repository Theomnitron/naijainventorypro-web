import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock } from 'lucide-react';

export default function SubBanner() {
  const { profile } = useAuth();
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!profile?.accessExpiresAt) return;

    const calculateTime = () => {
      const now = Date.now();
      const diff = profile.accessExpiresAt - now;

      if (diff <= 0) {
        setTimeLeft('EXPIRED');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft(`${days}d ${hours}h ${minutes}m Left`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [profile?.accessExpiresAt]);

  if (!profile) return null;

  const isExpired = Date.now() > profile.accessExpiresAt;

  return (
    <div className={`w-full py-1.5 px-6 flex items-center justify-center gap-2 transition-colors ${isExpired ? 'bg-red-500' : 'bg-black dark:bg-white'
      }`}>
      <Clock size={12} className={isExpired ? 'text-white' : 'text-white dark:text-black'} />
      <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${isExpired ? 'text-white' : 'text-white dark:text-black'
        }`}>
        {isExpired ? profile.isPaid = false : `Access: ${timeLeft}`}
      </p>
    </div>
  );
}
