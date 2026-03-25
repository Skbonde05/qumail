import React, { useState, useEffect } from "react";
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
  Typography,
  Alert,
  Snackbar,
  CircularProgress,
  useTheme,
  useMediaQuery
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
  Delete,
  Save,
  Warning,
  FlashOn as Zap,
  Security as Shield,
  Lock as LockKeyhole,
  Mail
} from "@mui/icons-material";
import axios from "axios";

import EmailService from "../services/EmailService";

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function Compose({ open, onClose, onSend, draftToEdit = null }) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [level, setLevel] = useState("aes256");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [showCC, setShowCC] = useState(false);
  const [showBCC, setShowBCC] = useState(false);
  const [draftId, setDraftId] = useState(null);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processedAttachments, setProcessedAttachments] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [errors, setErrors] = useState({});

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // ... (keeping other useEffects and handlers same)
  
  // Load draft if editing
  useEffect(() => {
    if (draftToEdit) {
      setTo(draftToEdit.to || "");
      setSubject(draftToEdit.subject || "");
      setBody(draftToEdit.body || "");
      setLevel(draftToEdit.encryptionLevel || "aes256");
      setCc(draftToEdit.cc || "");
      setBcc(draftToEdit.bcc || "");
      setDraftId(draftToEdit.id || null);
      
      if (draftToEdit.cc) setShowCC(true);
      if (draftToEdit.bcc) setShowBCC(true);
    }
  }, [draftToEdit]);

  // Auto-save draft every 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((subject || body) && !sending) {
        handleSaveDraft();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [subject, body, to, cc, bcc, level]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const handleSend = async () => {
    // Validate required fields
    const validationErrors = {};
    
    if (!to.trim()) {
      validationErrors.to = "Please enter a recipient email";
    } else if (!to.toLowerCase().endsWith("@qumail.com")) {
      validationErrors.to = "Recipient must be a @qumail.com address";
    }
    
    if (!body.trim()) {
      validationErrors.body = "Please enter a message body";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSnackbar({
        open: true,
        message: "Please fix the validation errors",
        severity: "error"
      });
      return;
    }

    setSending(true);
    
    try {
      // Split CC/BCC into arrays
      const ccArray = cc ? cc.split(',').map(e => e.trim()).filter(e => e) : [];
      const bccArray = bcc ? bcc.split(',').map(e => e.trim()).filter(e => e) : [];

      // Use standard EmailService
      const result = await EmailService.sendEmail(
        to.trim(),
        subject.trim() || "(No Subject)",
        body.trim(),
        level,
        ccArray,
        bccArray,
        processedAttachments
      );

      if (result.success) {
        setSnackbar({
          open: true,
          message: `Email sent successfully with ${level === "none" ? "no encryption" : level === "otp" ? "quantum OTP" : "quantum AES-256"} encryption`,
          severity: "success"
        });

        // If this was a draft, delete it
        if (draftId) {
          try {
            await EmailService.deleteDraft(draftId);
          } catch (e) {
            console.error("Error deleting draft:", e);
          }
        }

        // Call the onSend callback
        if (onSend) {
          onSend(to, subject, body, level, result.messageId);
        }

        // Close dialog and reset
        setTimeout(() => {
          onClose();
          resetForm();
        }, 1500);
      }
    } catch (error) {
      console.error("Send error:", error);
      
      setSnackbar({
        open: true,
        message: error.message || "Failed to send email",
        severity: "error"
      });
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = async () => {
    // Don't save empty drafts
    if (!subject.trim() && !body.trim() && !to.trim()) {
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        return;
      }

      const result = await EmailService.saveDraft(
        draftId,
        to.trim(),
        subject.trim() || "(No Subject)",
        body.trim(),
        level,
        cc,
        bcc,
        processedAttachments
      );

      if (result.success) {
        setDraftId(result.draftId);
        
        setSnackbar({
          open: true,
          message: "Draft saved",
          severity: "success"
        });
      }
    } catch (error) {
      console.error("Save draft error:", error);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setTo("");
    setSubject("");
    setBody("");
    setLevel("aes256");
    setCc("");
    setBcc("");
    setAttachments([]);
    setShowCC(false);
    setShowBCC(false);
    setDraftId(null);
    setProcessedAttachments([]);
    setErrors({});
  };

  const handleClose = () => {
    // If there's content, ask before discarding
    if ((subject || body || to) && !sending) {
      if (window.confirm("You have unsaved changes. Discard draft?")) {
        onClose();
        resetForm();
      }
    } else {
      onClose();
      resetForm();
    }
  };

  const handleAttachment = async (e) => {
    const files = Array.from(e.target.files);
    setAttachments([...attachments, ...files]);
    
    // Process to base64 for API
    const newProcessed = await Promise.all(files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          resolve({
            filename: file.name,
            contentType: file.type,
            size: file.size,
            data: ev.target.result.split(',')[1]
          });
        };
        reader.readAsDataURL(file);
      });
    }));
    
    setProcessedAttachments(prev => [...prev, ...newProcessed]);

    setSnackbar({
      open: true,
      message: `${files.length} file(s) attached`,
      severity: "info"
    });
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
    setProcessedAttachments(processedAttachments.filter((_, i) => i !== index));
  };

  const securityLevels = {
    otp: { 
      label: "Quantum OTP", 
      color: "error", 
      icon: <LockKeyhole />, 
      description: "Maximum Security - One-time pad encryption" 
    },
    aes256: { 
      label: "Quantum AES-256", 
      color: "success", 
      icon: <Zap />, 
      description: "Fast & Secure - AES-256-GCM encryption" 
    },
    none: { 
      label: "Standard", 
      color: "default", 
      icon: <Mail />, 
      description: "No Encryption - Standard email" 
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const insertFormat = (format) => {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = body.substring(start, end);
    
    let formattedText = '';
    
    switch(format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'link':
        const url = prompt('Enter URL:', 'https://');
        if (url) {
          formattedText = selectedText ? `[${selectedText}](${url})` : url;
        }
        break;
      default:
        return;
    }
    
    setBody(body.substring(0, start) + formattedText + body.substring(end));
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
        PaperProps={{
          sx: isMobile ? {} : {
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
            {draftId ? "Edit Draft" : "New Message"}
            {saving && <CircularProgress size={20} sx={{ ml: 2, color: "white" }} />}
          </Typography>
          <IconButton onClick={handleClose} sx={{ color: "white" }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 2.5 }}>
            {/* Recipients */}
            <Box sx={{ display: "flex", alignItems: "flex-start", mb: 1 }}>
              <Typography sx={{ width: 70, color: "text.secondary", fontSize: "0.875rem", pt: 1 }}>
                To
              </Typography>
              <Box sx={{ flex: 1, ml: 1 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder="recipient@qumail.com"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  error={!!errors.to}
                  helperText={errors.to}
                  disabled={sending}
                />
              </Box>
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
                  placeholder="cc@qumail.com"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  sx={{ ml: 1 }}
                  disabled={sending}
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
                  placeholder="bcc@qumail.com"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  sx={{ ml: 1 }}
                  disabled={sending}
                />
              </Box>
            )}

            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <Button
                size="small"
                onClick={() => setShowCC(!showCC)}
                sx={{ fontSize: "0.75rem" }}
                disabled={sending}
              >
                {showCC ? "Hide Cc" : "Cc"}
              </Button>
              <Button
                size="small"
                onClick={() => setShowBCC(!showBCC)}
                sx={{ fontSize: "0.75rem" }}
                disabled={sending}
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
                disabled={sending}
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
                    <Box sx={{ mr: 1, display: "flex", color: securityLevels[level]?.color }}>
                         <Shield size={20} />
                    </Box>
                  }
                  disabled={sending}
                >
                  {Object.entries(securityLevels).map(([key, value]) => (
                    <MenuItem key={key} value={key}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ display: "flex", color: value.color }}>
                          {value.icon}
                        </Box>
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
              <Box sx={{ mt: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box sx={{ display: "flex", color: "text.secondary" }}>
                     {securityLevels[level].icon}
                </Box>
                <Typography variant="caption" color="text.secondary">
                    {securityLevels[level].description}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Message Body ... same ... */}
            <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 1 }}>
              {/* Formatting Toolbar */}
              <Box sx={{ 
                bgcolor: "#f8f9fa", 
                borderBottom: "1px solid #e0e0e0",
                p: 1,
                display: "flex",
                gap: 0.5,
                flexWrap: "wrap"
              }}>
                <Tooltip title="Bold (Ctrl+B)">
                  <IconButton size="small" onClick={() => insertFormat('bold')} disabled={sending}>
                    <FormatBold fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Italic (Ctrl+I)">
                  <IconButton size="small" onClick={() => insertFormat('italic')} disabled={sending}>
                    <FormatItalic fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Divider orientation="vertical" flexItem />
                <Tooltip title="Bulleted List">
                  <IconButton size="small" disabled={sending}>
                    <FormatListBulleted fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Numbered List">
                  <IconButton size="small" disabled={sending}>
                    <FormatListNumbered fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Divider orientation="vertical" flexItem />
                <Tooltip title="Insert Link (Ctrl+K)">
                  <IconButton size="small" onClick={() => insertFormat('link')} disabled={sending}>
                    <InsertLink fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Insert Image">
                  <IconButton size="small" disabled={sending}>
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
                InputProps={{ 
                  disableUnderline: true,
                  readOnly: sending
                }}
                placeholder="Type your message here..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                error={!!errors.body}
                helperText={errors.body}
                sx={{ 
                  p: 2,
                  "& .MuiInputBase-root": {
                    fontSize: "0.95rem",
                    lineHeight: 1.6
                  }
                }}
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
                      avatar={<Avatar sx={{ bgcolor: 'transparent' }}><AttachFile fontSize="small" color="action" /></Avatar>}
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
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <input
                accept="*"
                style={{ display: 'none' }}
                id="attachment-button"
                type="file"
                multiple
                onChange={handleAttachment}
                disabled={sending}
              />
              <label htmlFor="attachment-button">
                <Button
                  startIcon={<AttachFile />}
                  component="span"
                  size="small"
                  disabled={sending}
                >
                  Attach
                </Button>
              </label>
              
              <Button
                startIcon={<Save />}
                size="small"
                onClick={handleSaveDraft}
                disabled={sending || (!subject && !body && !to)}
                sx={{ ml: 1 }}
              >
                {saving ? "Saving..." : "Save Draft"}
              </Button>
              
              <Box sx={{ ml: 2, display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box sx={{ display: "flex", color: "text.secondary" }}>
                     {securityLevels[level].icon}
                </Box>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {securityLevels[level].label}
                </Typography>
                {draftId && (
                  <Chip
                    label="Draft"
                    size="small"
                    color="info"
                    sx={{ ml: 1, height: 20, fontSize: "0.65rem" }}
                  />
                )}
              </Box>
            </Box>
            
            <Box>
              <Button
                onClick={handleClose}
                sx={{ mr: 1 }}
                disabled={sending}
              >
                Discard
              </Button>
              <Button
                variant="contained"
                startIcon={sending ? <CircularProgress size={20} color="inherit" /> : <Send />}
                onClick={handleSend}
                disabled={sending || !to.trim() || !body.trim()}
              >
                {sending ? "Sending..." : "Send"}
              </Button>
            </Box>
          </Box>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
