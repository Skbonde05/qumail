import { useEffect, useState } from "react";
import { getDrafts, deleteDraft } from "../services/mailApi";

function Drafts() {
  const [drafts, setDrafts] = useState([]);

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    const response = await getDrafts();
    setDrafts(response.data);
  };

  return (
    <div>
      <h2>Drafts</h2>
      {drafts.map((draft) => (
        <div key={draft._id}>
          <h4>{draft.subject}</h4>
          <button onClick={() => deleteDraft(draft._id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

export default Drafts;