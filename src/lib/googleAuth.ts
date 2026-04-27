const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const TOKEN_KEY = "__acadex_token";
const EXPIRY_KEY = "__acadex_token_expiry";

let _accessToken: string | null = null;
let gsiScriptPromise: Promise<void> | null = null;

declare global {
    interface Window {
        __acadex_token?: string;
    }
}

export function getAccessToken(): string {
    if (_accessToken) return _accessToken;

    try {
        const stored = localStorage.getItem(TOKEN_KEY);
        const expiry = Number(localStorage.getItem(EXPIRY_KEY));

        if (stored && expiry && Date.now() < expiry) {
            _accessToken = stored;
            window.__acadex_token = stored;
            return _accessToken;
        }
    } catch {
        // Ignore localStorage problems and fall through to sign-out behavior.
    }

    signOutFromGoogle();
    throw new Error("Not signed in");
}

export function setAccessToken(token: string, expiresIn: number) {
    _accessToken = token;
    window.__acadex_token = token;

    try {
        localStorage.setItem(TOKEN_KEY, token);
        const expiry = Date.now() + expiresIn * 1000;
        localStorage.setItem(EXPIRY_KEY, String(expiry));
    } catch {
        // Ignore storage failures; token will remain in-memory for the session.
    }
}

function ensureGoogleSdkLoaded(): Promise<void> {
    if (window.google?.accounts?.oauth2) {
        return Promise.resolve();
    }

    if (gsiScriptPromise) {
        return gsiScriptPromise;
    }

    gsiScriptPromise = new Promise((resolve, reject) => {
        const existingScript = document.querySelector(
            "script[data-acadex-gsi='1']"
        ) as HTMLScriptElement | null;

        if (existingScript) {
            existingScript.addEventListener("load", () => resolve(), { once: true });
            existingScript.addEventListener(
                "error",
                () => reject(new Error("Google SDK failed to load")),
                { once: true }
            );
            return;
        }

        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.dataset.acadexGsi = "1";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Google SDK failed to load"));
        document.head.appendChild(script);
    });

    return gsiScriptPromise;
}

export function signInWithGoogle(): Promise<GoogleProfile> {
    return new Promise((resolve, reject) => {
        void (async () => {
            try {
                if (!CLIENT_ID) {
                    throw new Error("Missing VITE_GOOGLE_CLIENT_ID");
                }

                await ensureGoogleSdkLoaded();

                if (!window.google?.accounts?.oauth2) {
                    throw new Error("Google SDK not available");
                }

                const client = window.google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: [
                        "https://www.googleapis.com/auth/drive.file",
                        "openid",
                        "email",
                        "profile",
                    ].join(" "),
                    callback: async (tokenResponse) => {
                        if (tokenResponse.error) {
                            reject(new Error(tokenResponse.error));
                            return;
                        }
                        try {
                            // Persist token with expiry when provided by Google
                            const expiresIn = (tokenResponse as any).expires_in ?? 3600;
                            setAccessToken(tokenResponse.access_token, Number(expiresIn));
                            const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                            });

                            if (!res.ok) {
                                throw new Error("Failed to fetch Google profile");
                            }

                            const profile = (await res.json()) as GoogleProfile;
                            resolve(profile);
                        } catch (error) {
                            reject(error instanceof Error ? error : new Error("Failed to fetch user profile"));
                        }
                    },
                    error_callback: (error) => {
                        reject(new Error(error.type));
                    },
                });

                client.requestAccessToken({ prompt: "select_account" });
            } catch (error) {
                reject(error instanceof Error ? error : new Error("Sign-in setup failed"));
            }
        })();
    });
}

export function signOutFromGoogle(): void {
    _accessToken = null;
    try {
        delete window.__acadex_token;
    } catch {
        // ignore
    }

    // Clear persisted token
    try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(EXPIRY_KEY);
    } catch {
        // ignore
    }

    window.google?.accounts.id.disableAutoSelect();
}

export interface GoogleProfile {
    sub: string;      // stable Google user ID
    name: string;
    email: string;
    picture: string;
}