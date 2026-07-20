import {
    ArrowPathIcon,
    CheckIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import styles from "./auth-shell.module.css";

const iconMap = {
    pending: ArrowPathIcon,
    success: CheckIcon,
    error: ExclamationTriangleIcon,
};

export default function AuthStatusContent({
    actions,
    message,
    status,
    target,
    title,
}) {
    const Icon = iconMap[status] || ExclamationTriangleIcon;
    const iconStateClass =
        status === "success"
            ? styles.statusIconSuccess
            : status === "error"
              ? styles.statusIconError
              : "";

    return (
        <>
            <div className={`${styles.statusIcon} ${iconStateClass}`}>
                <Icon className="h-7 w-7" aria-hidden="true" />
            </div>
            <h1 className={styles.statusTitle}>{title}</h1>
            <p
                className={`${styles.statusCopy} ${status === "error" ? "text-red-600" : ""}`}
                role="status"
            >
                {message}
            </p>
            {target && <div className={styles.target}>{target}</div>}
            {status === "pending" && (
                <div className={styles.progressTrack} aria-label="Đang xử lý">
                    <div className={styles.progressBar} />
                </div>
            )}
            {actions && <div className={styles.actions}>{actions}</div>}
        </>
    );
}

export { styles as authShellStyles };
