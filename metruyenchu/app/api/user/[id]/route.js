import { updateImageUser } from "@/app/_lib/data-service";
import { NextResponse } from "next/server";

export async function PATCH(req, { params }) {
    const { id } = await params;
    const { imageUrl } = await req.json();
    console.log("formData PATCH:::", imageUrl);
    // console.log("Exist Image:::", existImage);

    if (!imageUrl)
        return NextResponse.json({
            message: "Missing public_id",
            status: 400,
        });

    try {
        const data = await updateImageUser(id, imageUrl);
        console.log("PATCH UPDATED SUCCESS:::::: HAVE DATA", data);
        return NextResponse.json(data);
    } catch (error) {
        console.log("ERROR AT PATCH OF api/user/[id]:::", error);
    }
}
