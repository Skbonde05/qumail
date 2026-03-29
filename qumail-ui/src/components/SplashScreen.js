import React, { useEffect, useState } from 'react';
import { Box, Typography, LinearProgress, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

import { styled, alpha } from '@mui/material/styles';

const SplashScreenContainer = styled(Box)(({ theme }) => ({
  height: '100vh',
  width: '100vw',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.mode === 'dark' ? '#0a0e14' : '#f8fafc',
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 9999,
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")',
    opacity: 0.03,
    pointerEvents: 'none',
  }
}));

const SplashScreen = ({ onComplete }) => {
  const theme = useTheme();

  useEffect(() => {
    const timer = setTimeout(onComplete, 1500); // Reduced from 4000 to 1500 for better UX
    return () => clearTimeout(timer);
  }, [onComplete]);

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { staggerChildren: 0.15 } 
    },
    exit: { 
      opacity: 0, 
      scale: 1.05, 
      filter: 'blur(20px)', 
      transition: { duration: 1, ease: "easeInOut" } 
    }
  };

  const logoVariants = {
    initial: { scale: 0.5, opacity: 0, y: 30 },
    animate: { 
      scale: 1, 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 10,
        delay: 0.2 
      } 
    }
  };

  const textVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" } 
    }
  };

  return (
    <AnimatePresence>
      <SplashScreenContainer>
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}
        >
          <motion.div variants={logoVariants}>
            <Box
              component="img"
              src="/qumail_logo.png"
              sx={{ 
                  height: { xs: 80, sm: 120 }, 
                  mb: 5, 
                  filter: 'drop-shadow(0 12px 24px rgba(26, 115, 232, 0.4))',
                  animation: 'float 4s infinite ease-in-out'
              }}
              alt="Qumail Logo"
            />
          </motion.div>
          
          <Box sx={{ position: 'relative', mb: 1 }}>
            <Box sx={{ display: 'flex' }}>
              {"QuMail".split("").map((letter, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + (index * 0.1), duration: 0.5 }}
                  style={{
                    fontSize: 'clamp(3rem, 10vw, 5rem)',
                    fontWeight: '900',
                    letterSpacing: '-3px',
                    display: 'inline-block',
                    color: '#1a73e8',
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </Box>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: 1.5, duration: 1.5, ease: "easeInOut" }}
              style={{
                position: 'absolute',
                bottom: -5,
                left: 0,
                height: '3px',
                backgroundColor: '#1a73e8',
                opacity: 0.6
              }}
            />
          </Box>
          
          <motion.div variants={textVariants} transition={{ delay: 1.8 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                  letterSpacing: '8px', 
                  textTransform: 'uppercase', 
                  fontWeight: 800, 
                  color: 'primary.main',
                  opacity: 0.8,
                  mt: 2,
                  fontSize: '0.75rem'
              }}
            >
              Secure Messaging
            </Typography>
          </motion.div>
        </motion.div>

        {/* Dynamic Background Glows */}
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none', opacity: 0.1 }}>
            <Box
               sx={{
                 position: 'absolute',
                 width: '600px',
                 height: '600px',
                 borderRadius: '50%',
                 backgroundColor: alpha('#1a73e8', 0.1),
                 filter: 'blur(100px)',
               }}
            />
        </Box>

        <Box sx={{ position: 'absolute', bottom: 60, textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.4, y: 0 }}
            transition={{ delay: 2.5, duration: 1 }}
          >
            <Typography variant="caption" sx={{ letterSpacing: '4px', fontWeight: '900', fontSize: '0.7rem' }}>
              ENGINEERED FOR SUPREME PRIVACY
            </Typography>
          </motion.div>
        </Box>

        <style>
          {`
            @keyframes float {
              0% { transform: translateY(0px) rotate(0deg); }
              33% { transform: translateY(-20px) rotate(2deg); }
              66% { transform: translateY(-10px) rotate(-1deg); }
              100% { transform: translateY(0px) rotate(0deg); }
            }
          `}
        </style>
      </SplashScreenContainer>
    </AnimatePresence>
  );
};

export default SplashScreen;
