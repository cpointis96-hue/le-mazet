"use client";

import { useState, useEffect } from "react";
import { ChecklistCategory, ChecklistItem } from "@/types/calendar.types";
import { useSupabaseUsers } from "@/hooks/useSupabaseUsers";
import { createClient } from "@/lib/supabase/client";
import { getEventChecklistItems, addChecklistItem, deleteChecklistItem } from "@/lib/supabase/queries";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";

const CATEGORIES: Record<ChecklistCategory, { label: string; icon: string }> = {
    vin_rouge: { label: 'Vin Rouge', icon: '🍷' },
    vin_blanc: { label: 'Vin Blanc', icon: '🥂' },
    dessert: { label: 'Dessert', icon: '🍰' },
    saucisson: { label: 'Saucisson', icon: '🥓' },
    charcuterie: { label: 'Charcuterie', icon: '🥩' },
    fromage: { label: 'Fromage', icon: '🧀' },
    autres: { label: 'Autres', icon: '🛍️' },
};

export function EventChecklist({ eventId }: { eventId: string }) {
    const { currentUser } = useSupabaseUsers();
    const supabase = createClient();

    const [items, setItems] = useState<ChecklistItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Form state
    const [category, setCategory] = useState<ChecklistCategory>('vin_rouge');
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Charger les items initiaux
    useEffect(() => {
        const fetchItems = async (showLoading = false) => {
            if (showLoading) setIsLoading(true);
            const data = await getEventChecklistItems(supabase, eventId);
            setItems(data);
            if (showLoading) setIsLoading(false);
        };
        fetchItems(true);

        // Realtime Subscription
        const channel = supabase.channel(`checklist_${eventId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'event_checklist_items',
                    filter: `event_id=eq.${eventId}`
                },
                () => {
                    // Refetch on any change to keep the joined user data fresh
                    fetchItems(false);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [eventId, supabase]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        const currentDesc = description.trim();
        setIsSubmitting(true);

        // Optimistic UI Update
        // Use crypto.randomUUID() so Postgres doesn't crash on immediate delete
        const tempId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `temp-${Date.now()}`;
        const newItem: ChecklistItem = {
            id: tempId,
            eventId,
            userId: currentUser.id,
            category,
            description: currentDesc || null,
            createdAt: new Date().toISOString(),
            user: {
                displayName: currentUser.displayName,
                color: currentUser.color,
                avatarId: currentUser.avatarId
            }
        };
        setItems(prev => [...prev, newItem]);
        setDescription("");

        const success = await addChecklistItem(supabase, eventId, currentUser.id, category, currentDesc || null);
        if (!success) {
            // Revert on failure
            setItems(prev => prev.filter(item => item.id !== tempId));
            setDescription(currentDesc);
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (itemId: string) => {
        // Optimistic UI Update
        const previousItems = [...items];
        setItems(prev => prev.filter(item => item.id !== itemId));

        const success = await deleteChecklistItem(supabase, itemId);
        if (!success) {
            // Revert on failure
            setItems(previousItems);
        }
    };

    // Grouper les items par catégorie pour l'affichage
    const groupedItems = items.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<ChecklistCategory, ChecklistItem[]>);

    return (
        <div className="space-y-4 p-4 rounded-xl border border-border/50">
            <h3 className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                🛍️ Ce qu'on ramène
            </h3>

            {/* Liste des items groupés */}
            {isLoading ? (
                <div className="text-sm text-muted-foreground animate-pulse">Chargement...</div>
            ) : items.length === 0 ? (
                <div className="text-sm text-muted-foreground italic">Encore rien de prévu.</div>
            ) : (
                <div className="flex flex-col gap-3">
                    {/* On parcourt l'ordre officiel des catégories pour garder un tri logique */}
                    {(Object.keys(CATEGORIES) as ChecklistCategory[]).map(catKey => {
                        const catItems = groupedItems[catKey];
                        if (!catItems || catItems.length === 0) return null;
                        const catDef = CATEGORIES[catKey];

                        return (
                            <div key={catKey} className="flex flex-col sm:flex-row sm:items-start gap-2 border-b border-border/50 pb-3 last:border-0 last:pb-0">
                                {/* Colonne Gauche : Catégorie */}
                                <div className="w-full sm:w-[130px] shrink-0 flex items-center gap-2 pt-1">
                                    <span className="text-base leading-none">{catDef.icon}</span>
                                    <span className="font-semibold text-sm text-foreground/90">{catDef.label}</span>
                                </div>

                                {/* Colonne Droite : Pilules */}
                                <div className="flex flex-wrap gap-2 flex-1">
                                    {catItems.map(item => {
                                        const isMine = item.userId === currentUser?.id;

                                        return (
                                            <div
                                                key={item.id}
                                                className="inline-flex items-center gap-1.5 bg-background border px-3 py-1.5 rounded-full text-xs shadow-sm"
                                            >
                                                {item.description && (
                                                    <span className="font-medium text-foreground max-w-[150px] truncate">
                                                        {item.description}
                                                    </span>
                                                )}
                                                <span className="text-muted-foreground font-medium">
                                                    {item.description ? '— ' : ''}
                                                    {isMine ? 'Moi' : item.user?.displayName || 'Anonyme'}
                                                </span>

                                                {isMine && (
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="ml-1 text-muted-foreground hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/30"
                                                        title="Retirer"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Formulaire d'ajout */}
            {currentUser && (
                <form onSubmit={handleAdd} className="flex gap-2 mt-2 pt-2 border-t">
                    <Select value={category} onValueChange={(v) => setCategory(v as ChecklistCategory)}>
                        <SelectTrigger className="w-[140px] h-9 text-sm shrink-0">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(CATEGORIES).map(([key, data]) => (
                                <SelectItem key={key} value={key} className="text-sm">
                                    <span className="mr-2">{data.icon}</span> {data.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Input
                        placeholder="Qté / Précisons (ex: 2 bouteilles)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="h-9 text-sm"
                    />

                    <Button type="submit" disabled={isSubmitting} size="sm" className="h-9 px-3 shrink-0">
                        <Plus className="w-4 h-4" />
                    </Button>
                </form>
            )}
        </div>
    );
}
