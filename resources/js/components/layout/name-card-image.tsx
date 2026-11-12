import { Image as ImageIcon } from 'lucide-react';
import { getItemImageUrl } from '@/lib/item-image';
import React, { useState } from 'react';

interface CachedImageData {
    base64: string;
    mime_type: string;
    size: number;
    original_name: string;
    data_url: string;
}

interface NameCardImageProps {
    nameCard: {
        id: number;
        name: string;
        image_url?: string | null;
        has_image?: boolean;
        image_data?: CachedImageData;
    };
    className?: string;
    aspectRatio?: string;
    useCache?: boolean;
}

export const NameCardImage: React.FC<NameCardImageProps> = ({
    nameCard,
    className = 'w-full h-full object-cover',
    aspectRatio = 'aspect-video',
    useCache = false,
}) => {
    const [failedUrl, setFailedUrl] = useState<string | null>(null);
    const [loadedUrl, setLoadedUrl] = useState<string | null>(null);

    // Generate robust image URL or use cached data
    const getImageUrl = (): string => {
        // Use cached image data if available and useCache is true
        if (useCache && nameCard.image_data?.data_url) {
            return nameCard.image_data.data_url;
        }

        return getItemImageUrl(nameCard) || '';
    };

    const handleImageError = () => {
        setFailedUrl(imageUrl);
    };

    const handleImageLoad = () => {
        setFailedUrl(null);
        setLoadedUrl(imageUrl);
    };

    const imageUrl = getImageUrl();
    const imageError = failedUrl === imageUrl;
    const imageLoading = loadedUrl !== imageUrl && !imageError;
    const shouldShowImage = imageUrl && !imageError;

    return (
        <div
            className={`${aspectRatio} relative overflow-hidden rounded-md bg-muted ${className}`}
        >
            {shouldShowImage ? (
                <>
                    {/* Loading state */}
                    {imageLoading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-8 w-8 animate-pulse rounded bg-muted-foreground/20"></div>
                        </div>
                    )}

                    {/* Actual image */}
                    <img
                        key={imageUrl}
                        src={imageUrl}
                        alt={nameCard.name}
                        className={`h-full w-full object-contain transition-opacity duration-200 ${
                            imageLoading ? 'opacity-0' : 'opacity-100'
                        }`}
                        onError={handleImageError}
                        onLoad={handleImageLoad}
                        loading="lazy"
                        decoding="async"
                    />
                </>
            ) : (
                /* Fallback for no image or error */
                <div className="flex h-full w-full items-center justify-center">
                    <div className="text-center">
                        <ImageIcon
                            className={`mx-auto mb-2 h-8 w-8 ${
                                imageError
                                    ? 'text-red-400'
                                    : 'text-muted-foreground'
                            }`}
                        />
                        <p
                            className={`text-xs ${
                                imageError
                                    ? 'text-red-400'
                                    : 'text-muted-foreground'
                            }`}
                        >
                            {imageError ? 'Failed to Load' : 'No Image'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
