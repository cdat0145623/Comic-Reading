import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function MetricStrip({ items }) {
    return (
        <section className="grid border-y border-line bg-surface sm:grid-cols-2 xl:grid-cols-4" aria-label="Chỉ số tổng quan">
            {items.map((item, index) => (
                <div
                    className="min-h-32 border-b border-line p-5 last:border-b-0 sm:[&:nth-child(odd)]:border-r sm:[&:nth-child(n+3)]:border-b-0 xl:border-b-0 xl:border-r xl:last:border-r-0"
                    key={item.label}
                >
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-muted">
                            {item.label}
                        </span>
                        {item.status ? (
                            <span className={`size-2 rounded-full ${item.status}`} />
                        ) : null}
                    </div>
                    <div className="mt-3 flex items-end gap-3">
                        <strong className="text-3xl font-bold leading-none">
                            {item.value}
                        </strong>
                        {item.change ? (
                            <span
                                className={`flex items-center gap-1 text-xs font-semibold ${item.positive ? "text-success" : "text-danger"}`}
                            >
                                {item.positive ? (
                                    <ArrowUpRight size={14} />
                                ) : (
                                    <ArrowDownRight size={14} />
                                )}
                                {item.change}
                            </span>
                        ) : null}
                    </div>
                    <p className="mt-3 text-xs text-muted">
                        {item.note}
                    </p>
                </div>
            ))}
        </section>
    );
}
