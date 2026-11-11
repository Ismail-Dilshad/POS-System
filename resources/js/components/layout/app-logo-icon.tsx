import { type ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({ alt = 'Ali Network', className = '', ...props }: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'>) {
    return (
        <img
            {...props}
            src="/images/alinetwork.png"
            alt={alt}
            className={`shrink-0 rounded-full object-contain ${className}`}
        />
    );
}
