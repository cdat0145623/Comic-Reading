"use client";

import {
    useEffect,
    useMemo,
    useReducer,
    useTransition,
} from "react";
import Link from "next/link";
import { ArrowLeft, Import } from "lucide-react";

import {
    configureImportDiscoveryAction,
    discoverStorySourceAction,
    getLatestImportDiscoveryAction,
    startChapterImportBatchAction,
} from "@/app/actions/import-source";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { DraftStep } from "./draft-step";
import { ConfigurationStep } from "./configuration-step";
import {
    getEstimatedTotal,
    getProgressCounts,
    getRangeError,
    SOURCE_URL,
    validateSourceUrl,
} from "../_lib/import-calculations";
import { ProgressStep } from "./progress-step";
import { SetupStep } from "./setup-step";
import { StepNavigation } from "./step-navigation";

const INITIAL_STATE = {
    activeStep: "setup",
    sourceUrl: SOURCE_URL,
    analysisStatus: "idle",
    analysisError: null,
    discovery: null,
    selectedEditionExternalId: "",
    targetStoryId: "",
    configurationStatus: "idle",
    configurationError: null,
    sampleChapter: null,
    mode: "missing",
    range: { from: "", to: "" },
    concurrency: 1,
    jobStatus: "DRAFT",
    progress: 0,
    progressData: null,
    activeJobId: null,
    jobError: null,
    cancelConfirmationOpen: false,
    selectedChapter: 1,
};

function createValidationError(message) {
    return {
        code: "INVALID_SOURCE_URL",
        category: "VALIDATION",
        message,
        retryable: false,
        supportId: null,
    };
}

function resetConfiguration(state, changes) {
    return {
        ...state,
        ...changes,
        configurationStatus: "idle",
        configurationError: null,
    };
}

function reducer(state, action) {
    switch (action.type) {
        case "SET_SOURCE_URL":
            return resetConfiguration(state, {
                sourceUrl: action.value,
                analysisStatus: "idle",
                analysisError: null,
                discovery: null,
                selectedEditionExternalId: "",
                targetStoryId: "",
                range: { from: "", to: "" },
                sampleChapter: null,
                selectedChapter: 1,
                activeJobId: null,
                jobStatus: "DRAFT",
                progressData: null,
            });
        case "START_ANALYSIS":
            return {
                ...state,
                analysisStatus: "analyzing",
                analysisError: null,
                discovery: null,
                selectedEditionExternalId: "",
                targetStoryId: "",
                range: { from: "", to: "" },
                sampleChapter: null,
                selectedChapter: 1,
                activeJobId: null,
                jobStatus: "QUEUED",
                progressData: null,
            };
        case "ANALYSIS_SUCCEEDED": {
            const configuration = action.data.configuration;
            const restoredProgressStatus = [
                "QUEUED",
                "RUNNING",
                "PARTIAL_FAILED",
                "REVIEW_REQUIRED",
            ].includes(action.data.status);
            return {
                ...state,
                activeStep: restoredProgressStatus
                    ? "progress"
                    : state.activeStep,
                sourceUrl: action.data.sourceUrl,
                analysisStatus: "ready",
                analysisError: null,
                discovery: action.data,
                selectedEditionExternalId:
                    configuration.selectedEditionExternalId || "",
                targetStoryId:
                    configuration.targetStoryId?.toString() || "",
                mode:
                    configuration.mode?.toLowerCase() ||
                    state.mode,
                range: {
                    from:
                        configuration.rangeStart?.toString() ||
                        action.data.catalog.first?.number?.toString() ||
                        "1",
                    to:
                        configuration.rangeEnd?.toString() ||
                        action.data.story.totalChapters.toString(),
                },
                concurrency:
                    configuration.requestedConcurrency ||
                    state.concurrency,
                configurationStatus:
                    action.data.status === "DRAFT" ? "idle" : "saved",
                configurationError: null,
                sampleChapter: action.data.sampleChapter || null,
                selectedChapter:
                    action.data.sampleChapter?.number ||
                    action.data.catalog.first?.number ||
                    1,
                jobStatus: action.data.status,
                activeJobId: restoredProgressStatus
                    ? action.data.jobId
                    : null,
            };
        }
        case "DISCOVERY_QUEUED":
            return {
                ...state,
                activeJobId: action.data.jobId,
                jobStatus: action.data.status,
                progressData: {
                    status: action.data.status,
                    stage: "DISCOVERY",
                },
            };
        case "REFRESH_DISCOVERY":
            return {
                ...state,
                discovery: action.data,
                sampleChapter: action.data.sampleChapter || null,
                selectedChapter:
                    action.data.sampleChapter?.number ||
                    state.selectedChapter,
            };
        case "ANALYSIS_FAILED":
            return {
                ...state,
                analysisStatus: "invalid",
                analysisError: action.error,
                discovery: null,
                selectedEditionExternalId: "",
                targetStoryId: "",
                range: { from: "", to: "" },
                sampleChapter: null,
                selectedChapter: 1,
                configurationStatus: "idle",
                configurationError: null,
                activeJobId: null,
            };
        case "SET_EDITION":
            return resetConfiguration(state, {
                selectedEditionExternalId: action.value,
            });
        case "SET_TARGET_STORY":
            return resetConfiguration(state, {
                targetStoryId: action.value,
            });
        case "SET_MODE":
            return resetConfiguration(state, { mode: action.value });
        case "SET_RANGE":
            return resetConfiguration(state, {
                range: {
                    ...state.range,
                    [action.field]: action.value,
                },
            });
        case "SET_CONCURRENCY":
            return resetConfiguration(state, {
                concurrency: action.value,
            });
        case "START_CONFIGURATION":
            return {
                ...state,
                configurationStatus: "saving",
                configurationError: null,
            };
        case "CONFIGURATION_SUCCEEDED":
            return {
                ...state,
                discovery: action.data,
                configurationStatus: "saved",
                configurationError: null,
            };
        case "CONFIGURATION_FAILED":
            return {
                ...state,
                configurationStatus: "error",
                configurationError: action.error,
            };
        case "START_JOB":
            return {
                ...state,
                activeStep: "progress",
                jobStatus: "QUEUED",
                progress: 0,
                progressData: null,
                jobError: null,
                cancelConfirmationOpen: false,
            };
        case "JOB_QUEUED":
            return {
                ...state,
                activeStep: "progress",
                activeJobId: action.data.jobId,
                jobStatus: "QUEUED",
                progress: 0,
                progressData: {
                    catalogPageCount:
                        state.discovery?.catalog.pageCount || 0,
                    completedCatalogPageCount: 0,
                    queuedChapterCount: action.data.queuedChapterCount,
                    completedChapterCount: 0,
                    failedChapterCount: 0,
                    recentChapters: [],
                },
                jobError: null,
            };
        case "JOB_PROGRESS": {
            const data = action.data;
            const total = data.queuedChapterCount || 0;
            const processed =
                data.completedChapterCount + data.failedChapterCount;
            return {
                ...state,
                jobStatus: data.status,
                progressData: data,
                progress: total
                    ? Math.min(100, Math.round((processed / total) * 100))
                    : 0,
            };
        }
        case "JOB_FAILED":
            return {
                ...state,
                jobStatus: "FAILED",
                jobError: action.error,
                analysisStatus:
                    state.analysisStatus === "analyzing"
                        ? "invalid"
                        : state.analysisStatus,
                analysisError:
                    state.analysisStatus === "analyzing"
                        ? action.error
                        : state.analysisError,
            };
        case "PAUSE_JOB":
            return state.jobStatus === "RUNNING"
                ? { ...state, jobStatus: "PAUSED" }
                : state;
        case "RESUME_JOB":
            return state.jobStatus === "PAUSED"
                ? { ...state, jobStatus: "RUNNING" }
                : state;
        case "REQUEST_CANCEL":
            return ["RUNNING", "PAUSED"].includes(state.jobStatus)
                ? { ...state, cancelConfirmationOpen: true }
                : state;
        case "DISMISS_CANCEL":
            return { ...state, cancelConfirmationOpen: false };
        case "CONFIRM_CANCEL":
            return {
                ...state,
                jobStatus: "CANCELLED",
                cancelConfirmationOpen: false,
            };
        case "ADVANCE_PROGRESS": {
            if (state.jobStatus !== "RUNNING") return state;
            const progress = Math.min(100, state.progress + 4);
            return {
                ...state,
                progress,
                jobStatus:
                    progress === 100
                        ? "REVIEW_REQUIRED"
                        : state.jobStatus,
            };
        }
        case "OPEN_DRAFT":
            return ["REVIEW_REQUIRED", "PARTIAL_FAILED"].includes(
                state.jobStatus,
            )
                ? { ...state, activeStep: "draft" }
                : state;
        case "SET_STEP":
            return { ...state, activeStep: action.value };
        case "SELECT_CHAPTER":
            return { ...state, selectedChapter: action.value };
        case "RESET_JOB":
            return {
                ...state,
                activeStep: "setup",
                jobStatus: "DRAFT",
                progress: 0,
                cancelConfirmationOpen: false,
            };
        default:
            return state;
    }
}

const JOB_LABELS = {
    DRAFT: { label: "Đã phân tích", variant: "neutral" },
    QUEUED: { label: "Đang chờ worker", variant: "warning" },
    DISCOVERING: { label: "Đang phân tích", variant: "info" },
    RUNNING: { label: "Đang import", variant: "info" },
    PAUSED: { label: "Đã tạm dừng", variant: "warning" },
    REVIEW_REQUIRED: { label: "Chờ kiểm tra", variant: "success" },
    CANCELLED: { label: "Đã hủy", variant: "danger" },
    PARTIAL_FAILED: { label: "Hoàn tất một phần", variant: "warning" },
    FAILED: { label: "Thất bại", variant: "danger" },
};

export function ImportWorkflow() {
    const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
    const [isPending, startTransition] = useTransition();
    const totalChapters =
        state.discovery?.story.totalChapters ?? null;

    const rangeError = useMemo(
        () =>
            state.mode === "range"
                ? getRangeError(state.range, totalChapters)
                : null,
        [state.mode, state.range, totalChapters],
    );
    const estimatedTotal = useMemo(
        () =>
            getEstimatedTotal(
                state.mode,
                state.range,
                totalChapters,
            ),
        [state.mode, state.range, totalChapters],
    );
    const counts = useMemo(
        () =>
            getProgressCounts({
                mode: state.mode,
                progress: state.progress,
                range: state.range,
                totalChapters,
            }),
        [state.mode, state.progress, state.range, totalChapters],
    );
    const canSaveConfiguration =
        state.analysisStatus === "ready" &&
        Boolean(state.selectedEditionExternalId) &&
        !rangeError &&
        estimatedTotal > 0 &&
        state.configurationStatus !== "saving";

    useEffect(() => {
        let active = true;
        getLatestImportDiscoveryAction().then((result) => {
            if (!active || !result.ok || !result.data) return;
            dispatch({
                type: "ANALYSIS_SUCCEEDED",
                data: result.data,
            });
        });
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!state.activeJobId) return undefined;
        let cancelled = false;
        let timeoutId;
        const startedAt = Date.now();

        function pollingDelay() {
            if (document.hidden) return 15_000;
            const elapsed = Date.now() - startedAt;
            if (elapsed < 10_000) return 1_500;
            if (elapsed < 30_000) return 3_000;
            return 5_000;
        }

        function schedulePoll() {
            window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(poll, pollingDelay());
        }

        async function poll() {
            try {
                const response = await fetch(
                    `/api/import-jobs/${state.activeJobId}`,
                    { cache: "no-store" },
                );
                const result = await response.json();
                if (cancelled) return;
                if (!result.ok) {
                    dispatch({
                        type: "JOB_FAILED",
                        error: result.error,
                    });
                    return;
                }
                dispatch({ type: "JOB_PROGRESS", data: result.data });

                if (
                    result.data.status === "FAILED"
                ) {
                    dispatch({
                        type: "JOB_FAILED",
                        error: {
                            code:
                                result.data.errorCode ||
                                "DISCOVERY_FAILED",
                            category: "SOURCE",
                            message:
                                result.data.errorMessage ||
                                "Không thể phân tích nguồn truyện.",
                            retryable: true,
                        },
                    });
                    return;
                }
                if (
                    result.data.stage === "DISCOVERY" &&
                    result.data.status === "DRAFT" &&
                    state.analysisStatus === "analyzing"
                ) {
                    const discovery =
                        await getLatestImportDiscoveryAction();
                    if (!cancelled && discovery.ok && discovery.data) {
                        dispatch({
                            type: "ANALYSIS_SUCCEEDED",
                            data: discovery.data,
                        });
                    }
                    return;
                }
                if (
                    ["REVIEW_REQUIRED", "PARTIAL_FAILED"].includes(
                        result.data.status,
                    )
                ) {
                    const discovery =
                        await getLatestImportDiscoveryAction();
                    if (!cancelled && discovery.ok && discovery.data) {
                        dispatch({
                            type: "REFRESH_DISCOVERY",
                            data: discovery.data,
                        });
                    }
                    return;
                }
                if (
                    ![
                        "REVIEW_REQUIRED",
                        "PARTIAL_FAILED",
                        "FAILED",
                    ].includes(result.data.status)
                ) {
                    schedulePoll();
                }
            } catch {
                if (!cancelled) {
                    schedulePoll();
                }
            }
        }

        function handleVisibilityChange() {
            if (!document.hidden && !cancelled) {
                window.clearTimeout(timeoutId);
                poll();
            }
        }

        document.addEventListener(
            "visibilitychange",
            handleVisibilityChange,
        );
        poll();
        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
        };
    }, [state.activeJobId, state.analysisStatus]);

    const discoveryReady = state.analysisStatus === "ready";
    const importStarted =
        Boolean(state.activeJobId) &&
        ["QUEUED", "RUNNING", "REVIEW_REQUIRED", "PARTIAL_FAILED"].includes(
            state.jobStatus,
        );
    const importFinished = ["REVIEW_REQUIRED", "PARTIAL_FAILED"].includes(
        state.jobStatus,
    );
    const completedSteps = [
        ...(discoveryReady ? ["setup"] : []),
        ...(importStarted ? ["configuration"] : []),
        ...(importFinished ? ["progress"] : []),
    ];
    const enabledSteps = [
        "setup",
        ...(discoveryReady ? ["configuration"] : []),
        ...(importStarted ? ["progress"] : []),
        ...(importFinished && state.sampleChapter ? ["draft"] : []),
    ];
    const jobMeta = JOB_LABELS[state.jobStatus] || JOB_LABELS.DRAFT;

    function handleAnalyze() {
        const validationError = validateSourceUrl(state.sourceUrl);
        if (validationError) {
            dispatch({
                type: "ANALYSIS_FAILED",
                error: createValidationError(validationError),
            });
            return;
        }

        dispatch({ type: "START_ANALYSIS" });
        startTransition(async () => {
            const result = await discoverStorySourceAction({
                sourceUrl: state.sourceUrl,
                clientRequestId: crypto.randomUUID(),
            });
            if (!result.ok) {
                dispatch({
                    type: "ANALYSIS_FAILED",
                    error: result.error,
                });
                return;
            }
            dispatch(
                result.data.discovery
                    ? {
                          type: "ANALYSIS_SUCCEEDED",
                          data: result.data.discovery,
                      }
                    : {
                          type: "DISCOVERY_QUEUED",
                          data: result.data,
                      },
            );
        });
    }

    function handleConfirmConfiguration() {
        if (!state.discovery || !canSaveConfiguration) return;
        dispatch({ type: "START_CONFIGURATION" });
        startTransition(async () => {
            const configuration = await configureImportDiscoveryAction({
                jobId: state.discovery.jobId,
                selectedEditionExternalId:
                    state.selectedEditionExternalId,
                targetStoryId: state.targetStoryId
                    ? Number(state.targetStoryId)
                    : null,
                mode: state.mode.toUpperCase(),
                rangeStart:
                    state.mode === "range"
                        ? Number(state.range.from)
                        : null,
                rangeEnd:
                    state.mode === "range"
                        ? Number(state.range.to)
                        : null,
                requestedConcurrency: state.concurrency,
            });
            if (!configuration.ok) {
                dispatch({
                    type: "CONFIGURATION_FAILED",
                    error: configuration.error,
                });
                return;
            }
            dispatch({
                type: "CONFIGURATION_SUCCEEDED",
                data: configuration.data,
            });
            dispatch({ type: "START_JOB" });
            const started = await startChapterImportBatchAction({
                jobId: state.discovery.jobId,
            });
            dispatch(
                started.ok
                    ? { type: "JOB_QUEUED", data: started.data }
                    : { type: "JOB_FAILED", error: started.error },
            );
        });
    }

    function handleStepChange(step) {
        if (!enabledSteps.includes(step)) return;
        if (step === "draft") {
            if (state.sampleChapter) {
                dispatch({ type: "SET_STEP", value: "draft" });
            } else {
                dispatch({ type: "OPEN_DRAFT" });
            }
            return;
        }
        dispatch({ type: "SET_STEP", value: step });
    }

    return (
        <div className="animate-enter space-y-6">
            <section className="flex flex-col gap-5 border-b border-line pb-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <Button
                        asChild
                        className="-ml-3 mb-3"
                        size="sm"
                        variant="ghost"
                    >
                        <Link href="/dashboard">
                            <ArrowLeft size={15} />
                            Về tổng quan
                        </Link>
                    </Button>
                    <p className="flex items-center gap-2 text-[11px] font-bold uppercase text-accent">
                        <Import size={15} />
                        Không gian người đăng truyện
                    </p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight">
                        Nhập truyện từ nguồn
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                        Phân tích nhanh metadata, chọn phạm vi, sau đó theo dõi
                        catalog và nội dung chapter bằng hai tiến trình riêng.
                    </p>
                </div>
                <div className="flex items-center gap-3 self-start lg:self-auto">
                    <span className="text-xs font-semibold text-muted">
                        Trạng thái
                    </span>
                    <Badge variant={jobMeta.variant}>
                        {jobMeta.label}
                    </Badge>
                </div>
            </section>

            <StepNavigation
                activeStep={state.activeStep}
                completedSteps={completedSteps}
                enabledSteps={enabledSteps}
                onChange={handleStepChange}
            />

            {state.activeStep === "setup" ? (
                <SetupStep
                    state={state}
                    isPending={isPending}
                    onAnalyze={handleAnalyze}
                    onContinue={() =>
                        dispatch({
                            type: "SET_STEP",
                            value: "configuration",
                        })
                    }
                    onAction={dispatch}
                />
            ) : null}
            {state.activeStep === "configuration" ? (
                <ConfigurationStep
                    state={state}
                    estimatedTotal={estimatedTotal}
                    rangeError={rangeError}
                    canSubmit={canSaveConfiguration}
                    isPending={isPending}
                    onConfirm={handleConfirmConfiguration}
                    onAction={dispatch}
                />
            ) : null}
            {state.activeStep === "progress" ? (
                <ProgressStep
                    state={state}
                    counts={
                        state.progressData
                            ? {
                                  total:
                                      state.progressData
                                          .queuedChapterCount,
                                  processed:
                                      state.progressData
                                          .completedChapterCount +
                                      state.progressData
                                          .failedChapterCount,
                                  imported:
                                      state.progressData
                                          .completedChapterCount,
                                  skipped: 0,
                                  review: 0,
                                  failed:
                                      state.progressData
                                          .failedChapterCount,
                              }
                            : counts
                    }
                    onAction={dispatch}
                />
            ) : null}
            {state.activeStep === "draft" ? (
                <DraftStep
                    chapter={state.sampleChapter}
                    story={state.discovery?.story}
                />
            ) : null}
        </div>
    );
}
