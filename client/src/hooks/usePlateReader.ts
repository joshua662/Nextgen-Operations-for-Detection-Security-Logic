import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import GateAccessService from "../services/GateAccessService";
import type { CheckPlateResponse, VerifyPlateResponse } from "../interfaces/GateInterface";
import {
    captureFrameBlob,
    formatPlateDisplay,
    normalizePlate,
    recognizePlateCandidatesFromImage,
    recognizePlateCandidatesFromSnapshot,
    snapshotToBlob,
} from "../utils/plateOcr";

const SCAN_INTERVAL_MS = 3000;
const PLATE_COOLDOWN_MS = 12000;

export type PlateReaderStatus = "idle" | "scanning" | "detected" | "verifying" | "verified" | "error";

type UsePlateReaderOptions = {
    direction: "IN" | "OUT";
    cameraLocation: "entrance" | "exit";
    streamUrl: string;
    streamOnline: boolean;
    imageRef: RefObject<HTMLImageElement | null>;
    onVerified?: (result: VerifyPlateResponse) => void;
};

export function usePlateReader({
    direction,
    cameraLocation,
    streamUrl,
    streamOnline,
    imageRef,
    onVerified,
}: UsePlateReaderOptions) {
    const [status, setStatus] = useState<PlateReaderStatus>("idle");
    const [detectedPlate, setDetectedPlate] = useState("");
    const [lastResult, setLastResult] = useState<VerifyPlateResponse | null>(null);
    const [checkResult, setCheckResult] = useState<CheckPlateResponse | null>(null);

    const scanningRef = useRef(false);
    const lastVerifiedPlates = useRef<Map<string, number>>(new Map());

    const checkRegistration = useCallback(async (plate: string) => {
        const normalized = normalizePlate(plate);
        if (!normalized) return null;

        try {
            const res = await GateAccessService.checkPlate(normalized);
            return res.data as CheckPlateResponse;
        } catch {
            return null;
        }
    }, []);

    const readPlateCandidates = useCallback(async (): Promise<string[]> => {
        const img = imageRef.current;
        if (img?.complete && img.naturalWidth > 0) {
            const fromStream = await recognizePlateCandidatesFromImage(img);
            if (fromStream.length > 0) return fromStream;
        }

        return recognizePlateCandidatesFromSnapshot(cameraLocation);
    }, [cameraLocation, imageRef]);

    const verifyPlate = useCallback(
        async (plate: string) => {
            const normalized = normalizePlate(plate);
            if (!normalized) return;

            const now = Date.now();
            const lastSeen = lastVerifiedPlates.current.get(normalized);
            if (lastSeen && now - lastSeen < PLATE_COOLDOWN_MS) {
                setStatus("verified");
                return;
            }

            setStatus("verifying");

            try {
                const formData = new FormData();
                formData.append("plate_number", normalized);
                formData.append("direction", direction);

                const img = imageRef.current;
                let captureBlob = img ? await captureFrameBlob(img) : null;
                if (!captureBlob) {
                    captureBlob = await snapshotToBlob(cameraLocation);
                }
                if (captureBlob) {
                    formData.append("capture_image", captureBlob, "capture.jpg");
                }

                const res = await GateAccessService.verifyPlate(formData);
                const result = res.data as VerifyPlateResponse;

                lastVerifiedPlates.current.set(normalized, now);
                setLastResult(result);
                setCheckResult({
                    registered: result.authorized,
                    plate_number: normalized,
                    resident_name: result.resident_name ?? result.log.owner_name,
                    car_model: result.log.car_model,
                    car_color: result.log.car_color,
                });
                setStatus("verified");
                onVerified?.(result);
            } catch {
                setStatus("error");
            }
        },
        [cameraLocation, direction, imageRef, onVerified]
    );

    const scanFrame = useCallback(async () => {
        if (scanningRef.current) return;

        scanningRef.current = true;
        setStatus("scanning");

        try {
            const candidates = await readPlateCandidates();

            if (candidates.length === 0) {
                setDetectedPlate("");
                setCheckResult(null);
                setLastResult(null);
                setStatus("idle");
                return;
            }

            let matchedPlate = candidates[0];
            let matchedCheck: CheckPlateResponse | null = null;

            for (const candidate of candidates.slice(0, 5)) {
                const check = await checkRegistration(candidate);
                if (check?.registered) {
                    matchedPlate = check.plate_number;
                    matchedCheck = check;
                    break;
                }
                if (!matchedCheck && check) {
                    matchedCheck = check;
                }
            }

            if (!matchedCheck) {
                matchedCheck = await checkRegistration(matchedPlate);
            }

            const normalized = normalizePlate(matchedPlate);
            setDetectedPlate(formatPlateDisplay(normalized));
            setCheckResult(
                matchedCheck ?? {
                    registered: false,
                    plate_number: normalized,
                    resident_name: null,
                    car_model: null,
                    car_color: null,
                }
            );
            setStatus("detected");

            await verifyPlate(normalized);
        } catch {
            setStatus("error");
        } finally {
            scanningRef.current = false;
        }
    }, [checkRegistration, readPlateCandidates, verifyPlate]);

    useEffect(() => {
        if (!streamOnline || !streamUrl) {
            setStatus("idle");
            setDetectedPlate("");
            setCheckResult(null);
            return;
        }

        void scanFrame();

        const intervalId = window.setInterval(() => {
            void scanFrame();
        }, SCAN_INTERVAL_MS);

        return () => window.clearInterval(intervalId);
    }, [scanFrame, streamOnline, streamUrl]);

    return {
        status,
        detectedPlate,
        lastResult,
        checkResult,
    };
}
