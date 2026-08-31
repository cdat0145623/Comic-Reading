export default function NewStoryImportLoading() {
    return (
        <div className="space-y-6" aria-label="Đang tải trình nhập truyện">
            <div className="h-24 animate-pulse rounded-md bg-surface-muted" />
            <div className="h-20 animate-pulse rounded-md bg-surface-muted" />
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
                <div className="h-[420px] animate-pulse rounded-md bg-surface-muted" />
                <div className="h-[420px] animate-pulse rounded-md bg-surface-muted" />
            </div>
        </div>
    );
}
