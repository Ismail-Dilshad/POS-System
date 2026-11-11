import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <g fill="none">
                <rect x="16" y="12" width="32" height="22" rx="2" />
                <path d="M24 34v8h16v-8M12 42h40v12H12zM27 20h10M27 26h10M28 48h8" />
            </g>
        </svg>
    );
}
