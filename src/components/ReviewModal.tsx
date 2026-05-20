import React, { useRef, useState } from 'react';
import emailjs from '@emailjs/browser';
import { X, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; // To pull their business name, email, etc.
import { useToast } from '../context/ToastContext';

interface SupportModalProps {
    isOpen: boolean;
    onClose: () => void;
    }

    export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const { profile } = useAuth(); // Automatically pulls logged-in user details
    const { showToast } = useToast();
    const [isSending, setIsSending] = useState(false);

    if (!isOpen) return null;

    const handleSendEmail = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formRef.current) return;

        setIsSending(true);

        // EmailJS sends everything inside the hidden and visible form inputs
        emailjs.sendForm(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,     // Get from emailjs.com
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,    // Get from emailjs.com
        formRef.current, 
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY      // Get from emailjs.com
        )
        .then(() => {
        showToast('MESSAGE SENT SUCCESSFULLY! WE WILL GET BACK TO YOU.', 'success');
        onClose(); // Close modal on success
        })
        .catch((error) => {
        console.error(error);
        showToast('FAILED TO SEND MESSAGE.', 'error');
        })
        .finally(() => {
        setIsSending(false);
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {/* Modal Box */}
            <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-2xl border border-slate-100 dark:border-slate-800 p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                
                {/* Close Button */}
                <button 
                onClick={onClose}
                className="absolute right-4 top-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-600 transition-colors"
                >
                <X size={18} />
                </button>

                <div className="mb-6">
                <h3 className="text-xl font-black uppercase tracking-tighter text-black dark:text-white">
                    Contact Support
                </h3>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mt-1">
                    Send a direct message or complaint to our care team.
                </p>
                </div>

                <form ref={formRef} onSubmit={handleSendEmail} className="space-y-4">
                
                {/* H_IDDEN INPUTS: These automatically inject user metadata into your email template without showing on screen */}
                <input type="hidden" name="business_name" value={profile?.businessName || 'Unknown Business'} />
                <input type="hidden" name="user_email" value={profile?.email || 'No Email'} />
                <input type="hidden" name="user_phone" value={profile?.businessPhone || 'No Phone'} />

                {/* Title / Subject Input */}
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Subject / Title</label>
                    <input 
                    type="text" 
                    name="email_subject" 
                    required
                    placeholder="e.g., Can't see my goods or Nice App!"
                    className="w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-xs font-bold text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                    />
                </div>

                {/* Message / Complaint Box */}
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Your Complaint / Review</label>
                    <textarea 
                    name="message" 
                    rows={6} 
                    required
                    placeholder="Type your message here..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs font-bold text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors resize-none"
                    />
                </div>

                {/* Action Button */}
                    <button 
                        type="submit" 
                        disabled={isSending}
                        className="w-full h-12 bg-black dark:bg-white text-white dark:text-black font-black uppercase text-xs tracking-widest rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                    >
                        {isSending ? (
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-current rounded-full animate-spin" />
                        ) : (
                        <>
                            <Send size={14} /> Send Message
                        </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}