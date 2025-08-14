import { createUser, getUser } from "@/app/_lib/data-service";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { SignUpSchema } from "@/app/_lib/validate";

export async function POST(req) {
    const body = await req.json();
    const { email, password } = body;

    const validatedFields = SignUpSchema.safeParse(body);

    if (!validatedFields.success) {
        const errorField = validatedFields.error.flatten().fieldErrors;
        return NextResponse.json(
            {
                error: errorField,
            },
            { status: 400 }
        );
    }

    try {
        const existingUser = await getUser(email);

        if (existingUser) {
            return NextResponse.json(
                {
                    message:
                        "User have exited! Please chose another different email",
                },
                { status: 409 }
            );
        }

        const passwordHashed = await bcrypt.hash(password, 10);

        const randomName = nanoid(10);

        const newUser = await createUser(randomName, email, passwordHashed);

        return NextResponse.json(newUser);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            {
                error: "International Server Error!!!",
            },
            {
                status: 500,
            }
        );
    }
}
