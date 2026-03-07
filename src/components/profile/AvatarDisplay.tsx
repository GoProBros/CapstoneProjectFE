"use client";

import React from 'react';
import { Spinner } from './Spinner';

interface AvatarDisplayProps {
    blobUrl: string | null;
    loading: boolean;
    size?: number;
}

export function AvatarDisplay({ blobUrl, loading, size = 80 }: AvatarDisplayProps) {
    return (
        <div
            className="rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center flex-shrink-0"
            style={{ width: size, height: size }}
        >
            {loading ? (
                <Spinner className="w-5 h-5 text-green-500" />
            ) : blobUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={blobUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
                <svg
                    className="text-gray-400"
                    style={{ width: size * 0.45, height: size * 0.45 }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                </svg>
            )}
        </div>
    );
}
