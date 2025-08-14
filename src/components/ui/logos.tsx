import Image from "next/image";
import Link from "next/link";

export default function Logo() {
    return (
        <Link href="/" className="flex gap-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
                <Image src="/logos/DailyCekItLogo.png" height="50" width="50" alt="DailyCekItLogo" />
            </div>
            <div className="flex flex-col gap-0.5 leading-none">
                <Image src="/logos/DailyCekItWhiteNameLogo.png" className="hidden dark:block w-36" height="100" width="100" alt="DailyCekItLogo" />
                <Image src="/logos/DailyCekItBlackNameLogo.png" className="block dark:hidden w-36" height="100" width="100" alt="DailyCekItLogo" />
            </div>
        </Link>
    )
}
