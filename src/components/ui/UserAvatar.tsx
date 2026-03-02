import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";

interface UserAvatarProps {
    user: { displayName?: string; color?: string; } | null | undefined;
    className?: string;
}

export function UserAvatar({ user, className }: UserAvatarProps) {
    if (!user) {
        return (
            <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap select-none", className)}>
                <span className="font-medium text-muted-foreground capitalize">
                    Anonyme
                </span>
            </span>
        );
    }

    return (
        <span
            className={cn("inline-flex items-center gap-1.5 whitespace-nowrap select-none", className)}
            title={user.displayName}
        >
            <span className="font-medium text-muted-foreground capitalize">
                {user.displayName}
            </span>
        </span>
    );
}
