"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarEvent } from "@/types/calendar.types";
import { UserProfile } from "@/hooks/useSupabaseUsers";
import { MapPin, FileText, Download, Send, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getEventAttachments, EventAttachment } from "@/lib/supabase/attachments";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { EventChecklist } from "@/components/events/EventChecklist";
import { EventDateProposals } from "@/components/events/EventDateProposals";
import * as Icons from "lucide-react";

interface EventDetailsModalProps {
    event: CalendarEvent;
    isOpen: boolean;
    onClose: () => void;
    users: UserProfile[];
    proposalsData: any;
    isConfirmed?: boolean;
}

export function EventDetailsModal({ event, isOpen, onClose, users, proposalsData, isConfirmed = false }: EventDetailsModalProps) {
    const creator = users.find(u => u.id === event.userId);
    const dateFormatted = format(new Date(event.startDate), "EEEE d MMMM yyyy", { locale: fr });
    const fmtT = (t?: string | null) => t ? t.slice(0, 5) : null;
    const timeFormatted = event.allDay
        ? 'Toute la journée'
        : [fmtT(event.startTime), fmtT(event.endTime)].filter(Boolean).join(' - ');

    const eventResponses = proposalsData.responses.filter((r: any) => r.eventId === event.id);
    const eventComments = proposalsData.comments.filter((c: any) => c.eventId === event.id);

    const availableUsers = eventResponses.filter((r: any) => r.status === 'available').map((r: any) => users.find(u => u.id === r.userId));
    const unavailableUsers = eventResponses.filter((r: any) => r.status === 'unavailable').map((r: any) => users.find(u => u.id === r.userId));
    const userResponse = eventResponses.find((r: any) => r.userId === proposalsData.currentUserId)?.status;
    const isPrivateEvent = event.privacy === 'prive';

    const [attachments, setAttachments] = useState<EventAttachment[]>([]);
    const [newComment, setNewComment] = useState("");

    useEffect(() => {
        if (isOpen && event.id) {
            const fetchAttachments = async () => {
                const supabase = createClient();
                const att = await getEventAttachments(supabase, event.id);
                setAttachments(att);
            };
            fetchAttachments();
        }
    }, [isOpen, event.id]);

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            await proposalsData.postComment(event.id, newComment);
            setNewComment("");
        }
    };

    const getFileUrl = (filePath: string) => {
        const supabase = createClient();
        const { data } = supabase.storage.from('event-attachments').getPublicUrl(filePath);
        return data.publicUrl;
    };

    const eventColor = event.color || '#3b82f6';

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] p-0 flex flex-col">
                {/* Header stylisé avec la couleur de l'événement */}
                <div className="p-6 pb-4 border-b relative overflow-hidden shrink-0">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundColor: eventColor }} />
                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                            <span className="w-4 h-4 rounded-full" style={{ backgroundColor: eventColor }} />
                            {event.title}
                            {event.status === 'proposed' && (
                                <span className="ml-2 text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                                    En proposition
                                </span>
                            )}
                        </DialogTitle>
                        <DialogDescription asChild>
                            <div className="mt-2 text-foreground/80 font-medium">
                                {event.isMultiDate && event.status === 'proposed' ? (
                                    <div className="mb-1 text-amber-600 dark:text-amber-500 font-semibold flex items-center gap-2">
                                        <Calendar className="w-4 h-4" /> Sondage de dates en cours
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 mb-1">
                                        {dateFormatted} • {timeFormatted}
                                    </div>
                                )}
                                {event.location && (
                                    <div className="flex items-center gap-1.5 text-muted-foreground mt-2">
                                        <MapPin className="w-4 h-4" /> {event.location}
                                    </div>
                                )}
                            </div>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="absolute top-6 right-14 flex items-center gap-1.5 text-sm text-muted-foreground mr-2">
                        <span className="hidden sm:inline">Créé par</span>
                        <UserAvatar user={creator} className="font-semibold text-xs" />
                    </div>
                </div>

                <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-8">
                    {/* Description (affichée en haut pour les sondages) */}
                    {event.description && (
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</h4>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{event.description}</p>
                        </div>
                    )}

                    {/* Sondage de dates (Mullti-dates Doodle) */}
                    {event.isMultiDate && event.status === 'proposed' && (
                        <EventDateProposals eventId={event.id} creatorId={event.userId} onConfirmed={onClose} />
                    )}

                    {/* Checklist "Ce qu'on ramène" uniquement pour l'invitation à manger ET (date unique OU date choisie) */}
                    {event.category === 'Invitation à déjeuner/dîner' && (!event.isMultiDate || event.status === 'confirmed') && (
                        <EventChecklist eventId={event.id} />
                    )}

                    {/* Fichiers joints */}
                    {attachments.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Pièces jointes ({attachments.length})
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {attachments.map(att => (
                                    <a
                                        key={att.id}
                                        href={getFileUrl(att.filePath)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors group"
                                    >
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-sm font-medium truncate">{att.fileName}</span>
                                            <span className="text-xs text-muted-foreground">{(att.fileSize / 1024).toFixed(1)} KB</span>
                                        </div>
                                        <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Section Votes (Propositions Date Unique uniquement) */}
                    {event.status === 'proposed' && !event.isMultiDate && (
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Disponibilités</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border bg-green-50/50 dark:bg-green-950/20 border-green-100 dark:border-green-900/30">
                                    <h5 className="font-semibold text-green-700 dark:text-green-500 flex items-center gap-2 mb-3">
                                        <span className="w-2 h-2 rounded-full bg-green-500" /> Disponibles ({availableUsers.length})
                                    </h5>
                                    <div className="flex flex-wrap gap-2">
                                        {availableUsers.map((u: UserProfile | undefined) => u && (
                                            <div key={u.id} className="flex items-center px-2 py-1 bg-white dark:bg-slate-900 rounded-md shadow-sm border text-xs">
                                                <UserAvatar user={u} />
                                            </div>
                                        ))}
                                        {availableUsers.length === 0 && <span className="text-sm text-muted-foreground">Personne pour le moment</span>}
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl border bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30">
                                    <h5 className="font-semibold text-red-700 dark:text-red-500 flex items-center gap-2 mb-3">
                                        <span className="w-2 h-2 rounded-full bg-red-500" /> Pas dispos ({unavailableUsers.length})
                                    </h5>
                                    <div className="flex flex-wrap gap-2">
                                        {unavailableUsers.map((u: UserProfile | undefined) => u && (
                                            <div key={u.id} className="flex items-center px-2 py-1 bg-white dark:bg-slate-900 rounded-md shadow-sm border text-xs">
                                                <UserAvatar user={u} />
                                            </div>
                                        ))}
                                        {unavailableUsers.length === 0 && <span className="text-sm text-muted-foreground">Personne pour le moment</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Section d'Actions Rapides / Vote */}
                {!isPrivateEvent && event.status === 'proposed' && !isConfirmed && !event.isMultiDate && (
                    <div className="mt-4 p-4 sm:p-5 bg-muted/20 border-t sm:border rounded-none sm:rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 text-sm font-medium w-full sm:w-auto">
                            <span className="text-muted-foreground w-full text-center sm:text-left sm:w-auto">Votre disponibilité :</span>
                            <div className="flex gap-2 w-full sm:w-auto justify-center">
                                <button
                                    onClick={() => proposalsData.setResponse(event.id, 'available', userResponse)}
                                    className={cn("px-4 py-2 rounded-full border text-sm font-semibold transition-colors flex items-center gap-2",
                                        userResponse === 'available' ? 'bg-green-500 border-green-600 text-white shadow-sm' : 'bg-card border-border hover:bg-green-50 text-muted-foreground hover:text-green-600 hover:border-green-200')}
                                >
                                    <span className={cn("w-2.5 h-2.5 rounded-full", userResponse === 'available' ? 'bg-white' : 'bg-green-500')} />
                                    Je suis dispo
                                </button>
                                <button
                                    onClick={() => proposalsData.setResponse(event.id, 'unavailable', userResponse)}
                                    className={cn("px-4 py-2 rounded-full border text-sm font-semibold transition-colors flex items-center gap-2",
                                        userResponse === 'unavailable' ? 'bg-red-500 border-red-600 text-white shadow-sm' : 'bg-card border-border hover:bg-red-50 text-muted-foreground hover:text-red-600 hover:border-red-200')}
                                >
                                    <span className={cn("w-2.5 h-2.5 rounded-full", userResponse === 'unavailable' ? 'bg-white' : 'bg-red-500')} />
                                    Pas possible
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
