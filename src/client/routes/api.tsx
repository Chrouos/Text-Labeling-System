import { getApiUrl } from '../utils';
const API_URL = getApiUrl();

export const processDataRoutes = {
  fetchUploadsFileName: `${API_URL}/processData/fetchUploadsFileName`,
  uploadTheFile: `${API_URL}/processData/uploadTheFile`,
  fetchFileContentJson: `${API_URL}/processData/fetchFileContentJson`,
  uploadProcessedFile: `${API_URL}/processData/uploadProcessedFile`,
  fetchUploadsProcessedFileName: `${API_URL}/processData/fetchUploadsProcessedFileName`,
  downloadProcessedFile: `${API_URL}/processData/downloadProcessedFile`,
  deleteFile: `${API_URL}/processData/deleteFile`,
  addExtractionLabel_all: `${API_URL}/processData/addExtractionLabel_all`,
  removeLabel_all: `${API_URL}/processData/removeLabel_all`,
  gptRetrieve: `${API_URL}/processData/gptRetrieve`,
  gptRetrieve_all: `${API_URL}/processData/gptRetrieve_all`,
  formatterProcessedContent: `${API_URL}/processData/formatterProcessedContent`,
  uploadFileSort: `${API_URL}/processData/uploadFileSort`,
};

export const loginRoutes = {
  checkAccountExist: `${API_URL}/login/checkExist`,
};



