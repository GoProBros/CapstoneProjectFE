'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fileService } from '@/services/fileService';
import { FileCategory } from '@/types/file';

interface UseAvatarBlobOptions {
    enabled?: boolean;
}

interface UseAvatarBlobResult {
    avatarBlobUrl: string | null;
    loadingAvatar: boolean;
}

export function useAvatarBlob(
    userId?: string,
    options: UseAvatarBlobOptions = {}
): UseAvatarBlobResult {
    const { enabled = true } = options;
    const blobUrlRef = useRef<string | null>(null);
    const [avatarBlobUrl, setAvatarBlobUrl] = useState<string | null>(null);
    const [loadingAvatar, setLoadingAvatar] = useState(false);

    const loadAvatar = useCallback(async (id: string) => {
        setLoadingAvatar(true);
        try {
            const blob = await fileService.downloadFile({
                category: FileCategory.Avatar,
                entityId: id,
            });

            if (blobUrlRef.current) {
                URL.revokeObjectURL(blobUrlRef.current);
            }

            const url = URL.createObjectURL(blob);
            blobUrlRef.current = url;
            setAvatarBlobUrl(url);
        } catch {
            setAvatarBlobUrl(null);
        } finally {
            setLoadingAvatar(false);
        }
    }, []);

    useEffect(() => {
        if (!enabled || !userId) {
            setAvatarBlobUrl(null);
            setLoadingAvatar(false);
            if (blobUrlRef.current) {
                URL.revokeObjectURL(blobUrlRef.current);
                blobUrlRef.current = null;
            }
            return;
        }

        loadAvatar(userId);
    }, [enabled, userId, loadAvatar]);

    useEffect(() => {
        return () => {
            if (blobUrlRef.current) {
                URL.revokeObjectURL(blobUrlRef.current);
            }
        };
    }, []);

    return { avatarBlobUrl, loadingAvatar };
}
