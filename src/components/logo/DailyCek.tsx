import { cn } from '@/lib/utils';
import React from 'react';

// Mendefinisikan tipe props untuk komponen ini.
// Props 'className' bersifat opsional, yang merupakan praktik yang baik.
interface DailyCekItLogoProps {
    className?: string;
}

// Perbaiki cara menerima props dengan tipe yang sudah didefinisikan.
const DailyCekItLogo: React.FC<DailyCekItLogoProps> = ({ className }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 2236.96 476.92"
            className={cn("w-full h-auto", className)}
        >
            <g id="Layer_2" data-name="Layer 2">
                <text
                    transform="translate(38.52 354.55)"
                    className="text-[384.9px] fill-neutral-800 dark:fill-neutral-50 font-poppins-bold font-bold"
                >
                    DailyCek
                </text>
                <circle
                    cx="1612"
                    cy="355.51"
                    r="27.96"
                    className="fill-white stroke-neutral-800 stroke-[20px] stroke-miterlimit-10"
                />
                <text
                    transform="translate(1703.95 353.19)"
                    className="text-[384.9px] fill-[#818386] font-poppins-bold font-bold opacity-60"
                >
                    it
                </text>
            </g>
        </svg>
    );
};

export default DailyCekItLogo;