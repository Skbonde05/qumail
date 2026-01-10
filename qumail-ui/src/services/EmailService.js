// EmailService.js - UPDATED to match your backend server
const API_BASE = "http://localhost:5000";

class EmailService {
  // ✅ MAIN: Fetch all emails from all folders
  static async fetchEmails(email, password) {
    try {
      console.time("fetchEmails");
      console.log(`🔍 Fetching emails for: ${email}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${API_BASE}/fetch-emails`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email, 
          password 
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.timeEnd("fetchEmails");
        const errorText = await response.text();
        console.error(`Server error ${response.status}:`, errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.timeEnd("fetchEmails");
      
      if (data.success && Array.isArray(data.emails)) {
        console.log(`✅ Fetched ${data.emails.length} emails`);
        return data.emails;
      }
      
      console.warn("No emails found in response");
      return [];
      
    } catch (error) {
      console.timeEnd("fetchEmails");
      if (error.name === 'AbortError') {
        console.warn("Fetch emails timeout after 30 seconds");
        throw new Error("Connection timeout. Please try again.");
      } else {
        console.error("Fetch emails error:", error.message);
        throw error;
      }
    }
  }

  // ✅ Fetch emails from specific folder
  static async fetchFolderEmails(email, password, folder = 'inbox', limit = 50) {
    try {
      console.log(`📁 Fetching ${folder} emails for: ${email}`);
      
      const response = await fetch(`${API_BASE}/fetch-folder-emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          password,
          folder,
          limit 
        })
      });

      if (!response.ok) {
        console.error(`Folder fetch error ${response.status}`);
        return [];
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.emails)) {
        console.log(`✅ Fetched ${data.emails.length} emails from ${folder}`);
        return data.emails;
      }
      
      return [];
    } catch (error) {
      console.error(`Fetch ${folder} error:`, error);
      return [];
    }
  }

  // ✅ Smart email fetching with fallback
  static async smartFetchEmails(email, password) {
    console.time("smartFetchEmails");
    
    try {
      // Try to fetch all emails first
      const emails = await this.fetchEmails(email, password);
      
      console.timeEnd("smartFetchEmails");
      
      if (emails.length > 0) {
        console.log(`✅ Got ${emails.length} emails total`);
        return emails;
      }
      
      // If no emails, try individual folders
      console.log("⚠️ No emails from main endpoint, trying folders...");
      
      const folders = ['inbox', 'sent', 'drafts', 'trash', 'spam', 'archive'];
      const allEmails = [];
      
      for (const folder of folders) {
        try {
          const folderEmails = await this.fetchFolderEmails(email, password, folder, 20);
          allEmails.push(...folderEmails);
          if (folderEmails.length > 0) {
            console.log(`✅ Got ${folderEmails.length} emails from ${folder}`);
          }
        } catch (folderError) {
          console.warn(`Failed to fetch ${folder}:`, folderError.message);
        }
      }
      
      if (allEmails.length > 0) {
        return allEmails;
      }
      
      // Last resort: get drafts from drafts endpoint
      console.log("🔧 Using fallback: fetching drafts...");
      const drafts = await this.getDrafts(email);
      return drafts;
      
    } catch (error) {
      console.timeEnd("smartFetchEmails");
      console.error("Smart fetch error:", error.message);
      throw error;
    }
  }

  // ✅ Get drafts
  static async getDrafts(email) {
    try {
      const response = await fetch(`${API_BASE}/get-drafts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      if (!response.ok) return [];
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.drafts)) {
        // Convert drafts to email format
        return data.drafts.map(draft => ({
          uid: draft.id,
          id: draft.id,
          from: email,
          to: draft.to || '',
          subject: draft.subject || '(No Subject)',
          body: draft.body || '',
          date: draft.updatedAt || new Date().toISOString(),
          folder: 'drafts',
          draft: true,
          read: true,
          starred: false,
          important: false,
          snoozed: null,
          sent: false,
          trash: false,
          spam: false,
          archived: false
        }));
      }
      
      return [];
    } catch (error) {
      console.error("Get drafts error:", error);
      return [];
    }
  }

  // ✅ Get email body
  static async fetchEmailBody(email, password, uid, folder = "inbox") {
    try {
      console.log(`📄 Fetching body for email ${uid} in ${folder}`);
      
      const response = await fetch(`${API_BASE}/get-email-body`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, uid, folder })
      });

      if (!response.ok) return "";
      
      const data = await response.json();
      return data.body || "";
    } catch (error) {
      console.error("Fetch email body error:", error.message);
      return "";
    }
  }

  // ✅ Update email state
  static async updateEmailState(email, uid, action, value) {
    try {
      const response = await fetch(`${API_BASE}/update-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, uid, action, value })
      });

      const data = await response.json();
      return data.success === true;
      
    } catch (error) {
      console.error("Update email error:", error);
      return false;
    }
  }

  // ✅ Bulk actions
  static async bulkAction(email, uids, action, value = true) {
    try {
      const response = await fetch(`${API_BASE}/bulk-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, uids, action, value })
      });

      const data = await response.json();
      return data.success === true;
      
    } catch (error) {
      console.error("Bulk action error:", error);
      return false;
    }
  }

  // ✅ Move emails
  static async moveEmails(email, uids, targetFolder) {
    try {
      const response = await fetch(`${API_BASE}/move-emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, uids, targetFolder })
      });

      const data = await response.json();
      return data.success === true;
      
    } catch (error) {
      console.error("Move emails error:", error);
      return false;
    }
  }

  // ✅ Get email statistics
  static async getEmailStats(email) {
    try {
      const response = await fetch(`${API_BASE}/email-stats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      if (!response.ok) return {};
      
      const data = await response.json();
      return data.success ? data.stats : {};
      
    } catch (error) {
      console.error("Get stats error:", error);
      return {};
    }
  }

  // ✅ Save draft
  static async saveDraft(email, draft) {
    try {
      const response = await fetch(`${API_BASE}/save-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, draft })
      });

      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error("Save draft error:", error);
      return { success: false, error: error.message };
    }
  }

  // ✅ Delete draft
  static async deleteDraft(email, draftId) {
    try {
      const response = await fetch(`${API_BASE}/delete-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, draftId })
      });

      const data = await response.json();
      return data.success === true;
      
    } catch (error) {
      console.error("Delete draft error:", error);
      return false;
    }
  }

  // ✅ Send email
  static async sendEmail(emailData) {
    try {
      console.log("📤 Sending email...");
      
      const response = await fetch(`${API_BASE}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData)
      });

      const data = await response.json();
      console.log("Send email response:", data);
      
      return data;
      
    } catch (error) {
      console.error("Send email error:", error);
      return { success: false, error: error.message };
    }
  }

  // ✅ Get folders list
  static async getFolders(email, password) {
    try {
      const response = await fetch(`${API_BASE}/get-folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) return [];
      
      const data = await response.json();
      return data.success ? data.folders : [];
      
    } catch (error) {
      console.error("Get folders error:", error);
      return [];
    }
  }

  // ✅ Test connection
  static async testConnection() {
    try {
      const response = await fetch(`${API_BASE}/`, {
        method: "GET"
      });
      
      return response.ok;
    } catch (error) {
      console.error("Test connection error:", error);
      return false;
    }
  }

  // ✅ Add this method for compatibility with App.js
  static async tryFetchEmails(email, password) {
    return await this.smartFetchEmails(email, password);
  }
}

export default EmailService;