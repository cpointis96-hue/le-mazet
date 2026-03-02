import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select";

interface ReminderEditorProps {
    value?: number;
    onChange: (value: number) => void;
}

export function ReminderEditor({ value, onChange }: ReminderEditorProps) {
    return (
        <Select
            value={value === undefined ? "aucun" : value.toString()}
            onValueChange={(val) => onChange(val === "aucun" ? 0 : parseInt(val, 10))}
        >
            <SelectTrigger>
                <SelectValue placeholder="Rappel..." />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="aucun">Aucun</SelectItem>
                <SelectItem value="5">5 min avant</SelectItem>
                <SelectItem value="15">15 min avant</SelectItem>
                <SelectItem value="30">30 min avant</SelectItem>
                <SelectItem value="60">1h avant</SelectItem>
                <SelectItem value="1440">1 jour avant</SelectItem>
            </SelectContent>
        </Select>
    );
}
