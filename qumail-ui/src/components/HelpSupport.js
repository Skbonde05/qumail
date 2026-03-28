import React, { useState } from "react";
import {
  Box, Typography, Paper, Button, Accordion, AccordionSummary, AccordionDetails, Divider, Chip, useTheme
} from "@mui/material";
import {
  HelpOutline as HelpIcon, ExpandMore, Email, Chat, Phone, Security, Speed, Storage
} from "@mui/icons-material";
import { styled } from '@mui/material/styles';

export default function HelpSupport({ onCompose }) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState("panel1");

  const faqs = [
    {
      id: "panel1",
      icon: <Security />,
      question: "What is Quantum-Secure encryption and why do I need it?",
      answer: "Standard encryption (like RSA) is vulnerable to future quantum computers. QuMail implements One-Time Pad (OTP) and quantum-resistant AES-256 architectures. This ensures that your private communications today cannot be 'stored now and decrypted later' by quantum processors, providing truly future-proof privacy."
    },
    {
      id: "panel2",
      icon: <Storage />,
      question: "What is my storage limit and how can I see my usage?",
      answer: "Every QuMail account comes with 15GB of free secure storage. You can view your real-time storage metrics at the bottom of the navigation sidebar. If you reach your limit, you can archive old messages to 'Cold Storage' or contact support to upgrade to a Pro plan."
    },
    {
      id: "panel3",
      icon: <Speed />,
      question: "How do the 'Master Keys' and session tokens work?",
      answer: "QuMail uses a decentralized key management system. When you login, your session token is verified against our secure vault. This token allows you to derive keys for viewing your mail without ever exposing your master password to the network, preventing middle-man attacks."
    },
    {
      id: "panel4",
      icon: <HelpIcon />,
      question: "What is the difference between archiving and deleting?",
      answer: "Archiving removes an email from your Inbox but keeps it in your permanent 'Archive' folder, which doesn't count against your primary active storage as heavily. Deleting moves mail to the 'Trash' folder, where it is automatically and permanently purged after 30 days."
    },
    {
      id: "panel5",
      icon: <Security />,
      question: "Why do some emails require a manual decryption key?",
      answer: "For maximum security, QuMail allows 'Absolute Encrypted' messages (via OTP). These are so secure that even our system cannot read them. To view these, you must enter the unique decryption key shared between you and the sender, ensuring end-to-end zero-knowledge privacy."
    },
    {
      id: "panel6",
      icon: <Security />,
      question: "Can I use QuMail on multiple devices?",
      answer: "Yes. QuMail is accessible from any modern browser. However, because our encryption is end-to-end, you may need to 'Export and Import' your Master Encryption Key when first signing in on a new device to access your archived encrypted communications."
    },
    {
      id: "panel7",
      icon: <HelpIcon />,
      question: "How do labels and custom folders work?",
      answer: "Custom labels act as both tags and folders. When you 'Label' a message, it remains in your inbox but also appears in the corresponding label view in the sidebar. If you 'Move To' a label, it is archived from the inbox and accessible only via that label folder."
    },
    {
      id: "panel8",
      icon: <Security />,
      question: "How do I recover my account if I lose my password?",
      answer: "Because we use zero-knowledge encryption, your password cannot be reset by us if you lose it. You must use the Recovery Codes generated during account creation. We strongly recommend storing these codes in a separate physical location or an offline password manager."
    }
  ];

  const handleSupportEmail = () => {
    if (onCompose) {
      onCompose();
      // Optionally we could pre-fill the support email, but we'll let the user type if desired 
      // or we can add a way to pass draft state. For now, we trigger compose.
    }
  };

  return (
    <Box sx={{ maxWidth: 850, mx: "auto", p: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" fontWeight="800" sx={{ letterSpacing: '-1px', mb: 2, fontSize: { xs: '2.4rem', sm: '3rem' } }}>
          How can we help?
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ opacity: 0.8, maxWidth: 600, mx: 'auto' }}>
          Find answers to common questions about our quantum-secure platform or get in touch with our security experts.
        </Typography>
      </Box>

      {/* FAQs */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h5" fontWeight="700" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
          <HelpIcon color="primary" /> Common Questions
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {faqs.map((faq) => (
            <Accordion
              key={faq.id}
              expanded={expanded === faq.id}
              onChange={(e, isExpanded) => setExpanded(isExpanded ? faq.id : false)}
              sx={{
                bgcolor: 'background.paper',
                backgroundImage: 'none',
                "&:before": { display: "none" },
                boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.03)',
                borderRadius: "16px !important",
                overflow: 'hidden',
                border: theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease'
              }}
            >
              <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 3, py: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ color: 'primary.main', display: 'flex' }}>{faq.icon}</Box>
                  <Typography fontWeight="600" variant="subtitle1">{faq.question}</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                <Divider sx={{ mb: 2, opacity: 0.5 }} />
                <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>{faq.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Box>

      {/* Contact Support */}
      <Box>
        <Typography variant="h5" fontWeight="700" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Chat color="primary" /> Contact Support
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
          {[
            {
              icon: <Email />,
              title: "Email Support",
              details: "support@qumail.com",
              waitTip: "24h Response",
              action: handleSupportEmail
            },
            {
              icon: <Chat />,
              title: "Live Chat",
              details: "Available in Dashboard",
              waitTip: "Instant",
              action: () => alert("Live Chat is available for Pro users in the dashboard.")
            }
          ].map((method, index) => (
            <Paper
              key={index}
              sx={{
                p: 3,
                borderRadius: '20px',
                border: theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                transition: 'all 0.3s ease',
                "&:hover": {
                  transform: 'translateY(-5px)',
                  boxShadow: theme.shadows[8],
                  borderColor: 'primary.main'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ 
                  width: 54, 
                  height: 54, 
                  borderRadius: "14px", 
                  bgcolor: theme.palette.primary.main + "15",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: 'primary.main'
                }}>
                  {method.icon}
                </Box>
                <Chip label={method.waitTip} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
              </Box>
              
              <Typography variant="h6" fontWeight="700" gutterBottom>
                {method.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {method.details}
              </Typography>
              
              <Button
                fullWidth
                variant="contained"
                sx={{ 
                  mt: 3, 
                  borderRadius: '12px', 
                  py: 1, 
                  textTransform: 'none', 
                  fontWeight: 700,
                  boxShadow: 'none'
                }}
                onClick={method.action}
              >
                {method.title === "Email Support" ? "Compose Message" : "Start Chat"}
              </Button>
            </Paper>
          ))}
        </Box>
      </Box>

      <Box sx={{ mt: 8, textAlign: 'center', opacity: 0.6 }}>
        <Typography variant="caption">
          QuMail Security Help Center • v5.2.0 • Independent Secure Network
        </Typography>
      </Box>
    </Box>
  );
}