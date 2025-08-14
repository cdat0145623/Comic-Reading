import { getFrameSrc } from "@/app/_lib/helper";
import Image from "next/image";

function FanCard({ item }) {
    const frameSrc = getFrameSrc(item.points);
    return (
        <div className="flex space-x-2 border-b border-slate-200 pb-4">
            <div className="w-11 h-11 relative">
                <Image
                    src="/avatar_default.jpg"
                    width={36}
                    height={36}
                    alt=""
                    className="absolute top-1 right-1 rounded-full"
                />
                <Image
                    src={frameSrc}
                    alt=""
                    fill
                    className="absolute object-contain"
                />
            </div>
            <div className="flex flex-col space-y-1 text-xs">
                <span className="text-sm">{item.user.name}</span>
                <span>{item.points}</span>
            </div>
        </div>
    );
}

export default FanCard;
