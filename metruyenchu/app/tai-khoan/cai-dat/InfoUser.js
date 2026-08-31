"use client";
import Image from "next/image";
import { CameraIcon } from "@heroicons/react/24/solid";
import { CldUploadButton } from "next-cloudinary";
import { generateImageUrl } from "@/app/_lib/helper";
import SpinnerMini from "@/app/_component/SpinnerMini";

function InfoUser({
    isDirty,
    setValue,
    oldImage,
    imageUpdatedAt,
    handleSubmit,
    onDataUser,
    onError,
    register,
    image,
    isSubmitting,
    // setFile,
    // file,
}) {
    return (
        <div className="col-span-1 flex flex-col">
            <form
                onSubmit={handleSubmit(onDataUser, onError)}
                className="col-span-1 flex flex-col space-y-5"
            >
                <div className="space-y-2">
                    <div className="flex items-center">
                        <span className="text-sm font-semibold">
                            Ảnh đại diện
                        </span>
                    </div>
                    <div className="flex items-center justify-center">
                        <div className="relative">
                            <Image
                                key={imageUpdatedAt}
                                src={image || "/avatar_default.jpg"}
                                sizes="100px"
                                width={24}
                                height={24}
                                alt="anh avatar"
                                className="w-24 h-24 rounded-full object-cover"
                            />

                            <label
                                htmlFor="avatar"
                                className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer"
                            >
                                <CameraIcon className="size-6" />
                            </label>
                            <input
                                id="avatar"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                {...register("image")}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    setValue("imageFile", file, {
                                        shouldDirty: true,
                                    });
                                    setValue(
                                        "image",
                                        URL.createObjectURL(file),
                                        {
                                            shouldDirty: true,
                                        },
                                    );
                                }}
                                // onChange={(e) => {
                                //     const file = e.target.files?.[0];
                                //     console.log("file onchange::", file);
                                //     setFile(URL.createObjectURL(file));
                                // }}
                            />
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center">
                        <span className="text-sm font-semibold">
                            Tên tài khoản
                        </span>
                    </div>
                    <div>
                        <input
                            type="text"
                            className="border w-full h-10 px-4 py-2 border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            {...register("nameAccount", {
                                validate: (value) => {
                                    if (!value || value.trim().length === 0)
                                        return "Tên tài khoản không được để trống";
                                    return true;
                                },
                            })}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center">
                        <span className="text-sm font-semibold">Năm sinh</span>
                    </div>
                    <div>
                        <input
                            type="text"
                            className="border w-full h-10 px-4 py-2 border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            {...register("year", {
                                required: "Năm sinh không được để trống",
                                validate: {
                                    fourDigits: (value) =>
                                        /^\d{4}$/.test(value) ||
                                        "Năm sinh phải hợp lệ và có ít nhất 4 số",
                                    notFuture: (value) =>
                                        Number(value) <=
                                            new Date().getFullYear() ||
                                        "Năm sinh không được lớn hơn năm hiện tại",
                                },
                            })}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center">
                        <span className="text-sm font-semibold">Giới tính</span>
                    </div>
                    <div>
                        <select
                            name=""
                            id=""
                            className="border w-full h-10 px-4 py-2 border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            {...register("sex")}
                        >
                            <option value="SECRET">Bí mật</option>
                            <option value="MALE">Nam</option>
                            <option value="FEMALE">Nữ</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-center justify-center">
                    <button
                        className="py-2 rounded-2xl w-1/3 bg-primary text-white text-xl"
                        disabled={isSubmitting || !isDirty}
                    >
                        {isSubmitting ? (
                            <div className="flex py-1">
                                <span className="mx-auto">
                                    <SpinnerMini />
                                </span>
                            </div>
                        ) : (
                            "Cập nhật"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default InfoUser;
