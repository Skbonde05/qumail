import React, { useEffect, useState } from "react";
import EmailService from "../services/EmailService";

function Trash() {
  const [mails, setMails] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTrash();
  }, []);

  const fetchTrash = async () => {
    try {
      setLoading(true);
      const data = await EmailService.getTrashEmails();
      // Ensure we're using the correct data structure from EmailService
      setMails(data.emails || []);
    } catch (error) {
      console.error("Error fetching trash:", error);
    } finally {
      setLoading(false);
    }
  };

  const restore = async (id) => {
    try {
      await EmailService.updateEmailStatus(id, 'restore');
      fetchTrash();
    } catch (error) {
      console.error("Error restoring mail:", error);
    }
  };

  const deleteForever = async (id) => {
    try {
      if (window.confirm("Are you sure you want to permanently delete this email?")) {
        await EmailService.updateEmailStatus(id, 'delete');
        fetchTrash();
      }
    } catch (error) {
      console.error("Error deleting mail:", error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Trash</h2>
      {loading ? (
        <p>Loading trash...</p>
      ) : mails.length === 0 ? (
        <p>No emails in trash</p>
      ) : (
        mails.map((mail) => (
          <div key={mail.id || mail._id} style={{ borderBottom: '1px solid #eee', padding: '10px 0' }}>
            <h4>{mail.subject || '(No Subject)'}</h4>
            <p><small>From: {mail.from}</small></p>
            <button onClick={() => restore(mail.id || mail._id)}>Restore</button>
            <button 
              onClick={() => deleteForever(mail.id || mail._id)}
              style={{ marginLeft: '10px', color: 'red' }}
            >
              Delete Forever
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default Trash;