import React, { useState } from "react";
import {
  Box, Typography, Accordion, AccordionSummary, AccordionDetails, Divider, useTheme, Button
} from "@mui/material";
import {
  ExpandMore, EmailOutlined
} from "@mui/icons-material";
import { styled, alpha } from '@mui/material/styles';

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  backgroundColor: 'transparent',
  boxShadow: 'none',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
  '&:before': { display: 'none' },
  '&.Mui-expanded': { margin: 0 },
  '& .MuiAccordionSummary-root': {
    padding: theme.spacing(1.5, 0),
    '&.Mui-expanded': { minHeight: 48 }
  },
  '& .MuiAccordionDetails-root': {
    padding: theme.spacing(0, 0, 3, 0),
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

  const handleSupportEmail = () => {
    if (onCompose) onCompose();
  };

  return (
    <Box sx={{ maxWidth: 700, mx: "auto", p: { xs: 2, md: 6 } }}>
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" fontWeight="700" sx={{ mb: 1, letterSpacing: '-0.5px' }}>
          Help & Support
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Frequently asked questions about QuMail.
        </Typography>
      </Box>

      {/* FAQs list */}
      <Box sx={{ mb: 8 }}>
        {faqs.map((faq) => (
          <StyledAccordion
            key={faq.id}
            expanded={expanded === faq.id}
            onChange={(e, isExpanded) => setExpanded(isExpanded ? faq.id : false)}
          >
            <AccordionSummary expandIcon={<ExpandMore fontSize="small" />}>
              <Typography fontWeight="700" variant="body1">{faq.question}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {faq.answer}
              </Typography>
            </AccordionDetails>
          </StyledAccordion>
        ))}
      </Box>

      <Divider sx={{ mb: 6, opacity: 0.5 }} />

      {/* Support email section */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6" fontWeight="700" gutterBottom>
          Still need help?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Get in touch with our team for any other queries.
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<EmailOutlined />}
          onClick={handleSupportEmail}
          sx={{ 
            borderRadius: '10px', 
            textTransform: 'none', 
            fontWeight: 700,
            backgroundColor: 'text.primary',
            color: 'background.paper',
            '&:hover': {
              backgroundColor: alpha(theme.palette.text.primary, 0.8)
            }
          }}
        >
          support@qumail.com
        </Button>
      </Box>
    </Box>
  );
}