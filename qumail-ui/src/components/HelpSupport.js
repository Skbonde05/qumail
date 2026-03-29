import React, { useState } from "react";
import {
  Box, Typography, Accordion, AccordionSummary, AccordionDetails, Divider, useTheme, Button, Grid, IconButton
} from "@mui/material";
import {
  ExpandMore, EmailOutlined, HelpOutline, LockOutlined, CloudOutlined, SpeedOutlined
} from "@mui/icons-material";
import { styled, alpha } from '@mui/material/styles';

const FAQItem = styled(Accordion)(({ theme }) => ({
  backgroundColor: 'transparent',
  boxShadow: 'none',
  borderBottom: `1px solid ${theme.palette.divider}`,
  '&:before': { display: 'none' },
  '&.Mui-expanded': { margin: 0 },
  '& .MuiAccordionSummary-root': {
    padding: theme.spacing(2, 0),
    '&.Mui-expanded': { minHeight: 48 }
  },
  '& .MuiAccordionDetails-root': {
    padding: theme.spacing(0, 0, 3, 0),
  }
}));

const CategoryCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: '24px',
  border: `1px solid ${theme.palette.divider}`,
  height: '100%',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.02),
  }
}));

export default function HelpSupport({ onCompose }) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState("panel1");

  const faqs = [
    {
      id: "panel1",
      question: "What is Quantum-Secure encryption and why do I need it?",
      answer: "Standard encryption (like RSA) is vulnerable to future quantum computers. QuMail implements One-Time Pad (OTP) and quantum-resistant AES-256 architectures. This ensures that your private communications today cannot be 'stored now and decrypted later' by quantum processors, providing truly future-proof privacy."
    },
    {
      id: "panel2",
      question: "What is my storage limit and how can I see my usage?",
      answer: "Every QuMail account comes with 15GB of free secure storage. You can view your real-time storage metrics at the bottom of the navigation sidebar. If you reach your limit, you can archive old messages to 'Cold Storage' or contact support to upgrade to a Pro plan."
    },
    {
      id: "panel3",
      question: "How do the 'Master Keys' and session tokens work?",
      answer: "QuMail uses a decentralized key management system. When you login, your session token is verified against our secure vault. This token allows you to derive keys for viewing your mail without ever exposing your master password to the network, preventing middle-man attacks."
    },
    {
      id: "panel4",
      question: "What is the difference between archiving and deleting?",
      answer: "Archiving removes an email from your Inbox but keeps it in your permanent 'Archive' folder. Deleting moves mail to the 'Trash' folder, where it is automatically and permanently purged after 30 days."
    },
    {
      id: "panel5",
      question: "Why do some emails require a manual decryption key?",
      answer: "For maximum security, QuMail allows 'Absolute Encrypted' messages (via OTP). These are so secure that even our system cannot read them. To view these, you must enter the unique decryption key shared between you and the sender, ensuring end-to-end zero-knowledge privacy."
    },
    {
      id: "panel8",
      question: "How do I recover my account if I lose my password?",
      answer: "Because we use zero-knowledge encryption, your password cannot be reset by us if you lose it. You must use the Recovery Codes generated during account creation. We strongly recommend storing these codes in a separate physical location."
    }
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, width: '100%' }}>
      {/* Header Section */}
      <Box sx={{ mb: 4, maxWidth: 800 }}>
        <Typography variant="h3" fontWeight="900" sx={{ mb: 1, letterSpacing: '-2px', color: 'text.primary' }}>
          Help & Support
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, lineHeight: 1.5 }}>
          Explore our knowledge base for everything about quantum security, account management, and enterprise-grade privacy.
        </Typography>
      </Box>

      {/* FAQs Section */}
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Typography variant="h4" fontWeight="800" sx={{ mb: 1, letterSpacing: '-1px' }}>
            Frequently Asked Questions
          </Typography>
          <Box>
            {faqs.map((faq) => (
              <FAQItem
                key={faq.id}
                expanded={expanded === faq.id}
                onChange={(e, isExpanded) => setExpanded(isExpanded ? faq.id : false)}
              >
                <AccordionSummary expandIcon={<ExpandMore fontSize="small" />}>
                  <Typography fontWeight="700" variant="subtitle1">{faq.question}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.8, fontSize: '0.95rem' }}>
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </FAQItem>
            ))}
          </Box>
        </Grid>

        {/* Support Sidebar */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Box sx={{ position: 'sticky', top: 100, p: 5, borderRadius: '40px', bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.02) : alpha('#000', 0.01), border: 1, borderColor: 'divider' }}>
            <Typography variant="h5" fontWeight="900" gutterBottom sx={{ letterSpacing: '-0.5px' }}>
              Still stuck?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
              Our security experts are available 24/7 for technical assistance and data recovery services.
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button 
                variant="contained" 
                fullWidth
                size="large"
                startIcon={<EmailOutlined />}
                onClick={() => onCompose && onCompose()}
                sx={{ borderRadius: '14px', py: 2, fontWeight: 800, textTransform: 'none' }}
              >
                support@qumail.com
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', opacity: 0.6 }}>
                Average response time: &lt; 2 hours
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

    </Box>
  );
}