import React from 'react';
import { Box, Typography, Card, CardContent, Divider, Stack, useTheme, Avatar } from '@mui/material';
import { Security, Lock, VisibilityOff, Storage, Gavel, Shield, Info } from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 24,
  background: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
  overflow: 'visible',
}));

const HeroSection = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
  borderRadius: 24,
  padding: theme.spacing(6, 4),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(4, 2),
  },
  textAlign: 'center',
  marginBottom: theme.spacing(4),
  position: 'relative',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

const PolicySection = ({ icon: Icon, title, content, delay = 0 }) => {
  const theme = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
            <Icon />
          </Avatar>
          <Typography variant="h6" fontWeight="700">
            {title}
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, ml: { xs: 0, sm: 7 }, mt: { xs: 1, sm: 0 } }}>
          {content}
        </Typography>
      </Box>
    </motion.div>
  );
};

const PrivacyPolicy = () => {
  const theme = useTheme();

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: 'auto' }}>
      <HeroSection>
        <Shield sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" fontWeight="800" gutterBottom sx={{
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: { xs: '2.4rem', sm: '3rem', md: '3.75rem' }
        }}>
          Privacy Manifest
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ opacity: 0.8, maxWidth: 600, mx: 'auto' }}>
          Your privacy is not a setting; it's our fundamental architecture. Quantum-secure and completely zero-knowledge.
        </Typography>
      </HeroSection>

      <StyledCard>
        <CardContent sx={{ p: { xs: 3, md: 6 } }}>
          <PolicySection
            icon={Lock}
            title="Zero-Knowledge Infrastructure"
            content="At QuMail, we operate on a strictly zero-knowledge principle. Your encryption keys are generated locally on your device and never transit across our servers in a readable format. This means that even if legally compelled, we cannot access the content of your communications."
            delay={0.1}
          />

          <Divider sx={{ my: 4, opacity: 0.5 }} />

          <PolicySection
            icon={Security}
            title="Quantum-Resistant Encryption"
            content="We employ post-quantum cryptographic standards to ensure your data remains secure not just today, but against the computational threats of tomorrow. Every email sent through QuMail is encapsulated in a quantum-resistant layer, protecting your legacy from future decryption attempts."
            delay={0.2}
          />

          <Divider sx={{ my: 4, opacity: 0.5 }} />

          <PolicySection
            icon={VisibilityOff}
            title="Metadata Minimization"
            content="We believe metadata is as sensitive as the message itself. Our systems are engineered to strip and anonymize as much routing data as possible. We do not maintain logs of your IP addresses, device identifiers, or interaction patterns beyond what is strictly necessary for system health."
            delay={0.3}
          />

          <Divider sx={{ my: 4, opacity: 0.5 }} />

          <PolicySection
            icon={Storage}
            title="Data Sovereignty"
            content="Your data belongs to you. We provide high-end tools for complete data portability and permanent erasure. When you delete a mailbox or a message, it is purged using secure deletion standards across our distributed network, leaving no digital ghost."
            delay={0.4}
          />

          <Divider sx={{ my: 4, opacity: 0.5 }} />

          <PolicySection
            icon={Gavel}
            title="Legal Transparency"
            content="QuMail is committed to the highest standards of legal transparency. We will only comply with valid, legally-binding requests from competent authorities, and even then, can only provide encrypted data which we cannot unlock. We operate under jurisdictions with the strongest privacy protections globally."
            delay={0.5}
          />

          <Box sx={{
            mt: 6,
            p: 3,
            bgcolor: alpha(theme.palette.info.main, 0.05),
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <Info color="info" />
            <Typography variant="caption" color="text.secondary">
              Last updated: March 2026.
            </Typography>
          </Box>
        </CardContent>
      </StyledCard>

      <Box sx={{ textAlign: 'center', mt: 4, mb: 10 }}>
        <Typography variant="body2" color="text.secondary">
          Questions about your privacy? Contact our security team at <Typography component="span" variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>security@qumail.com</Typography>
        </Typography>
      </Box>
    </Box>
  );
};

export default PrivacyPolicy;
