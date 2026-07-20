import { createAuthToken } from "./auth-token-service";
import {
    sendEmailChangeVerification,
    sendPasswordResetEmail,
    sendVerificationEmail,
} from "./auth-mail";

export async function issueVerificationEmail(user) {
    const { token, expiresAt } = await createAuthToken({
        userId: user.id,
        type: "EMAIL_VERIFICATION",
    });
    const delivery = await sendVerificationEmail({
        email: user.email,
        token,
    });
    return { ...delivery, expiresAt };
}

export async function issueEmailChangeVerification({ userId, email }) {
    const { token, expiresAt } = await createAuthToken({
        userId,
        type: "EMAIL_CHANGE",
        targetEmail: email,
    });
    const delivery = await sendEmailChangeVerification({ email, token });
    return { ...delivery, expiresAt };
}

export async function issuePasswordResetEmail(user) {
    const { token, expiresAt } = await createAuthToken({
        userId: user.id,
        type: "PASSWORD_RESET",
    });
    const delivery = await sendPasswordResetEmail({
        email: user.email,
        token,
    });
    return { ...delivery, expiresAt };
}
