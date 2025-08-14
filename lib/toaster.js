"use client";

import { toast } from "sonner";
import { XCircleIcon } from "@heroicons/react/24/outline";

// export const notify = {
//     success: (message) => toast.success(message),
//     error: (message) => toast.error(message),
//     warning: (message) => toast.warning(message),
// };
export function notify({ type, message, duration = 3000 }) {
    const iconColorMap = {
        success: "text-success",
        error: "text-error",
        warning: "text-orange-300",
    };

    const iconClass = `w-6 h-6 ${iconColorMap[type]}`;

    const action = {
        label: <XCircleIcon className={iconClass} />,
        onClick: () => toast.dismiss(),
        className: "p-0 bg-transparent hover:bg-transparent shadow-none",
    };

    const baseOptions = {
        duration,
        action,
    };

    if (type === "success") {
        toast.success(message, baseOptions);
    } else if (type === "error") {
        toast.error(message, baseOptions);
    } else {
        toast.warning(message, baseOptions);
    }
}
