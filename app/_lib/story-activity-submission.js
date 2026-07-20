function getLatestActivitySubmissions(attempts) {
    const latestBySubmissionId = new Map();

    for (const attempt of attempts) {
        const submissionId = attempt?.variables?.clientSubmissionId;
        if (!submissionId) continue;

        const current = latestBySubmissionId.get(submissionId);
        const isNewer =
            !current ||
            attempt.submittedAt > current.submittedAt ||
            (attempt.submittedAt === current.submittedAt &&
                attempt.mutationId > current.mutationId);

        if (isNewer) latestBySubmissionId.set(submissionId, attempt);
    }

    return [...latestBySubmissionId.values()]
        .filter(({ status }) => status === "pending" || status === "error")
        .sort((a, b) => a.submittedAt - b.submittedAt);
}

export { getLatestActivitySubmissions };
