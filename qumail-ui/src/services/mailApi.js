export const saveDraft = (data) =>
  axios.post("/api/mail/draft", data);

export const getDrafts = () =>
  axios.get("/api/mail/drafts");

export const deleteDraft = (id) =>
  axios.delete(`/api/mail/draft/${id}`);

export const sendDraft = (id) =>
  axios.post(`/api/mail/send/${id}`);

export const moveToTrash = (id) => {
  return axios.put(`/api/mail/trash/${id}`);
};

export const restoreMail = (id) => {
  return axios.put(`/api/mail/restore/${id}`);
};

export const permanentDelete = (id) => {
  return axios.delete(`/api/mail/permanent/${id}`);
};