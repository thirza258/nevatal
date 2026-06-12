import axios from "axios";
import { API_URL } from "../constant";
import { cookieRequestConfig } from "./auth";

const postPrompt = async (prompt: string) => {
  const response = await axios.post(
    `${API_URL}/prompt/`,
    { prompt },
    cookieRequestConfig
  );
  if (response.status === 200) {
    return response.data;
  }
  throw new Error("Failed to post prompt");
};

const postProofreader = async (prompt: string) => {
  const response = await axios.post(
    `${API_URL}/proofreader/`,
    { prompt },
    cookieRequestConfig
  );
  if (response.status === 200) {
    return response.data;
  }
  throw new Error("Failed to post proofreader");
};

const postSummarizer = async (prompt: string) => {
  const response = await axios.post(
    `${API_URL}/summarizer/`,
    { prompt },
    cookieRequestConfig
  );
  if (response.status === 200) {
    return response.data;
  }
  throw new Error("Failed to post summarizer");
};

const postTranslator = async (
  prompt: string,
  targetLanguage: string,
  sourceLanguage: string
) => {
  const response = await axios.post(
    `${API_URL}/translator/`,
    {
      prompt,
      target_language: targetLanguage,
      source_language: sourceLanguage,
    },
    cookieRequestConfig
  );
  if (response.status === 200) {
    return response.data;
  }
  throw new Error("Failed to post translator");
};

const postWriter = async (prompt: string) => {
  const response = await axios.post(
    `${API_URL}/writer/`,
    { prompt },
    cookieRequestConfig
  );
  if (response.status === 200) {
    return response.data;
  }
  throw new Error("Failed to post writer");
};

const postRewriter = async (prompt: string) => {
  const response = await axios.post(
    `${API_URL}/rewriter/`,
    { prompt },
    cookieRequestConfig
  );
  if (response.status === 200) {
    return response.data;
  }
  throw new Error("Failed to post rewriter");
};

const postCopywriting = async (prompt: string) => {
  const response = await axios.post(
    `${API_URL}/copywriting/`,
    { prompt },
    cookieRequestConfig
  );

  if (response.status === 200) {
    return response.data;
  }
  throw new Error("Failed to post copywriting");
};

const postExplainer = async (prompt: string) => {
  const response = await axios.post(
    `${API_URL}/explainer/`,
    { prompt },
    cookieRequestConfig
  );

  if (response.status === 200) {
    return response.data;
  }
  throw new Error("Failed to post explainer");
};

const getHistory = async () => {
  const response = await axios.get(`${API_URL}/history`, cookieRequestConfig);
  if (response.status === 200) {
    return response.data;
  }
  throw new Error("Failed to get history");
};

const checkApiKeySession = async () => {
  const response = await axios.get(
    `${API_URL}/api-key-check/`,
    cookieRequestConfig
  );
  if (response.status === 200) {
    return response.data;
  }
  throw new Error("No active API key session");
};

const validateApiKey = async (apiKey: string) => {
  const response = await axios.get(`${API_URL}/api-key-check/`, {
    headers: {
      Authorization: apiKey,
    },
    withCredentials: true,
  });
  if (response.status === 200) {
    return response.data;
  }
  throw new Error("Invalid API key");
};

const clearApiKeySession = async () => {
  const response = await axios.post(
    `${API_URL}/api-key-clear/`,
    {},
    cookieRequestConfig
  );
  if (response.status === 200) {
    return response.data;
  }
  throw new Error("Failed to clear API key session");
};

const handleResponseData = (response: string) => {
  if (typeof response === "string" && response.charAt(0) === "{") {
    const parsedData = JSON.parse(response);
    if (parsedData.response) {
      return parsedData.response;
    }
  }
  return response;
};

const insertFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(
    `${API_URL}/pdf-upload/`,
    formData,
    cookieRequestConfig
  );
  if (response.status === 200) {
    return response.data;
  }
  throw new Error("Failed to insert file");
};

const chatWithRAG = async (prompt: string) => {
  const response = await axios.post(
    `${API_URL}/rag-chat/`,
    { prompt },
    cookieRequestConfig
  );
  if (response.status === 200) {
    return response.data;
  }
  throw new Error("Failed to insert file");
};

const generateImage = async (prompt: string) => {
  const response = await axios.post(
    `${API_URL}/image/`,
    { prompt },
    cookieRequestConfig
  );

  if (response.status === 200) {
    return response.data;
  }
  throw new Error("Failed to generate image");
};

const createEmail = async (
  context: string,
  recipients: string,
  sender: string,
  prompt: string
) => {
  const response = await axios.post(
    `${API_URL}/email/`,
    { context, recipients, sender, prompt },
    cookieRequestConfig
  );
  if (response.status === 200) {
    return response.data;
  }
  throw new Error("Failed to create email");
};

const analyzeSentiment = async (prompt: string) => {
  const response = await axios.post(
    `${API_URL}/sentiment/`,
    { prompt },
    cookieRequestConfig
  );
  if (response.status === 200) {
    return response.data;
  }
};

const services = {
  postPrompt,
  postProofreader,
  postSummarizer,
  postTranslator,
  postWriter,
  postRewriter,
  postCopywriting,
  postExplainer,
  getHistory,
  checkApiKeySession,
  validateApiKey,
  clearApiKeySession,
  chatWithRAG,
  insertFile,
  handleResponseData,
  generateImage,
  createEmail,
  analyzeSentiment,
};

export default services;
