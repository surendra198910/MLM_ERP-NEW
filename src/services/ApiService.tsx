import { useApiHelper } from "../utils/ApiHelper";

export const ApiService = () => {
  const { post, loading } = useApiHelper();

  // ⭐ universalService now clean & auto-handled by interceptors
  const universalService = async (payload) => {
    try {
      return await post(
        `${import.meta.env.VITE_EXEC_PROC}/executeprocedure`,
        payload,
      );
    } catch (error) {
      console.error("Universal Service Error:", error);
      throw error;
    }
  };
  

  const postDocumentService = async (formData, onProgress) => {
    try {
      return await post(
        `${import.meta.env.VITE_EXEC_PROC}/PostDocument`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (!onProgress) return;

            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            onProgress(percent);
          },
        },
      );
    } catch (error) {
      console.error("Post Document Error:", error);
      throw error;
    }
  };
  const postUserImage = async (formData, onProgress) => {
    try {
      return await post(
        `${import.meta.env.VITE_EXEC_PROC}/PostUserImage`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (!onProgress) return;

            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            onProgress(percent);
          },
        },
      );
    } catch (error) {
      console.error("Post Document Error:", error);
      throw error;
    }
  };

  return {
    universalService,
    loading,
    postDocumentService,
    postUserImage,
  };
};
