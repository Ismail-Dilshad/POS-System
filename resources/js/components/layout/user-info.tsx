import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { useTranslation } from '@/hooks/use-translation';
import { type User } from '@/types';

export function UserInfo({
    user,
    showUsername = false,
    showRole = false,
}: {
    user: User;
    showUsername?: boolean;
    showRole?: boolean;
}) {
    const getInitials = useInitials();
    const { getCurrentLanguage, t } = useTranslation();
    const currentLanguage = getCurrentLanguage();
    const isKurdish = currentLanguage === 'ku';

    const roleLabel = user.role
        ? t(`roles.${user.role}`, { defaultValue: user.role })
        : undefined;

    return (
        <div className="flex items-center gap-3 flex-1">
            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                <AvatarImage src={user.avatar} alt={user.full_name} />
                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                    {getInitials(user.full_name)}
                </AvatarFallback>
            </Avatar>
            <div
                className={`grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden ${isKurdish ? 'text-base' : 'text-sm'}`}
            >
                <span className="truncate font-medium">{user.full_name}</span>
                {showUsername && (
                    <span
                        className={`truncate text-muted-foreground ${isKurdish ? 'text-sm' : 'text-xs'}`}
                    >
                        {user.username}
                    </span>
                )}
                {showRole && roleLabel && (
                    <span
                        className={`truncate text-muted-foreground ${isKurdish ? 'text-sm' : 'text-xs'}`}
                    >
                        {roleLabel}
                    </span>
                )}
            </div>
        </div>
    );
}
