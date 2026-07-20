import { createSignature } from "@/app/_lib/data-service";
import { NextResponse } from "next/server";

export async function POST(req) {
    const { existImage, userId } = await req.json();

    try {
        const {
            signature,
            timestamp,
            public_id,
            api_key: apiKey,
            cloudName,
        } = await createSignature(existImage, userId);
        console.log("signature from route:", signature);
        return NextResponse.json({
            signature,
            timestamp,
            public_id,
            apiKey,
            cloudName,
        });
    } catch (error) {
        console.log("error at Post route user:", error);
        return NextResponse.json(
            {
                error: "International Server Error!!!",
            },
            {
                status: 500,
            },
        );
    }
}
