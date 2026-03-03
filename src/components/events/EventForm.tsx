"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarEvent, PrivacyLevel } from "@/types/calendar.types";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Switch } from "@/components/ui/Switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/Select";
import { EVENT_COLORS, CATEGORIES } from "@/lib/constants";

const eventSchema = z.object({
    title: z.string().min(1, "Le titre est requis"),
    description: z.string().optional(),
    location: z.string().optional(),
    startDate: z.string().min(1, "Date requise"),
    endDate: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    allDay: z.boolean(),
    isVacation: z.boolean(),
    color: z.string(),
    category: z.string().optional(),
    status: z.enum(["proposed", "confirmed"]),
    isMultiDate: z.boolean().optional(),
    proposals: z.array(z.object({
        startDate: z.string().min(1, "Date requise"),
        endDate: z.string().optional(),
        startTime: z.string().optional(),
        comment: z.string().optional()
    })).optional(),
    pollDeadline: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface EventFormProps {
    initialData?: CalendarEvent;
    onSubmit?: (data: EventFormValues, files?: File[]) => void;
    isProposal?: boolean;
}

export function EventForm({ initialData, onSubmit, isProposal = false }: EventFormProps) {
    const router = useRouter();

    const todayStr = new Date().toLocaleDateString('en-CA');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const isVacationInitial = initialData
        ? (initialData.allDay && !!initialData.endDate && initialData.endDate > initialData.startDate)
        : false;

    const { register, handleSubmit, control, watch, formState: { errors } } = useForm<EventFormValues>({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            title: initialData?.title || "",
            description: initialData?.description || "",
            location: initialData?.location || "",
            startDate: initialData?.startDate || todayStr,
            endDate: initialData?.endDate || todayStr,
            startTime: initialData?.startTime || "09:00",
            endTime: initialData?.endTime || "10:00",
            allDay: initialData?.allDay ?? false,
            isVacation: isVacationInitial,
            color: initialData?.color || EVENT_COLORS[0].value,
            category: initialData?.category || CATEGORIES[0],
            status: initialData?.status || (isProposal ? "proposed" : "confirmed"),
            isMultiDate: false,
            proposals: [{ startDate: todayStr, endDate: todayStr, startTime: "19:00", comment: "" }],
        },
    });

    const { fields: proposalFields, append: appendProposal, remove: removeProposal } = useFieldArray({
        control,
        name: "proposals"
    });

    const isVacation = watch("isVacation");
    const isMultiDate = watch("isMultiDate");

    const submitHandler = (data: EventFormValues) => {
        data.allDay = data.isVacation;

        if (!data.isVacation) {
            data.endDate = data.startDate;
            data.endTime = data.startTime;
        }

        if (onSubmit) {
            onSubmit(data, selectedFiles);
        } else {
            router.push("/mon-calendrier");
        }
    };

    return (
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-6 w-full max-w-2xl mx-auto p-4 sm:p-6 bg-card rounded-xl border shadow-sm">
            <div className="space-y-4">
                <div>
                    <Label htmlFor="title">Titre de l'événement</Label>
                    <Input id="title" {...register("title")} placeholder="Ex: Brasserie en vue" className="mt-1" />
                    {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
                </div>

                {/* Vacances toggle */}
                <div className="flex items-center space-x-2">
                    <Controller
                        control={control}
                        name="isVacation"
                        render={({ field }) => (
                            <Switch
                                id="isVacation"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        )}
                    />
                    <Label htmlFor="isVacation">Vacances</Label>
                </div>

                {/* Sondage toggle */}
                <div className="flex items-center space-x-2 pb-4 border-b">
                    <Controller
                        control={control}
                        name="isMultiDate"
                        render={({ field }) => (
                            <Switch
                                id="isMultiDate"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        )}
                    />
                    <Label htmlFor="isMultiDate">Proposer plusieurs dates/heures (Mode Sondage)</Label>
                </div>

                {/* Date de fin de sondage (si isMultiDate) */}
                {isMultiDate && (
                    <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
                        <Label htmlFor="pollDeadline" className="text-amber-800 dark:text-amber-500 font-semibold mb-2 block">
                            Date limite de réponse au sondage (Optionnel)
                        </Label>
                        <Input id="pollDeadline" type="date" {...register("pollDeadline")} className="mt-1 max-w-sm" />
                        <p className="text-xs text-muted-foreground mt-2">
                            Si renseignée, une indication visuelle rappellera aux invités de voter avant cette date.
                        </p>
                    </div>
                )}

                {/* Date fields */}
                {!isMultiDate && (
                    isVacation ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="startDate">Date de début</Label>
                                <Input id="startDate" type="date" {...register("startDate")} className="mt-1" />
                            </div>
                            <div>
                                <Label htmlFor="endDate">Date de fin</Label>
                                <Input id="endDate" type="date" {...register("endDate")} className="mt-1" />
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="startDate">Date</Label>
                                <Input id="startDate" type="date" {...register("startDate")} className="mt-1" />
                            </div>
                            <div>
                                <Label htmlFor="startTime">Heure</Label>
                                <Input id="startTime" type="time" {...register("startTime")} className="mt-1" />
                            </div>
                        </div>
                    )
                )}

                {/* Proposals (sondage mode) */}
                {isMultiDate && (
                    <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-border/50">
                        <Label>Dates proposées</Label>
                        <div className="space-y-3 mt-2">
                            {proposalFields.map((field, index) => (
                                <div key={field.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end pt-6 sm:pt-0 p-3 sm:p-0 border sm:border-0 rounded-lg sm:rounded-none bg-background sm:bg-transparent relative">
                                    <div className="flex-1 w-full">
                                        <Label className="text-xs text-muted-foreground">Date</Label>
                                        <Input type="date" className="w-full" {...register(`proposals.${index}.startDate` as const)} />
                                    </div>
                                    {isVacation ? (
                                        <div className="flex-1 w-full">
                                            <Label className="text-xs text-muted-foreground">Date de fin</Label>
                                            <Input type="date" className="w-full" {...register(`proposals.${index}.endDate` as const)} />
                                        </div>
                                    ) : (
                                        <div className="flex-1 w-full sm:max-w-[120px]">
                                            <Label className="text-xs text-muted-foreground">Heure</Label>
                                            <Input type="time" className="w-full" {...register(`proposals.${index}.startTime` as const)} />
                                        </div>
                                    )}
                                    <div className="flex-[2] w-full">
                                        <Label className="text-xs text-muted-foreground">Commentaire (optionnel)</Label>
                                        <Input type="text" className="w-full" placeholder="Ex: Début de soirée..." {...register(`proposals.${index}.comment` as const)} />
                                    </div>
                                    {proposalFields.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-1 right-1 sm:static sm:top-auto sm:right-auto text-muted-foreground hover:text-red-500 shrink-0 h-6 w-6 sm:h-10 sm:w-10"
                                            onClick={() => removeProposal(index)}
                                        >
                                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-4 w-full"
                            onClick={() => appendProposal({ startDate: todayStr, endDate: todayStr, startTime: "19:00", comment: "" })}
                        >
                            <Plus className="w-4 h-4 mr-2" /> Ajouter une option
                        </Button>
                    </div>
                )}

                <div>
                    <Label htmlFor="location">Lieu</Label>
                    <Input id="location" {...register("location")} placeholder="Ex: ProRace Café" className="mt-1" />
                </div>

                <div>
                    <Label htmlFor="description">Description</Label>
                    <textarea
                        id="description"
                        {...register("description")}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1"
                        placeholder="Envie de vous voir bande de Fifou !"
                    />
                </div>

                <div>
                    <Label htmlFor="attachments">Pièces jointes (Images, PDF, Documents...)</Label>
                    <Input
                        id="attachments"
                        type="file"
                        multiple
                        className="mt-1 cursor-pointer"
                        onChange={(e) => {
                            if (e.target.files) {
                                setSelectedFiles(Array.from(e.target.files));
                            }
                        }}
                    />
                    {selectedFiles.length > 0 && (
                        <div className="mt-2 flex flex-col gap-1">
                            <p className="text-xs font-semibold text-muted-foreground">Fichiers sélectionnés :</p>
                            <ul className="text-sm list-disc pl-5">
                                {selectedFiles.map((file, i) => (
                                    <li key={i} className="text-muted-foreground truncate">{file.name} ({(file.size / 1024).toFixed(1)} KB)</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label>Catégorie</Label>
                        <Controller
                            control={control}
                            name="category"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Choisir..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    <div>
                        <Label>Couleur</Label>
                        <Controller
                            control={control}
                            name="color"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Choisir..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {EVENT_COLORS.map(c => (
                                            <SelectItem key={c.value} value={c.value}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.value }} />
                                                    {c.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t pt-6">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                    Annuler
                </Button>
                <Button type="submit">
                    Enregistrer
                </Button>
            </div>
        </form>
    );
}
