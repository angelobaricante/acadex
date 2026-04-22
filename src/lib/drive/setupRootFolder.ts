export async function createRootFolder(accessToken: string): Promise<string> {
    const res = await fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: "AcaDex",
            mimeType: "application/vnd.google-apps.folder",
            appProperties: {
                acadex_uploaded: "true",
                acadex_type: "root",
            },
        }),
    });

    if (!res.ok) {
        throw new Error(`Failed to create root folder: ${res.statusText}`);
    }

    const folder = (await res.json()) as { id: string; name: string };
    console.log("Root folder ID:", folder.id);
    return folder.id;
}
