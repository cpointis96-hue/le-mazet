"use client";

import { CalendarEvent } from "@/types/calendar.types";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getEventAttachments, EventAttachment } from "@/lib/supabase/attachments";
import { FileText, Download, ImageIcon } from "lucide-react";

interface EventDetailProps {
    event: CalendarEvent;
}

export function EventDetail({ event }: EventDetailProps) {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    const [attachments, setAttachments] = useState<EventAttachment[]>([]);

    useEffect(() => {
        if (event.id) {
            const supabase = createClient();
            getEventAttachments(supabase, event.id).then(setAttachments);
        }
    }, [event.id]);

    // Utilise l'URL signée générée par getEventAttachments (bucket privé)
    const getFileUrl = (attachment: EventAttachment) =>
        attachment.signedUrl ?? '';

    const imageAttachments = attachments.filter(a =>
        ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(a.fileType.toLowerCase())
    );
    const otherAttachments = attachments.filter(a =>
        !['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(a.fileType.toLowerCase())
    );

    return (
        <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: event.color }} />
                <h3 className="text-xl font-bold">{event.title}</h3>
            </div>

            <div className="text-sm space-y-2 text-muted-foreground">
                <div>
                    <strong className="text-foreground">Date : </strong>
                    {format(startDate, 'PP', { locale: fr })}
                    {event.startDate !== event.endDate && ` au ${format(endDate, 'PP', { locale: fr })}`}
                </div>

                {!event.allDay && event.startTime && (
                    <div>
                        <strong className="text-foreground">Heure : </strong>
                        {event.startTime} {event.endTime && ` - ${event.endTime}`}
                    </div>
                )}

                {event.allDay && (
                    <div>
                        <strong className="text-foreground">Heure : </strong>
                        Toute la journée
                    </div>
                )}

                {event.location && (
                    <div>
                        <strong className="text-foreground">Lieu : </strong>
                        {event.location}
                    </div>
                )}

                {event.category && (
                    <div className="flex items-center gap-2">
                        <strong className="text-foreground">Catégorie : </strong>
                        <Badge variant="secondary">{event.category}</Badge>
                    </div>
                )}

                {event.description && (
                    <div className="mt-4 pt-4 border-t">
                        <h4 className="font-semibold text-foreground mb-1">Description</h4>
                        <p className="whitespace-pre-wrap">{event.description}</p>
                    </div>
                )}

                {/* Images */}
                {imageAttachments.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                        <h4 className="font-semibold flex items-center gap-2 mb-3 text-foreground">
                            <ImageIcon className="w-4 h-4" /> Images jointes ({imageAttachments.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {imageAttachments.map(img => (
                                <a
                                    key={img.id}
                                    href={getFileUrl(img)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block group overflow-hidden rounded-lg border bg-muted/20 relative"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={getFileUrl(img)}
                                        alt={img.fileName}
                                        className="w-full h-auto object-cover max-h-64 sm:max-h-48 group-hover:scale-105 transition-transform duration-300"
                                    />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Autres fichiers */}
                {otherAttachments.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Pièces jointes ({otherAttachments.length})
                        </h4>
                        <div className="flex flex-col gap-2">
                            {otherAttachments.map(att => (
                                <a
                                    key={att.id}
                                    href={getFileUrl(att)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors group"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-2 bg-background rounded-md shadow-sm shrink-0">
                                            <FileText className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-sm font-medium truncate">{att.fileName}</span>
                                            <span className="text-xs text-muted-foreground">{(att.fileSize / 1024).toFixed(1)} KB</span>
                                        </div>
                                    </div>
                                    <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-3" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
