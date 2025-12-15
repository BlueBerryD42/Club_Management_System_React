import apiClient from './api';

export const userApi = {
    getAllUsers: () =>
        apiClient.get('/users/getallprofile'),
};

export default userApi;
