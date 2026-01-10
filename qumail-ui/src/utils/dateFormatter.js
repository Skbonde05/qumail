// utils/dateFormatter.js
export const formatDate = (timestamp) => {
  if (!timestamp) return "Just now";
  const date = new Date(parseInt(timestamp));
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  
  return date.toLocaleDateString();
};

// utils/emailProcessor.js
export const determineSecurityLevel = (body) => {
  if (!body) return "none";
  try {
    const match = body.match(/\[(.*?)\|/);
    return match ? match[1] : "none";
  } catch {
    return "none";
  }
};

export const generatePreview = (body) => {
  if (!body) return "";
  try {
    const content = body.replace(/^\[.*?\]:/, "");
    return content.substring(0, 100) + (content.length > 100 ? "..." : "");
  } catch {
    return body.substring(0, 100) || "";
  }
};