// utils/dateFormatter.js
export const formatDate = (timestamp) => {
  if (!timestamp) return "";
  const dateStr = timestamp.toString();
  const date = new Date(isNaN(dateStr) ? dateStr : parseInt(dateStr));
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
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