// service.js
import { useApiHelper } from '../utils/ApiHelper';

export const useRegisterService = () => {
    const { post} = useApiHelper();


      const RegisterAdvertiser = async (payload) => {
        try {
            return await post(`${import.meta.env.VITE_EXEC_PROC}/executeprocedure`, payload);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            throw error;
        }
    };
    
    return {
      
        RegisterAdvertiser,
    };
};
