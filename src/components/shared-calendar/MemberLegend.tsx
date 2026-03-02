import { cn } from "@/lib/utils";
import { UserProfile } from "@/hooks/useSupabaseUsers";
import { UserAvatar } from "@/components/ui/UserAvatar";

interface MemberLegendProps {
    members: UserProfile[];
}

export function MemberLegend({ members }: MemberLegendProps) {
    if (!members.length) return null;

    return (
        <ul className="space-y-4 py-2">
            {members.map((member) => (
                <li key={member.id} className="flex items-center gap-2 group cursor-pointer pl-3">
                    <UserAvatar user={member} className="text-base" />
                    {member.isCurrentUser && <span className="text-muted-foreground text-xs">(Vous)</span>}
                </li>
            ))}
        </ul>
    );
}
