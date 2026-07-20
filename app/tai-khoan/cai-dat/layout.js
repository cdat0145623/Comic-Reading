export default function SettingsLayout({ children }) {
    return (
        <section className="app-surface app-border overflow-hidden border-y sm:border">
            <div className="min-w-0">{children}</div>
        </section>
    );
}
