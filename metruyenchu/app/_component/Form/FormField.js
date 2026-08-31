const inputClass =
    "app-panel app-border min-h-11 w-full border px-3 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary";

export default function FormField({
    id,
    label,
    type = "text",
    registration,
    error,
    className = "",
    ...inputProps
}) {
    const errorId = error ? `${id}-error` : undefined;

    return (
        <div className={className}>
            <label htmlFor={id} className="text-sm font-semibold">
                {label}
            </label>
            <input
                id={id}
                type={type}
                aria-invalid={Boolean(error)}
                aria-describedby={errorId}
                className={`${inputClass} mt-2 ${
                    error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                }`}
                {...registration}
                {...inputProps}
            />
            {error && (
                <p id={errorId} className="mt-2 text-sm text-red-600" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}
