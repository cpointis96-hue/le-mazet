"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { EventForm } from "@/components/events/EventForm";
import { useAppData } from "@/contexts/AppDataContext";

export const dynamic = 'force-dynamic';

export default function NouvelEvenementPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');

    const { eventsData, proposalsData } = useAppData();

    const eventToEdit = editId ? eventsData.events.find(e => e.id === editId) : null;
    const eventProposals = editId
        ? proposalsData.dateProposals.filter((p: any) => p.eventId === editId)
        : [];
    const initialData = eventToEdit
        ? { ...eventToEdit, proposals: eventProposals }
        : undefined;

    const handleSubmit = async (data: any, files?: File[]) => {
        if (editId && eventToEdit) {
            await eventsData.updateEvent(editId, data, files);
        } else {
            await eventsData.addEvent(data, files);
        }
        router.push('/calendrier');
    };

    return (
        <div className="max-w-3xl mx-auto py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">
                    {editId ? "Modifier l'événement" : "Nouvel Événement"}
                </h1>
                <p className="text-muted-foreground">
                    {editId ? "Modifiez les informations de l'événement" : "Créez un événement pour le groupe"}
                </p>
            </div>
            <EventForm onSubmit={handleSubmit} initialData={initialData} />
        </div>
    );
}
