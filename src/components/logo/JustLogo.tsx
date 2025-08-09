// components/logo/JustLogo.tsx
import { cn } from '@/lib/utils';
import React from 'react';

interface JustLogoProps {
    className?: string;
}

const JustLogo: React.FC<JustLogoProps> = ({ className }) => (
    <svg className={cn("w-full h-auto", className)} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048"><g id="Layer_1" data-name="Layer 1"><rect x="261.96" y="261.96" width="1524.09" height="1524.09" rx="207.64" transform="translate(-424.15 1024) rotate(-45)" /></g><g id="Layer_2" data-name="Layer 2"><path d="M1202.29,947.43l-360-360a108.29,108.29,0,0,0-153.14,0l-360,360a108.29,108.29,0,0,0,0,153.14l360,360a108.29,108.29,0,0,0,153.14,0l360-360A108.27,108.27,0,0,0,1202.29,947.43ZM765.74,1320.34,469.41,1024,765.75,727.66,1062.08,1024Z" style={{ fill: "#fff" }} /><path d="M1723.37,947.68l-360-358.83a108.56,108.56,0,0,0-153.16,0L1077.08,721.59l108.41,108,101.34-101L1583.17,1024l-296.34,295.4-101.36-101-108.39,108,133.17,132.74a108.56,108.56,0,0,0,153.16,0l360-358.84A107.71,107.71,0,0,0,1723.37,947.68Z" style={{ fill: "#818386" }} /></g></svg>
);

export default JustLogo;
