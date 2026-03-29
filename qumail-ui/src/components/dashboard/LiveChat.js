import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, IconButton, Paper, Typography, TextField, Button, Avatar, 
  Tooltip, Badge, alpha, useTheme, keyframes, Zoom, Fade
} from '@mui/material';
import { 
  Chat, Close, Send, SupportAgent, Minimize, 
  FiberManualRecord, History, Bolt, Shield
} from '@mui/icons-material';

const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(1.1); opacity: 1; }
`;

const slideIn = keyframes`
  from { transform: translateY(100px) scale(0.8); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
`;

const messageSlide = keyframes`
  from { transform: translateX(20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

export default function LiveChat() {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your QuMail Security Concierge. How can I help you with your encrypted mailbox today?", sender: 'bot', time: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { text: input, sender: 'user', time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulated AI Intelligence
    setTimeout(() => {
      let response = "I'm analyzing your security query across our quantum nodes...";
      const lower = input.toLowerCase();
      
      if (lower.includes('key')) response = "Your Master Keys are stored locally in your browser's encrypted vault. You can rotate them at any time in the Security Settings tab.";
      else if (lower.includes('storage')) response = "You currently have a 15GB secure storage quota. You can track your usage in the sidebar dashboard.";
      else if (lower.includes('encrypt')) response = "QuMail uses AES-256 for standard secure mail and One-Time Pad (OTP) for absolute quantum privacy.";
      else if (lower.includes('hello') || lower.includes('hi')) response = "Greetings! I am active and ready to assist with any security or account inquiries.";
      else response = "That's an interesting technical query. I've logged this for our senior cryptographers, but standard protocol suggests checking your security logs for anomalies.";

      setMessages(prev => [...prev, { text: response, sender: 'bot', time: new Date() }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
      {/* Floating Button */}
      {!isOpen && (
        <Zoom in={!isOpen}>
          <Tooltip title="Security Concierge" placement="left">
            <IconButton
              onClick={() => setIsOpen(true)}
              sx={{
                width: 60, height: 60,
                bgcolor: 'primary.main',
                color: 'white',
                boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.4)}`,
                '&:hover': { bgcolor: 'primary.dark', transform: 'scale(1.1)' },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                animation: `${pulse} 2s infinite alternate`
              }}
            >
              <Badge color="info" variant="dot" anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <SupportAgent />
              </Badge>
            </IconButton>
          </Tooltip>
        </Zoom>
      )}

      {/* Chat Window */}
      <Fade in={isOpen}>
        <Paper
          elevation={24}
          sx={{
            width: { xs: 320, sm: 380 },
            height: 520,
            borderRadius: '24px',
            overflow: 'hidden',
            display: isOpen ? 'flex' : 'none',
            flexDirection: 'column',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: theme.palette.mode === 'dark' 
              ? `0 24px 80px rgba(0,0,0,0.8)` 
              : `0 24px 80px rgba(0,0,0,0.1)`,
            animation: `${slideIn} 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)`
          }}
        >
          {/* Header */}
          <Box sx={{ 
            p: 2.5, 
            bgcolor: 'primary.main', 
            color: 'white', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
          }}>
            <Avatar sx={{ bgcolor: alpha('#fff', 0.2) }}><SupportAgent fontSize="small" /></Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" fontWeight="900" sx={{ lineHeight: 1.2 }}>QuMail Concierge</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <FiberManualRecord sx={{ fontSize: 8, color: '#4caf50' }} /> Verified Security Agent
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
              <Minimize sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          {/* Messages Area */}
          <Box 
            ref={scrollRef}
            sx={{ 
              flexGrow: 1, 
              p: 2, 
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 1.5,
              bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.black, 0.2) : alpha(theme.palette.common.white, 0.5)
            }}
          >
            {/* Encryption Notice */}
            <Box sx={{ p: 1, textAlign: 'center' }}>
               <Typography variant="caption" color="text.disabled" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                 <Shield sx={{ fontSize: 12 }} /> This support session is E2E Encrypted.
               </Typography>
            </Box>

            {messages.map((msg, idx) => (
              <Box 
                key={idx} 
                sx={{ 
                  alignSelf: msg.sender === 'bot' ? 'flex-start' : 'flex-end',
                  maxWidth: '85%',
                  animation: `${messageSlide} 0.3s ease-out`
                }}
              >
                <Paper sx={{ 
                  p: 1.5, 
                  borderRadius: msg.sender === 'bot' ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                  bgcolor: msg.sender === 'bot' 
                    ? (theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.05) : '#f1f1f1')
                    : 'primary.main',
                  color: msg.sender === 'bot' ? 'text.primary' : 'white',
                  boxShadow: 'none',
                  border: msg.sender === 'bot' ? 1 : 0,
                  borderColor: 'divider'
                }}>
                  <Typography variant="body2">{msg.text}</Typography>
                </Paper>
                <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block', textAlign: msg.sender === 'bot' ? 'left' : 'right', fontSize: '0.65rem' }}>
                   {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
            ))}
            {isTyping && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1, opacity: 0.7 }}>Agent is typing...</Typography>
            )}
          </Box>

          {/* Input Area */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Ask anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                   borderRadius: '12px',
                   bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.03) : 'transparent'
                }
              }}
            />
            <IconButton 
              color="primary" 
              onClick={handleSend} 
              disabled={!input.trim()}
              sx={{ 
                bgcolor: input.trim() ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
              }}
            >
              <Send />
            </IconButton>
          </Box>
        </Paper>
      </Fade>
    </Box>
  );
}
