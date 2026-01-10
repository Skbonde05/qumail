import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
  Tooltip,
  Divider,
  Chip,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography
} from "@mui/material";
import {
  Close,
  Send,
  AttachFile,
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  FormatListNumbered,
  InsertLink,
  InsertPhoto,
  Security
} from "@mui/icons-material";

export default function Compose({ open, onClose, onSend }) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [level, setLevel] = useState("aes");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [showCC, setShowCC] = useState(false);
  const [showBCC, setShowBCC] = useState(false);

  const handleSend = () => {
    onSend(to, subject, body, level);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setTo("");
    setSubject("");
    setBody("");
    setLevel("aes");
    setCc("");
    setBcc("");
    setAttachments([]);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const handleAttachment = (e) => {
    const files = Array.from(e.target.files);
    setAttachments([...attachments, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const securityLevels = {
    otp: { label: "Quantum OTP", color: "error", icon: "🔒", description: "Maximum Security" },
    aes: { label: "Quantum AES", color: "success", icon: "⚡", description: "Fast & Secure" },
    none: { label: "Standard", color: "default", icon: "✉️", description: "No Encryption" }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          height: "85vh",
          maxHeight: "700px",
          borderRadius: "12px"
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: "primary.main", 
        color: "white",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        py: 1.5
      }}>
        <Typography variant="h6" fontWeight="600">
          New Message
        </Typography>
        <IconButton onClick={handleClose} sx={{ color: "white" }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 2.5 }}>
          {/* Recipients */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Typography sx={{ width: 70, color: "text.secondary", fontSize: "0.875rem" }}>
              To
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="recipient@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              sx={{ ml: 1 }}
            />
          </Box>

          {showCC && (
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Typography sx={{ width: 70, color: "text.secondary", fontSize: "0.875rem" }}>
                Cc
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="cc@example.com"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                sx={{ ml: 1 }}
              />
            </Box>
          )}

          {showBCC && (
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Typography sx={{ width: 70, color: "text.secondary", fontSize: "0.875rem" }}>
                Bcc
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="bcc@example.com"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                sx={{ ml: 1 }}
              />
            </Box>
          )}

          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <Button
              size="small"
              onClick={() => setShowCC(!showCC)}
              sx={{ fontSize: "0.75rem" }}
            >
              {showCC ? "Hide Cc" : "Cc"}
            </Button>
            <Button
              size="small"
              onClick={() => setShowBCC(!showBCC)}
              sx={{ fontSize: "0.75rem" }}
            >
              {showBCC ? "Hide Bcc" : "Bcc"}
            </Button>
          </Box>

          {/* Subject */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography sx={{ width: 70, color: "text.secondary", fontSize: "0.875rem" }}>
              Subject
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              sx={{ ml: 1 }}
            />
          </Box>

          {/* Security Level */}
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Security Level</InputLabel>
              <Select
                value={level}
                label="Security Level"
                onChange={(e) => setLevel(e.target.value)}
                startAdornment={
                  <Security sx={{ mr: 1, color: securityLevels[level].color }} />
                }
              >
                {Object.entries(securityLevels).map(([key, value]) => (
                  <MenuItem key={key} value={key}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <span>{value.icon}</span>
                      <Box>
                        <Typography variant="body2">{value.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {value.description}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              {level === "otp" && "One-time pad encryption - Maximum security for sensitive messages"}
              {level === "aes" && "AES-256 encryption - Perfect balance of speed and security"}
              {level === "none" && "Standard email - No encryption applied"}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Message Body */}
          <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 1 }}>
            {/* Formatting Toolbar */}
            <Box sx={{ 
              bgcolor: "#f8f9fa", 
              borderBottom: "1px solid #e0e0e0",
              p: 1,
              display: "flex",
              gap: 0.5
            }}>
              <Tooltip title="Bold">
                <IconButton size="small">
                  <FormatBold fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Italic">
                <IconButton size="small">
                  <FormatItalic fontSize="small" />
                </IconButton>
              </Tooltip>
              <Divider orientation="vertical" flexItem />
              <Tooltip title="Bulleted List">
                <IconButton size="small">
                  <FormatListBulleted fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Numbered List">
                <IconButton size="small">
                  <FormatListNumbered fontSize="small" />
                </IconButton>
              </Tooltip>
              <Divider orientation="vertical" flexItem />
              <Tooltip title="Insert Link">
                <IconButton size="small">
                  <InsertLink fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Insert Image">
                <IconButton size="small">
                  <InsertPhoto fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Message Text Area */}
            <TextField
              fullWidth
              multiline
              rows={12}
              variant="standard"
              InputProps={{ disableUnderline: true }}
              placeholder="Type your message here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              sx={{ p: 2 }}
            />
          </Box>

          {/* Attachments */}
          {attachments.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Attachments ({attachments.length})
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {attachments.map((file, index) => (
                  <Chip
                    key={index}
                    label={`${file.name} (${(file.size / 1024).toFixed(1)} KB)`}
                    onDelete={() => removeAttachment(index)}
                    avatar={<Avatar><AttachFile fontSize="small" /></Avatar>}
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: 2, 
        bgcolor: "#f8f9fa",
        borderTop: "1px solid #e0e0e0"
      }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          <Box>
            <input
              accept="*"
              style={{ display: 'none' }}
              id="attachment-button"
              type="file"
              multiple
              onChange={handleAttachment}
            />
            <label htmlFor="attachment-button">
              <Button
                startIcon={<AttachFile />}
                component="span"
                size="small"
              >
                Attach
              </Button>
            </label>
            <Typography variant="caption" sx={{ ml: 2, color: "text.secondary" }}>
              {securityLevels[level].icon} {securityLevels[level].label}
            </Typography>
          </Box>
          
          <Box>
            <Button
              onClick={handleClose}
              sx={{ mr: 1 }}
            >
              Discard
            </Button>
            <Button
              variant="contained"
              startIcon={<Send />}
              onClick={handleSend}
              disabled={!to.trim()}
            >
              Send
            </Button>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
}