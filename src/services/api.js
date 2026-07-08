import axios from "axios";

const API = "http://127.0.0.1:8000";

export const sendMessage = async (message, language = "en") => {
  const response = await axios.post(`${API}/chat`, {
    message,
    language,
  });

  return response.data;
};