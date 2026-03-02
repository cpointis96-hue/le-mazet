'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface GroupMessage {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
}

export function useGroupMessages() {
    const [messages, setMessages] = useState<GroupMessage[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const supabase = createClient();

        async function init() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
            }

            // Récupérer les 100 derniers messages
            const { data, error } = await supabase
                .from('group_messages')
                .select('*')
                .order('created_at', { ascending: true })
                .limit(100);

            if (!error && data) {
                setMessages(data);
            }
            setIsLoaded(true);
        }

        init();

        // Realtime : écoute les nouveaux messages
        const channel = supabase
            .channel('group-messages')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'group_messages' },
                (payload) => {
                    const newMsg = payload.new as GroupMessage;
                    setMessages((prev) => [...prev, newMsg]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const sendMessage = useCallback(async (content: string) => {
        if (!currentUserId || !content.trim()) return;
        const supabase = createClient();

        // On n'attend pas la réponse pour l'expérience utilisateur, l'insertion déclenchera un event realtime
        // mais pour une UX immédiate, on pourrait l'ajouter temp
        await supabase
            .from('group_messages')
            .insert({
                user_id: currentUserId,
                content: content.trim()
            });
    }, [currentUserId]);

    return {
        messages,
        sendMessage,
        isLoaded,
        currentUserId
    };
}
