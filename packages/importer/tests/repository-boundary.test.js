import assert from "node:assert/strict";
import test from "node:test";

import * as jobRepository from "../infrastructure/persistence/import-job-repository.js";
import * as draftRepository from "../infrastructure/persistence/import-draft-repository.js";
import * as chapterRepository from "../infrastructure/persistence/chapter-import-repository.js";
import * as progressRepository from "../infrastructure/persistence/import-progress-repository.js";

test("persistence boundaries expose responsibilities by aggregate", () => {
    assert.equal(typeof jobRepository.createQueuedDiscoveryJob, "function");
    assert.equal(typeof jobRepository.queueCatalogPreparation, "function");
    assert.equal(typeof draftRepository.saveSourceProbe, "function");
    assert.equal(typeof chapterRepository.prepareConfiguredChapterScope, "function");
    assert.equal(typeof progressRepository.reconcileImportJobProgress, "function");
});
