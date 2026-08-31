"use client";

import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import InfoUser from "./InfoUser";
import { notify } from "@/lib/toaster";
import { updateImageUser } from "@/app/_lib/api";
import { toast } from "sonner";
import { useEffect } from "react";
import { updateUser } from "@/app/_lib/actions";

function FormUser() {
    const {
        register,
        handleSubmit,
        getValues,
        reset,
        setFocus,
        setValue,
        watch,
        formState: { isSubmitting, dirtyFields, isDirty },
    } = useForm({
        defaultValues: {
            imageFile: null,
        },
    });
    const { data: session, update } = useSession();
    const image = watch("image");
    // const [file, setFile] = useState();
    // console.log("FormUser session:", session);
    useEffect(() => {
        if (!session?.user) return;
        console.log("data change----");

        reset({
            nameAccount: session?.user?.name ?? "",
            image: session?.user?.image ?? "/avatar_default.jpg",
            year: session?.user?.birthYear,
            sex: session?.user?.sex,
        });
    }, [session?.user, reset]);

    // console.log("image::::", image);
    const onDataUser = async (data) => {
        // console.log("data user:", data);
        // console.log("image data:", data?.image[0]);
        let updatedData;
        try {
            // console.log("image heh e hehehheh::", data?.image[0]);
            if (dirtyFields.imageFile) {
                const result = await updateImageUser(
                    data?.imageFile,
                    session.user.image,
                    session?.user?.id,
                );

                if (result?.ok) {
                    // console.log("update image success::::");
                    updatedData = await update({
                        user: {
                            ...session.user,
                            image: result.data.image,
                            imageUpdatedAt: result.data.imageUpdatedAt,
                        },
                    });
                    // console.log("updatedData::", updatedData);
                }
            }

            if (
                dirtyFields?.nameAccount ||
                dirtyFields?.year ||
                dirtyFields?.sex
            ) {
                const result = await updateUser({
                    userId: session?.user?.id,
                    nameAccount: data?.nameAccount,
                    year: data?.year,
                    sex: data?.sex,
                });

                // console.log("client after updated::", result);

                if (result?.success) {
                    updatedData = await update({
                        user: {
                            ...(updatedData?.user ?? session?.user),
                            name: result.updated.name,
                            sex: result.updated.sex,
                            birthYear: result.updated.birthYear,
                        },
                    });
                    console.log(
                        "client after call session updated:",
                        updatedData,
                    );
                    return updatedData;
                }
            }
            return updatedData;
        } catch (error) {
            console.log("error at formUser:::", error);
            throw new Error(error?.message);
        }
    };

    const onSubmit = async (data) => {
        const result = onDataUser(data);
        toast.promise(result, {
            loading: (
                <div className="text-primary">
                    <span>Đang cập nhật dữ liệu</span>
                </div>
            ),
            success: (res) => {
                // console.log("updated info toast promise::", res);

                return "Cập nhật dữ liệu thành công";
            },
            error: (err) => {
                console.log(
                    "ERROR AT toast promise update info user:",
                    err?.message,
                );
                return err?.message || "Cập nhật dữ liệu thất bại";
            },
        });
        return await result;
    };

    const onError = async (errors) => {
        if (errors?.nameAccount?.message) {
            notify({
                type: "error",
                message: errors.nameAccount.message,
                duration: 5000,
            });
        } else if (errors?.year?.message) {
            console.log("error year:", errors.year.message);
            notify({
                type: "error",
                message: errors.year.message,
                duration: 5000,
            });
        }
    };

    return (
        <div className="max-w-2xl px-5 py-6 sm:px-7">
            <InfoUser
                isDirty={isDirty}
                setValue={setValue}
                image={image}
                imageUpdatedAt={session?.user?.imageUpdatedAt}
                oldImage={session?.user?.image}
                handleSubmit={handleSubmit}
                onDataUser={onSubmit}
                onError={onError}
                register={register}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}

export default FormUser;
