const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
let _accessToken: string | null = null;
let gsiScriptPromise: Promise<void> | null = null;

declare global {
    interface Window {
        __acadex_token?: string;
    }
}

export function getAccessToken(): string {
    if (!_accessToken) throw new Error("Not signed in");
    return _accessToken;
}

export function setAccessToken(token: string) {
    _accessToken = token;
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
                            setAccessToken(tokenResponse.access_token);
                            window.__acadex_token = tokenResponse.access_token;
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
    window.google?.accounts.id.disableAutoSelect();
}

export interface GoogleProfile {
    sub: string;      // stable Google user ID
    name: string;
    email: string;
    picture: string;
}