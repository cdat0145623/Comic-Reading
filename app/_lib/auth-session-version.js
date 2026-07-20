function normalizeAuthVersion(value) {
    return Number.isInteger(value) && value >= 0 ? value : 0;
}

function hasCurrentAuthVersion(tokenVersion, currentVersion) {
    return (
        normalizeAuthVersion(tokenVersion) ===
        normalizeAuthVersion(currentVersion)
    );
}

export { hasCurrentAuthVersion, normalizeAuthVersion };
