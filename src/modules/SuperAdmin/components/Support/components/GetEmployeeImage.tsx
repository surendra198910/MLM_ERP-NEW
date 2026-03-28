export const getEmployeeImage = (
    url?: string,
    baseUrl?: string,
    fallback: string = `${import.meta.env.VITE_IMAGE_PREVIEW_URL}228eae06-dfe9-4235-8859-2ae38c35d99f.png`,
): string => {
    if (!url || url === "default-user.png") {
        return fallback;
    }
    const cleanUrl = url.split("|")[0];
    if (cleanUrl.startsWith("http")) return cleanUrl;

    return `${baseUrl}${cleanUrl}`;
};