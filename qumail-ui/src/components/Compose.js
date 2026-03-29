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
  useMediaQuery,
  alpha
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
import { useNavigate } from "react-router-dom";

import QuMailService from "../services/QuMailService";
import { keyframes } from "@mui/material/styles";

const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(1.15); opacity: 1; }
`;

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
  const [suggestion, setSuggestion] = useState("");
  const [showAiPulse, setShowAiPulse] = useState(false);
  const [appContextSettings, setAppContextSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('qumail_settings');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Listen for real-time settings updates
  useEffect(() => {
    const handleSettingsUpdate = (event) => {
      if (event.detail) {
        setAppContextSettings(event.detail);
      }
    };
    window.addEventListener('qumail-settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('qumail-settings-updated', handleSettingsUpdate);
  }, []);
  
  // Load draft or reset for new email
  useEffect(() => {
    if (open) {
      if (draftToEdit) {
        setTo(draftToEdit.to || "");
        setSubject(draftToEdit.subject || "");
        setBody(draftToEdit.body || "");
        setLevel(draftToEdit.encryptionLevel || "aes256");
        setCc(Array.isArray(draftToEdit.cc) ? draftToEdit.cc.join(", ") : draftToEdit.cc || "");
        setBcc(Array.isArray(draftToEdit.bcc) ? draftToEdit.bcc.join(", ") : draftToEdit.bcc || "");
        setAttachments(draftToEdit.attachments || []);
        setProcessedAttachments(draftToEdit.attachments || []);
        setDraftId(draftToEdit._id || null);
        
        if (draftToEdit.cc && draftToEdit.cc.length > 0) setShowCC(true);
        else setShowCC(false);
        if (draftToEdit.bcc && draftToEdit.bcc.length > 0) setShowBCC(true);
        else setShowBCC(false);
      } else {
        // Reset state for new email
        setTo("");
        setSubject("");
        // Load signature for new emails
        const sig = appContextSettings.signature || "";
        setBody(sig ? `\n\n\n${sig}` : "");
        setLevel(appContextSettings.defaultEncryption || "aes256");
        setCc("");
        setBcc("");
        setAttachments([]);
        setProcessedAttachments([]);
        setDraftId(null);
        setShowCC(false);
        setShowBCC(false);
      }
    }
  }, [open, draftToEdit, appContextSettings.defaultEncryption, appContextSettings.signature]);

  // Auto-save draft based on settings
  useEffect(() => {
    if (!appContextSettings.autoSaveDrafts) return;

    const interval = (appContextSettings.autoSaveInterval || 5) * 1000;
    const timer = setTimeout(() => {
      if ((subject || body) && !sending) {
        handleSaveDraft();
      }
    }, interval);

    return () => clearTimeout(timer);
  }, [subject, body, to, cc, bcc, level, appContextSettings.autoSaveDrafts, appContextSettings.autoSaveInterval, sending]);

  // AI Smart Compose Mock Logic
  const mockAiCompletions = {
    "how are": " you doing today?",
    "i hope": " this email finds you well.",
    "please let": " me know if you have any questions.",
    "thanks for": " your quick response.",
    "best": " regards,",
    "i will": " get back to you soon.",
    "attached": " is the document we discussed.",
    "looking forward": " to hearing from you."
  };

  const handleBodyChange = (e) => {
    const value = e.target.value;
    setBody(value);
    setErrors({ ...errors, body: null });

    // Check for suggestions at the end of the text
    const lastLines = value.split('\n');
    const lastLine = lastLines[lastLines.length - 1].toLowerCase();
    
    let foundSuggestion = "";
    if (lastLine.length > 2) {
      for (const [prefix, completion] of Object.entries(mockAiCompletions)) {
        if (lastLine.endsWith(prefix)) {
          foundSuggestion = completion;
          setShowAiPulse(true);
          setTimeout(() => setShowAiPulse(false), 2000);
          break;
        }
      }
    }
    setSuggestion(foundSuggestion);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab' && suggestion) {
      e.preventDefault();
      setBody(prev => prev + suggestion);
      setSuggestion("");
    }
  };


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

      // Use unified QuMailService
      const result = await QuMailService.sendEmail(
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
            await QuMailService.deleteDraft(draftId);
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
      const result = await QuMailService.saveDraft(
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
      }
    } catch (error) {
      console.error("Save draft error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!draftId) {
      onClose();
      resetForm();
      return;
    }

    if (window.confirm("Are you sure you want to discard this draft? It will be permanently deleted.")) {
      try {
        await QuMailService.deleteDraft(draftId);
        onClose();
        resetForm();
        setSnackbar({
          open: true,
          message: "Draft discarded",
          severity: "info"
        });
      } catch (error) {
        console.error("Delete draft error:", error);
        setSnackbar({
          open: true,
          message: "Failed to delete draft",
          severity: "error"
        });
      }
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
    // Just close the modal, don't reset if we are editing
    // The resetForm will be called by the useEffect if open becomes false
    onClose();
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

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      setAttachments(prev => [...prev, ...files]);
      
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
        message: `${files.length} file(s) attached via drag & drop`,
        severity: "info"
      });
    }
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
            borderRadius: "12px",
            ...(isDragging && {
              border: '2px dashed #1a73e8',
              bgcolor: alpha('#1a73e8', 0.05)
            })
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <DialogTitle sx={{ 
          bgcolor: "primary.main", 
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 1.5
        }}>
          <Typography variant="h6" fontWeight="600" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            {draftId ? "Edit Draft" : "New Message"}
            {saving && <CircularProgress size={20} sx={{ ml: 2, color: "white" }} />}
          </Typography>
          <IconButton onClick={handleClose} sx={{ color: "white" }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, position: 'relative' }}>
          {isDragging && (
            <Box sx={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha('#1a73e8', 0.1),
              zIndex: 10,
              pointerEvents: 'none'
            }}>
              <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 2, boxShadow: 3, textAlign: 'center' }}>
                <AttachFile sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6">Drop to Attach Files</Typography>
              </Box>
            </Box>
          )}
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

            {/* Message Body */}
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
                <Box sx={{ flexGrow: 1 }} />
              </Box>

              {/* Message Text Area */}
              <Box sx={{ position: 'relative' }}>
                <TextField
                  fullWidth
                  multiline
                  rows={12}
                  variant="standard"
                  InputProps={{ 
                    disableUnderline: true,
                    readOnly: sending,
                    spellCheck: appContextSettings.spellCheck
                  }}
                  placeholder="Type your message here..."
                  value={body}
                  onChange={handleBodyChange}
                  onKeyDown={handleKeyDown}
                  error={!!errors.body}
                  helperText={errors.body}
                  sx={{ 
                    p: 2,
                    "& .MuiInputBase-root": {
                      fontSize: "0.95rem",
                      lineHeight: 1.6,
                      zIndex: 2
                    }
                  }}
                />
                {suggestion && (
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    p: 2, 
                    pointerEvents: 'none',
                    userSelect: 'none'
                  }}>
                    <Typography sx={{ 
                      fontSize: "0.95rem", 
                      lineHeight: 1.6, 
                      whiteSpace: 'pre-wrap',
                      color: 'transparent'
                    }}>
                      {body}
                      <Box component="span" sx={{ color: 'text.disabled', opacity: 0.5 }}>
                        {suggestion}
                        <Box component="span" sx={{ 
                          ml: 0.5, 
                          bgcolor: alpha(theme.palette.primary.main, 0.1), 
                          color: 'primary.main', 
                          px: 0.5, 
                          borderRadius: '4px',
                          fontSize: '0.65rem',
                          fontWeight: 700
                        }}>
                          TAB
                        </Box>
                      </Box>
                    </Typography>
                  </Box>
                )}
              </Box>
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
          <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", flexWrap: 'wrap', gap: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: 'wrap', gap: 1 }}>
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
                onClick={handleDeleteDraft}
                sx={{ mr: 1, color: 'error.main' }}
                disabled={sending}
                startIcon={<Delete />}
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
