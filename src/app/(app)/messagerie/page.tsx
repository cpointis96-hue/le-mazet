"use client";

import { useState, useEffect, useRef } from "react";
import { useGroupMessages } from "@/hooks/useGroupMessages";
import { useSupabaseUsers } from "@/hooks/useSupabaseUsers";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Send, Hash } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function MessageriePage() {
    const { messages, sendMessage, isLoaded, currentUserId } = useGroupMessages();
    const { users } = useSupabaseUsers();
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll automatically to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            await sendMessage(newMessage);
            setNewMessage("");
        }
    };

    if (!isLoaded) {
        return <div className="p-8 text-center text-muted-foreground">Chargement de la messagerie...</div>;
    }

    return (
        <div className="h-full flex flex-col bg-card rounded-xl border shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex h-16 items-center border-b px-6 shrink-0 bg-muted/10">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                        <Hash className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">Famille & Groupe</h1>
                        <p className="text-xs text-muted-foreground">{users.length} membres sur le réseau</p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-gradient-to-b from-transparent to-muted/5">
                {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                        <Hash className="w-12 h-12 mb-4 opacity-20" />
                        <p>Aucun message pour le moment.</p>
                        <p className="text-sm">Soyez le premier à dire bonjour !</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.user_id === currentUserId;
                        const author = users.find(u => u.id === msg.user_id);

                        // Check if previous message was from the same user to group them
                        const prevMsg = index > 0 ? messages[index - 1] : null;
                        const isGrouped = prevMsg?.user_id === msg.user_id;

                        const timeStr = format(new Date(msg.created_at), "HH:mm");
                        const dateStr = format(new Date(msg.created_at), "d MMMM", { locale: fr });
                        const showDate = index === 0 || format(new Date(msg.created_at), "ddMMyyyy") !== format(new Date(prevMsg!.created_at), "ddMMyyyy");

                        return (
                            <div key={msg.id} className="flex flex-col">
                                {showDate && (
                                    <div className="flex justify-center my-4">
                                        <span className="text-xs font-medium bg-muted/50 px-3 py-1 rounded-full text-muted-foreground">
                                            {dateStr}
                                        </span>
                                    </div>
                                )}
                                <div className={cn("flex gap-3 max-w-[85%]", isMe ? "self-end flex-row-reverse" : "self-start", isGrouped && !showDate ? "mt-1" : "mt-4")}>
                                    {!isMe && (!isGrouped || showDate) ? (
                                        <UserAvatar user={author} className="w-8 h-8 shrink-0 mt-1" />
                                    ) : (
                                        <div className="w-8 shrink-0" /> // Spacer for alignment if grouped
                                    )}

                                    <div className={cn("flex flex-col gap-1", isMe ? "items-end" : "items-start")}>
                                        {(!isGrouped || showDate) && !isMe && (
                                            <span className="text-xs font-semibold text-muted-foreground ml-1">
                                                {author?.displayName || "Utilisateur supprimé"}
                                            </span>
                                        )}
                                        <div className={cn(
                                            "px-4 py-2.5 rounded-2xl shadow-sm text-sm whitespace-pre-wrap max-w-full break-words",
                                            isMe
                                                ? "bg-primary text-primary-foreground rounded-tr-sm"
                                                : "bg-muted/50 text-foreground rounded-tl-sm border"
                                        )}>
                                            {msg.content}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground/70 px-1">
                                            {timeStr}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input form */}
            <div className="p-4 bg-background border-t shrink-0">
                <form onSubmit={handleSubmit} className="flex gap-2 items-end">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Écrivez votre message..."
                        className="flex-1 bg-muted/20 border-muted focus-visible:ring-primary/30 min-h-[44px] rounded-full px-5"
                    />
                    <Button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="rounded-full w-[44px] h-[44px] p-0 shrink-0 shadow-md hover:shadow-lg transition-all"
                    >
                        <Send className="w-5 h-5 ml-0.5" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
