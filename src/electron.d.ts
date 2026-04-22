import type { AcaDexBridge } from "../shared/ipcTypes";

declare global {
    interface Window {
        acadex?: AcaDexBridge;
    }
}

export { };
