import { API_URL } from '../utils';

export const apiRoutes = {
  fetchUploadsFileName: `${API_URL}/processData/fetchUploadsFileName`,
  uploadTheFile: `${API_URL}/processData/uploadTheFile`,
  fetchFileContentJson: `${API_URL}/processData/fetchFileContentJson`,
  uploadProcessedFile: `${API_URL}/processData/uploadProcessedFile`,
  fetchUploadsProcessedFileName: `${API_URL}/processData/fetchUploadsProcessedFileName`,
  downloadProcessedFile: `${API_URL}/processData/downloadProcessedFile`,
  deleteFile: `${API_URL}/processData/deleteFile`,
  addNewLabel_all: `${API_URL}/processData/addNewLabel_all`,
  removeLabel_all: `${API_URL}/processData/removeLabel_all`,
  gptRetrieve: `${API_URL}/processData/gptRetrieve`
};
