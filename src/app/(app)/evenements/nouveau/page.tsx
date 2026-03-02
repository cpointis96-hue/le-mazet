"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { EventForm } from "@/components/events/EventForm";
import { useSupabaseEvents } from "@/hooks/useSupabaseEvents";

export default function NouvelEvenementPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isProposal = searchParams.get('type') === 'proposal';
    const { addEvent } = useSupabaseEvents();

    const handleSubmit = (data: any, files?: File[]) => {
        addEvent(data, files);
        if (isProposal) {
            router.push('/evenements');
        } else {
            router.push('/mon-calendrier');
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">
                    {isProposal ? "Nouvelle Proposition d'Événement" : "Nouvel Événement"}
                </h1>
                <p className="text-muted-foreground">
                    {isProposal ? "Proposez une idée d'événement au groupe" : "Créez un événement pour votre calendrier"}
                </p>
            </div>

            <EventForm onSubmit={handleSubmit} isProposal={isProposal} />
        </div>
    );
}
