import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'error' | 'warning';
  onClose: () => void;
}

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
  const getStyles = () => {
    switch (type) {
      case 'error':
        return 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800/50';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800/50';
      default:
        return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/50';
    }
  };

  const Icon = () => {
    switch (type) {
      case 'error':
        return <XCircle size={18} className="text-rose-600 dark:text-rose-400" />;
      case 'warning':
        return <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />;
      default:
        return <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />;
    }
  };

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: 0.95 }}
          onAnimationComplete={() => {
            const timer = setTimeout(onClose, 3000);
            return () => clearTimeout(timer);
          }}
          className="fixed bottom-12 left-4 right-4 z-[10000] flex justify-center pointer-events-none"
        >
          <div className={`px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border pointer-events-auto backdrop-blur-md ${getStyles()}`}>
            <Icon />
            <span className="font-black uppercase tracking-widest text-[10px] sm:text-xs text-center">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
