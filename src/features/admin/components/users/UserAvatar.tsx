'use client';

import { AvatarDisplay } from '@/features/profile/components/AvatarDisplay';
import { useAvatarBlob } from '@/hooks/useAvatarBlob';

interface UserAvatarProps {
    userId: string;
    size?: number;
    enabled?: boolean;
}

export default function UserAvatar({ userId, size = 36, enabled = true }: UserAvatarProps) {
    const { avatarBlobUrl, loadingAvatar } = useAvatarBlob(userId, { enabled });

    return <AvatarDisplay blobUrl={avatarBlobUrl} loading={loadingAvatar} size={size} />;
}
