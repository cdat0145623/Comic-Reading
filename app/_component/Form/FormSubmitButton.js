import SpinnerMini from "@/app/_component/SpinnerMini";

export default function FormSubmitButton({
    children,
    isPending,
    pendingLabel = "Đang xử lý",
    className = "",
    disabled,
    ...buttonProps
}) {
    return (
        <button
            type="submit"
            disabled={isPending || disabled}
            className={`flex min-h-11 min-w-32 items-center justify-center bg-primary px-5 font-semibold text-white transition-opacity disabled:cursor-wait disabled:opacity-50 ${className}`}
            {...buttonProps}
        >
            {isPending ? (
                <>
                    <SpinnerMini />
                    <span className="sr-only">{pendingLabel}</span>
                </>
            ) : (
                children
            )}
        </button>
    );
}
