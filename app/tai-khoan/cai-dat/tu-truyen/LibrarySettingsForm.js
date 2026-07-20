"use client";

import SpinnerMini from "@/app/_component/SpinnerMini";
import { updateUserLibrarySettingsAction } from "@/app/_lib/actions";
import { notify } from "@/lib/toaster";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

const DEFAULT_LIBRARY_SETTINGS = {
    sortReading: "RECENTLYREAD",
    sortMarked: "RECENTLYSAVED",
    notifyGeneral: true,
};

const readingOptions = [
    ["LATESTCHAPTER", "Chương mới"],
    ["RECENTLYREAD", "Mới đọc"],
    ["TITLE", "Tên truyện"],
];

const markedOptions = [
    ["LATESTCHAPTER", "Chương mới"],
    ["RECENTLYSAVED", "Mới lưu"],
    ["TITLE", "Tên truyện"],
];

function SegmentedControl({ name, options, register }) {
    return (
        <div className="grid w-full grid-cols-3 gap-1 rounded-md bg-[var(--app-surface-muted)] p-1 sm:w-[330px]">
            {options.map(([value, label]) => (
                <label key={value} className="cursor-pointer">
                    <input
                        type="radio"
                        value={value}
                        className="peer sr-only"
                        {...register(name)}
                    />
                    <span className="flex min-h-10 items-center justify-center rounded border border-transparent px-2 text-center text-xs font-semibold text-[var(--app-muted)] transition-colors peer-checked:border-[var(--app-border)] peer-checked:bg-[var(--app-panel)] peer-checked:text-primary">
                        {label}
                    </span>
                </label>
            ))}
        </div>
    );
}

function SettingToggle({ checked, label, onChange }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className="flex min-h-11 w-full items-center justify-start gap-3 sm:w-40 sm:justify-end"
        >
            <span
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    checked ? "bg-primary" : "bg-[var(--app-border)]"
                }`}
            >
                <span
                    className={`absolute top-1 left-0 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                        checked ? "translate-x-6" : "translate-x-1"
                    }`}
                />
            </span>
            <span className="min-w-16 whitespace-nowrap text-left text-sm font-semibold">
                {checked ? "Đang bật" : "Đang tắt"}
            </span>
            <span className="sr-only">{label}</span>
        </button>
    );
}

function LibrarySettingsForm({ initialSettings, userId }) {
    const queryClient = useQueryClient();
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { isDirty },
    } = useForm({ defaultValues: initialSettings });

    const notifyGeneral = watch("notifyGeneral");

    const handleRestoreDefaults = () => {
        Object.entries(DEFAULT_LIBRARY_SETTINGS).forEach(([field, value]) => {
            setValue(field, value, { shouldDirty: true });
        });
    };

    const mutation = useMutation({
        mutationFn: async (settings) => {
            const result = await updateUserLibrarySettingsAction(settings);
            if (!result?.success) {
                throw new Error(result?.error || "Không thể lưu cài đặt");
            }
            return result;
        },
        onSuccess: async (result) => {
            reset(result.settings);
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: ["readingStories", userId],
                }),
                queryClient.invalidateQueries({
                    queryKey: ["libraryStories", userId],
                }),
            ]);
            notify({ type: "success", message: result.message });
        },
        onError: (error) => {
            notify({
                type: "error",
                message: error?.message || "Không thể lưu cài đặt",
            });
        },
    });

    return (
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
            <div className="app-border border-b px-5 py-5 sm:px-7">
                <h1 className="text-xl font-semibold">Tủ truyện</h1>
                <p className="app-muted mt-1 text-sm">
                    Chọn cách sắp xếp và nhận cập nhật khi đọc truyện.
                </p>
            </div>

            <section className="px-5 py-6 sm:px-7" aria-labelledby="sortTitle">
                <h2 id="sortTitle" className="text-base font-semibold">
                    Thứ tự hiển thị
                </h2>
                <p className="app-muted mt-1 text-sm">
                    Áp dụng cho các danh sách của tài khoản này.
                </p>

                <div className="app-border mt-5 divide-y border-y [&>*]:border-[var(--app-border)]">
                    <div className="grid gap-4 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
                        <div>
                            <h3 className="font-semibold">Truyện đang đọc</h3>
                            <p className="app-muted mt-1 text-sm">
                                Danh sách vừa đọc trên trang chủ.
                            </p>
                        </div>
                        <SegmentedControl
                            name="sortReading"
                            options={readingOptions}
                            register={register}
                        />
                    </div>

                    <div className="grid gap-4 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
                        <div>
                            <h3 className="font-semibold">Truyện đánh dấu</h3>
                            <p className="app-muted mt-1 text-sm">
                                Thứ tự hiển thị trong Tủ truyện.
                            </p>
                        </div>
                        <SegmentedControl
                            name="sortMarked"
                            options={markedOptions}
                            register={register}
                        />
                    </div>
                </div>
            </section>

            <section className="app-border border-t px-5 py-6 sm:px-7" aria-labelledby="notifyTitle">
                <h2 id="notifyTitle" className="text-base font-semibold">
                    Thông báo
                </h2>
                <p className="app-muted mt-1 text-sm">
                    Kiểm soát những cập nhật được gửi tới bạn.
                </p>

                <div className="app-border mt-5 divide-y border-y [&>*]:border-[var(--app-border)]">
                    <div className="grid gap-3 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
                        <div>
                            <h3 className="font-semibold">Thông báo chung</h3>
                            <p className="app-muted mt-1 text-sm">
                                Nhận thông báo hệ thống, reply và các tương tác
                                khác. Chương mới được bật riêng theo từng truyện.
                            </p>
                        </div>
                        <SettingToggle
                            checked={notifyGeneral}
                            label="Thông báo chung"
                            onChange={(value) =>
                                setValue("notifyGeneral", value, {
                                    shouldDirty: true,
                                })
                            }
                        />
                    </div>
                </div>
            </section>

            <div className="app-surface app-border sticky bottom-0 flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <span className={`text-sm ${isDirty ? "text-primary" : "app-muted"}`}>
                    {isDirty ? "Có thay đổi chưa lưu" : "Đã đồng bộ"}
                </span>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleRestoreDefaults}
                        disabled={mutation.isPending}
                        className="min-h-10 flex-1 rounded border border-[var(--app-border)] px-4 text-sm font-semibold sm:flex-none"
                    >
                        Khôi phục mặc định
                    </button>
                    <button
                        type="submit"
                        disabled={!isDirty || mutation.isPending}
                        className="flex min-h-10 min-w-32 flex-1 items-center justify-center rounded bg-primary px-4 text-sm font-semibold text-white sm:flex-none"
                    >
                        {mutation.isPending ? <SpinnerMini /> : "Lưu thay đổi"}
                    </button>
                </div>
            </div>
        </form>
    );
}

export default LibrarySettingsForm;
