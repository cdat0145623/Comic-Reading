import styles from "./auth-shell.module.css";

export default function AuthPageShell({
    children,
    contextTitle,
    contextCopy,
    eyebrow = "Bảo mật tài khoản",
}) {
    return (
        <section className={styles.shell}>
            <aside className={styles.context}>
                <p className={styles.eyebrow}>{eyebrow}</p>
                <h2 className={styles.contextTitle}>{contextTitle}</h2>
                <p className={styles.contextCopy}>{contextCopy}</p>
                <p className={styles.securityNote}>
                    Mê Truyện Chữ không yêu cầu cung cấp mật khẩu qua email.
                </p>
            </aside>
            <div className={styles.content}>{children}</div>
        </section>
    );
}
