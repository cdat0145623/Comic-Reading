export function canUseGoogleAccount({ user, profile }) {
    return Boolean(user && profile?.email_verified === true);
}

export function googleVerifiesCurrentEmail({ userEmail, profile }) {
    return Boolean(
        profile?.email_verified === true &&
            userEmail &&
            profile.email &&
            userEmail.toLowerCase() === profile.email.toLowerCase(),
    );
}
