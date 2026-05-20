import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase'; // Adjust path to your firebase config
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { Megaphone, AlertTriangle, Info, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Announcement {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success';
}

export default function GlobalInfoFeed() {
    const [announcement, setAnnouncement] = useState<Announcement | null>(null);
    const [isVisible, setIsVisible] = useState(true);
    const { profile } = useAuth();

    useEffect(() => {
        if (!profile) return;
        
        const now = new Date(); // Captures the exact client-side time right now

        // Query the announcements collection with a real-time time restriction
        const q = query(
        collection(db, 'announcements'),
        where('expiresAt', '>', now), // 🔥 Only pull messages whose expiration timestamp is GREATER than right now
        orderBy('expiresAt', 'asc'),   // Sorts them so the one expiring closest to now shows up first
        limit(1)
        );

        // Listen to changes in real-time
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                setAnnouncement({ id: doc.id, ...doc.data() } as Announcement);
                setIsVisible(true); // Re-open if a brand new unexpired announcement arrives
            } else {
                setAnnouncement(null); // If no documents match (meaning it expired), turn off the banner
            }
        }, (error) => {
            // 4. Clean error catcher to monitor logs clearly
            console.error("Feed error:", error);
        });

        return () => unsubscribe();
    }, [profile]);

    if (!announcement || !isVisible) return null;

    // Dynamically change background border styling based on announcement type
    const styles = {
        warning: 'bg-amber-900/900 border-gold-800/90 text-amber-600',
        success: 'bg-emerald-900/900 border-emerald-600/90 text-emerald-600',
        info: 'bg-blue-900/900 border-blue-800/90 text-blue-600',
    };

    const icons = {
        warning: <AlertTriangle className="text-amber-400 shrink-0" size={18} />,
        success: <Info className="text-emerald-400 shrink-0" size={18} />,
        info: <Megaphone className="text-blue-400 shrink-0" size={18} />,
    };

    return (
        <div className={`mx-4 mt-4 p-4 border rounded-2xl flex items-start gap-3 transition-all duration-300 ${styles[announcement.type] || styles.info}`}>
        {icons[announcement.type] || icons.info}
        
        <div className="flex-1 space-y-0.5">
            <h4 className="text-xs font-bold uppercase tracking-wider">{announcement.title}</h4>
            <p className="text-sm opacity-90">{announcement.message}</p>
        </div>

        <button 
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors opacity-60 hover:opacity-100"
        >
            <X size={16} />
        </button>
        </div>
    );
}