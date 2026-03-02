import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select";

interface RecurrenceEditorProps {
    value?: string;
    onChange: (value: string) => void;
}

export function RecurrenceEditor({ value, onChange }: RecurrenceEditorProps) {
    return (
        <Select value={value || "aucun"} onValueChange={onChange}>
            <SelectTrigger>
                <SelectValue placeholder="Récurrence..." />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="aucun">Aucune</SelectItem>
                <SelectItem value="FREQ=DAILY">Quotidienne</SelectItem>
                <SelectItem value="FREQ=WEEKLY">Hebdomadaire</SelectItem>
                <SelectItem value="FREQ=MONTHLY">Mensuelle</SelectItem>
                <SelectItem value="FREQ=YEARLY">Annuelle</SelectItem>
            </SelectContent>
        </Select>
    );
}
