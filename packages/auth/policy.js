export const ADMIN_ROLES = Object.freeze(["ADMIN", "UPLOADER"]);
export const ADMIN_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export function getAdminCookieNames() {
    const secure = process.env.NODE_ENV === "production";
    const prefix = secure ? "__Secure-" : "";
    const hostPrefix = secure ? "__Host-" : "";

    return {
        sessionToken: `${prefix}mtc-admin.session-token`,
        callbackUrl: `${prefix}mtc-admin.callback-url`,
        csrfToken: `${hostPrefix}mtc-admin.csrf-token`,
    };
}

export function isAdminRole(role) {
    return ADMIN_ROLES.includes(role);
}

export function hasAdminAccess(session) {
    return Boolean(
        session?.user?.id && isAdminRole(session.user.role),
    );
}

export function isAdminSessionToken(token) {
    const startedAt = Number(token?.adminSessionStartedAt);
    return Boolean(
        token?.user?.id &&
            isAdminRole(token.user.role) &&
            Number.isFinite(startedAt) &&
            Date.now() <
                startedAt + ADMIN_SESSION_MAX_AGE_SECONDS * 1000,
    );
}

export function hasSystemAdminAccess(session) {
    return session?.user?.role === "ADMIN";
}
