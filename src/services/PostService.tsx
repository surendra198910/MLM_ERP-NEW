import type { AxiosRequestConfig } from "axios";
import { useApiHelper } from "../utils/ApiHelper";

/**
 * PostService
 * Handles multipart/form-data uploads (documents, images, etc.)
 * Frontend-only abstraction over useApiHelper
 */
export const PostService = () => {
  const { post } = useApiHelper();

  /**
   * Upload document / image with progress support
   */
  const postDocument = async (
    formData: FormData,
    onProgress?: (percent: number) => void
  ) => {
    try {
      return await post(
        `${import.meta.env.VITE_EXEC_PROC}/PostDocument`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent: any) => {
            if (!onProgress || !progressEvent?.total) return;

            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percent);
          },
        } as AxiosRequestConfig
      );
    } catch (error) {
      console.error("PostService → postDocument Error:", error);
      throw error;
    }
  };

  return {
    postDocument,
  };
};
