import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  IconButton,
  useTheme
} from "@mui/material";
import {
  HelpOutline as HelpIcon,
  Search,
  ExpandMore,
  ContactSupport,
  Article,
  VideoLibrary,
  Forum,
  BugReport,
  Email,
  Phone,
  Chat
} from "@mui/icons-material";

export default function HelpSupport() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState("panel1");

  const faqs = [
    {
      id: "panel1",
      question: "How do I reset my password?",
      answer: "To reset your password, go to Settings > Security & Privacy > Change Password. You'll need to enter your current password and then create a new one. Make sure your new password is at least 8 characters long and includes a mix of letters, numbers, and special characters."
    },
    {
      id: "panel2",
      question: "How can I increase my storage limit?",
      answer: "You can upgrade your storage by clicking the 'Upgrade Storage' button in your profile menu. We offer several plans ranging from 50GB to unlimited storage. All paid plans also include additional features like priority support and custom domains."
    },
    {
      id: "panel3",
      question: "How do I set up email filters?",
      answer: "To set up filters, go to Settings > Filters and Blocked Addresses. Click 'Create a new filter' and specify the criteria for emails you want to filter. You can choose to automatically archive, label, forward, or delete emails that match your filter criteria."
    },
    {
      id: "panel4",
      question: "Is my data secure with QuMail?",
      answer: "Yes, QuMail uses industry-standard encryption for all data in transit and at rest. We also offer two-factor authentication for added security. Your emails are stored on secure servers with multiple layers of protection and regular security audits."
    },
    {
      id: "panel5",
      question: "How do I export my emails?",
      answer: "You can export your emails by going to Settings > Accounts and Import > Download mail. This will create a compressed archive of your emails that you can download. The export process may take some time depending on the amount of mail you have."
    }
  ];

  const contactMethods = [
    {
      icon: <Email />,
      title: "Email Support",
      description: "Get help via email",
      details: "support@qumail.com",
      responseTime: "Typically within 24 hours"
    },
    {
      icon: <Chat />,
      title: "Live Chat",
      description: "Chat with our support team",
      details: "Available 9 AM - 6 PM EST",
      responseTime: "Instant response during business hours"
    },
    {
      icon: <Phone />,
      title: "Phone Support",
      description: "Call us for immediate assistance",
      details: "+1 (800) 123-4567",
      responseTime: "Available 24/7 for critical issues"
    },
    {
      icon: <Forum />,
      title: "Community Forum",
      description: "Get help from other users",
      details: "community.qumail.com",
      responseTime: "Varies by community response"
    }
  ];

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="700" gutterBottom>
          <HelpIcon sx={{ mr: 2, verticalAlign: "middle" }} />
          Help & Support
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Find answers to common questions or contact our support team
        </Typography>
      </Box>

      {/* Search */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" fontWeight="600" gutterBottom>
          How can we help you today?
        </Typography>
        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <TextField
            fullWidth
            placeholder="Search for help articles, FAQs, or guides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />
            }}
          />
          <Button variant="contained">
            Search
          </Button>
        </Box>
      </Paper>

      {/* Quick Help Categories */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mb: 3 }}>
          Quick Help
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
          {[
            { icon: <Article />, title: "Documentation", count: "150+ articles" },
            { icon: <VideoLibrary />, title: "Video Tutorials", count: "50+ videos" },
            { icon: <BugReport />, title: "Report a Bug", count: "Submit issue" },
            { icon: <ContactSupport />, title: "Contact Support", count: "Multiple options" },
            { icon: <Forum />, title: "Community", count: "10k+ members" },
            { icon: <Email />, title: "Email Guides", count: "Get started" }
          ].map((item, index) => (
            <Paper
              key={index}
              sx={{
                p: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: theme.shadows[4]
                }
              }}
            >
              <Box sx={{ 
                width: 60, 
                height: 60, 
                borderRadius: "50%", 
                bgcolor: theme.palette.primary.main + "20",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2
              }}>
                <Box sx={{ color: theme.palette.primary.main, fontSize: 30 }}>
                  {item.icon}
                </Box>
              </Box>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                {item.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {item.count}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* FAQs */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mb: 3 }}>
          Frequently Asked Questions
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {faqs.map((faq) => (
            <Accordion
              key={faq.id}
              expanded={expanded === faq.id}
              onChange={handleChange(faq.id)}
              sx={{
                "&:before": { display: "none" },
                boxShadow: "none",
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: "8px !important",
                mb: 1
              }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography fontWeight="500">{faq.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">{faq.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Paper>

      {/* Contact Methods */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mb: 3 }}>
          Contact Support
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Choose your preferred method to get in touch with our support team
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
          {contactMethods.map((method, index) => (
            <Paper
              key={index}
              sx={{
                p: 3,
                border: `1px solid ${theme.palette.divider}`,
                "&:hover": {
                  borderColor: theme.palette.primary.main,
                  boxShadow: theme.shadows[1]
                }
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <Box sx={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: "50%", 
                  bgcolor: theme.palette.primary.main + "20",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Box sx={{ color: theme.palette.primary.main }}>
                    {method.icon}
                  </Box>
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="600">
                    {method.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {method.description}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box>
                <Typography variant="body2" fontWeight="500" gutterBottom>
                  {method.details}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                  <Chip
                    label={method.responseTime}
                    size="small"
                    sx={{ 
                      bgcolor: theme.palette.primary.main + "10",
                      color: theme.palette.primary.main,
                      fontSize: "0.7rem"
                    }}
                  />
                </Box>
              </Box>
              
              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => alert(`Opening ${method.title}`)}
              >
                Get Help
              </Button>
            </Paper>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}