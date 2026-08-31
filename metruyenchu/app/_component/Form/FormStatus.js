export default function FormStatus({ state }) {
    if (!state?.message) return null;

    const isError = state.type === "error";

    return (
        <p
            className={`mt-4 text-sm ${isError ? "text-red-600" : "text-green-700"}`}
            role={isError ? "alert" : "status"}
        >
            {state.message}
        </p>
    );
}
