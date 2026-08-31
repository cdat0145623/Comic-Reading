import { Check, Clock3, FileCheck2, Link2, SlidersHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

const STEPS = [
    { id: "setup", label: "Phân tích nguồn", icon: Link2 },
    { id: "configuration", label: "Phạm vi import", icon: SlidersHorizontal },
    { id: "progress", label: "Tiến trình", icon: Clock3 },
    { id: "draft", label: "Kiểm tra draft", icon: FileCheck2 },
];

export function StepNavigation({
    activeStep,
    completedSteps,
    enabledSteps,
    onChange,
}) {
    return (
        <nav
            className="grid border border-line-strong bg-surface md:grid-cols-4"
            aria-label="Tiến trình nhập truyện"
        >
            {STEPS.map((step, index) => {
                const Icon = step.icon;
                const active = step.id === activeStep;
                const done = completedSteps.includes(step.id);
                const enabled = enabledSteps.includes(step.id);

                return (
                    <button
                        key={step.id}
                        type="button"
                        className={cn(
                            "relative flex min-h-16 items-center gap-3 border-line px-4 text-left transition-colors md:border-r",
                            index === STEPS.length - 1 && "md:border-r-0",
                            enabled && "hover:bg-surface-muted",
                            active && "bg-accent-soft",
                            !enabled && "cursor-not-allowed opacity-45",
                        )}
                        disabled={!enabled}
                        aria-current={active ? "step" : undefined}
                        onClick={() => onChange(step.id)}
                    >
                        <span
                            className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-full border border-line-strong text-muted",
                                active &&
                                    "border-accent bg-accent text-on-accent",
                                done &&
                                    !active &&
                                    "border-success bg-status-success text-success",
                            )}
                        >
                            {done && !active ? (
                                <Check size={15} />
                            ) : (
                                <Icon size={15} />
                            )}
                        </span>
                        <span>
                            <span className="block text-[11px] font-semibold text-muted">
                                Bước {index + 1}
                            </span>
                            <strong className="mt-0.5 block text-sm">
                                {step.label}
                            </strong>
                        </span>
                        {active ? (
                            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-accent" />
                        ) : null}
                    </button>
                );
            })}
        </nav>
    );
}
