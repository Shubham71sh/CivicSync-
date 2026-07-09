import axios from "axios";

const API = "http://127.0.0.1:8000";

export const getProfile = () => axios.get(`${API}/profile`);

export const updateProfile = (profile) =>
  axios.put(`${API}/profile`, profile);