"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarEvent, EventDateProposal } from "@/types/calendar.types";
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
import { cn } from "@/lib/utils";

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
    initialData?: CalendarEvent & { proposals?: EventDateProposal[] };
    onSubmit?: (data: EventFormValues, files?: File[]) => void;
    onCancel?: () => void;
    isProposal?: boolean;
}

export function EventForm({ initialData, onSubmit, onCancel, isProposal = false }: EventFormProps) {
    const router = useRouter();

    const todayStr = new Date().toLocaleDateString('en-CA');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const isVacationInitial = initialData
        ? (Boolean(initialData.allDay) && !!initialData.endDate && initialData.endDate > initialData.startDate)
        : false;

    const { register, handleSubmit, control, watch, setValue, getValues, formState: { errors } } = useForm<EventFormValues>({
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
            isMultiDate: initialData?.isMultiDate ?? false,
            proposals: initialData?.proposals && initialData.proposals.length > 0
                ? initialData.proposals.map(p => ({
                    startDate: p.startDate,
                    endDate: p.endDate || p.startDate,
                    startTime: p.startTime || "19:00",
                    comment: p.comment || ""
                }))
                : initialData?.startDate
                    ? [{ startDate: initialData.startDate, endDate: initialData.endDate || initialData.startDate, startTime: initialData.startTime || "19:00", comment: "" }]
                    : [{ startDate: todayStr, endDate: todayStr, startTime: "19:00", comment: "" }],
        },
    });

    const { fields: proposalFields, append: appendProposal, remove: removeProposal, replace: replaceProposals } = useFieldArray({
        control,
        name: "proposals"
    });

    const isVacation = watch("isVacation");
    const isMultiDate = watch("isMultiDate");

    const submitHandler = (data: EventFormValues) => {
        data.allDay = data.isVacation;

        // Calculer si on a plusieurs dates/périodes
        const hasMultipleDates = data.proposals && data.proposals.length > 1;

        if (data.isVacation && data.proposals?.length) {
            data.startDate = data.proposals[0].startDate || todayStr;
            data.endDate = data.proposals[0].endDate || data.startDate;
            data.category = "Vacances";
            // Si c'est multi-période, on transforme en sondage (Doodle)
            if (hasMultipleDates) {
                data.isMultiDate = true;
                data.status = "proposed";
            } else {
                data.isMultiDate = false;
                // Si une seule période, on peut être confirmed dès le départ si on veut, 
                // mais le défaut est 'proposed' pour passer par le flux de validation du groupe par défaut
            }
        } else if (data.isMultiDate && data.proposals?.length) {
            data.startDate = data.proposals[0].startDate || todayStr;
            data.endDate = data.proposals[0].endDate || data.startDate;
            data.startTime = data.proposals[0].startTime || undefined;
            data.endTime = undefined;
            data.status = "proposed"; // Multi-date est TOUJOURS une proposition au début
        } else if (!data.isVacation && !data.isMultiDate) {
            data.endDate = data.startDate || todayStr;
            data.startDate = data.startDate || todayStr;
        }

        // Sécurité supplémentaire : s'il y a plusieurs propositions, c'est forcément un sondage multi-dates
        if (hasMultipleDates) {
            data.isMultiDate = true;
            data.status = "proposed";
        }

        // Nettoyage final pour Postgres
        if (data.pollDeadline === "") data.pollDeadline = undefined;
        if (data.startDate === "") data.startDate = todayStr;
        if (data.endDate === "") data.endDate = data.startDate || todayStr;

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

                {/* Toggles : Vacances & Date multiple */}
                <div className="flex items-center gap-6 pb-4 border-b">
                    <div className="flex items-center space-x-2">
                        <Controller
                            control={control}
                            name="isVacation"
                            render={({ field }) => (
                                <Switch
                                    id="isVacation"
                                    checked={field.value}
                                    onCheckedChange={(val) => {
                                        field.onChange(val);
                                        const currentStartDate = getValues("startDate") || todayStr;
                                        if (val) {
                                            setValue("isMultiDate", false);
                                            setValue("category", "Vacances", { shouldValidate: true, shouldDirty: true });
                                            replaceProposals([{ startDate: currentStartDate, endDate: currentStartDate, startTime: "09:00", comment: "" }]);
                                        } else {
                                            setValue("category", CATEGORIES[0], { shouldValidate: true, shouldDirty: true });
                                        }
                                    }}
                                />
                            )}
                        />
                        <Label htmlFor="isVacation">Vacances</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Controller
                            control={control}
                            name="isMultiDate"
                            render={({ field }) => (
                                <Switch
                                    id="isMultiDate"
                                    checked={field.value}
                                    onCheckedChange={(val) => {
                                        field.onChange(val);
                                        const currentStartDate = getValues("startDate") || todayStr;
                                        if (val) {
                                            setValue("isVacation", false);
                                            setValue("category", CATEGORIES[0], { shouldValidate: true, shouldDirty: true });
                                            setValue("status", "proposed");
                                            replaceProposals([{ startDate: currentStartDate, endDate: currentStartDate, startTime: "19:00", comment: "" }]);
                                        }
                                    }}
                                />
                            )}
                        />
                        <Label htmlFor="isMultiDate">Dates multiples</Label>
                    </div>
                </div>

                {/* Catégorie juste en dessous */}
                <div className="pb-4 border-b">
                    <Label className={cn(isVacation && "text-muted-foreground")}>Catégorie</Label>
                    <Controller
                        control={control}
                        name="category"
                        render={({ field }) => (
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={isVacation}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Choisir..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {!isVacation && CATEGORIES.map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                    {isVacation && <SelectItem value="Vacances">Vacances</SelectItem>}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>

                {/* Date de fin de sondage (si isMultiDate) */}
                {isMultiDate && (
                    <div className="flex items-center gap-3 flex-wrap">
                        <Label htmlFor="pollDeadline" className="text-sm text-muted-foreground shrink-0">Fin du sondage (optionnel) :</Label>
                        <Input id="pollDeadline" type="date" {...register("pollDeadline")} className="flex-1 min-w-[160px] max-w-[200px]" />
                    </div>
                )}

                {/* Date fields — événement normal */}
                {!isMultiDate && !isVacation && (
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label htmlFor="startDate">Date</Label>
                            <Input id="startDate" type="date" {...register("startDate")} className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="startTime">Heure</Label>
                            <Input id="startTime" type="time" {...register("startTime")} className="mt-1" />
                        </div>
                    </div>
                )}

                {/* Date fields — vacances (périodes multiples) */}
                {!isMultiDate && isVacation && (
                    <div className="space-y-3">
                        {proposalFields.map((field, index) => (
                            <div key={field.id} className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                    <Input type="date" className="flex-1 text-sm" {...register(`proposals.${index}.startDate` as const)} />
                                    <span className="text-muted-foreground text-xs shrink-0">→</span>
                                    <Input type="date" className="flex-1 text-sm" {...register(`proposals.${index}.endDate` as const)} />
                                    {proposalFields.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeProposal(index)}
                                            className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <Input type="text" className="text-sm" placeholder="Commentaire (optionnel)..." {...register(`proposals.${index}.comment` as const)} />
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => {
                                const currentP = getValues("proposals");
                                const lastDate = currentP && currentP.length > 0 ? currentP[currentP.length - 1].startDate : todayStr;
                                appendProposal({ startDate: lastDate, endDate: lastDate, startTime: "09:00", comment: "" });
                            }}
                            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors mt-1"
                        >
                            <Plus className="w-3.5 h-3.5" /> Ajouter une période
                        </button>
                    </div>
                )}

                {/* Proposals (sondage mode) */}
                {isMultiDate && (
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold">Dates proposées</Label>
                        <div className="space-y-2">
                            {proposalFields.map((field, index) => (
                                <div key={field.id} className="flex flex-wrap gap-2 items-center">
                                    <Input type="date" className="flex-1 min-w-[130px] text-sm" {...register(`proposals.${index}.startDate` as const)} />
                                    <Input type="time" className="w-[108px] shrink-0 text-sm" {...register(`proposals.${index}.startTime` as const)} />
                                    <Input type="text" className="flex-[2] min-w-[100px] text-sm" placeholder="Commentaire..." {...register(`proposals.${index}.comment` as const)} />
                                    {proposalFields.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeProposal(index)}
                                            className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                const currentP = getValues("proposals");
                                const lastDate = currentP && currentP.length > 0 ? currentP[currentP.length - 1].startDate : todayStr;
                                appendProposal({ startDate: lastDate, endDate: lastDate, startTime: "19:00", comment: "" });
                            }}
                            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" /> Ajouter une option
                        </button>
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

                <div className="grid grid-cols-1 gap-4">
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
                <Button variant="outline" type="button" onClick={() => onCancel ? onCancel() : router.back()}>
                    Annuler
                </Button>
                <Button type="submit">
                    Enregistrer
                </Button>
            </div>
        </form >
    );
}
