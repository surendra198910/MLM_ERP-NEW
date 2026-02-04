// service.js
import { useApiHelper } from '../utils/ApiHelper';

export const useLoginService = () => {
    const { post, cancelRequest } = useApiHelper();
   


    const SignIn = async (payload) => {
        try {
            return await post(`${import.meta.env.VITE_EXEC_PROC}/Login`, payload);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            throw error;
        }
    };
    
    return {
        
        SignIn,
        cancelRequest,
    };
};
