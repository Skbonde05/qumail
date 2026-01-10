// src/pages/SplashScreen.js (Simplified Version)
import React, { useEffect, useState } from 'react';
import { Box, Typography, LinearProgress, Fade, Container } from '@mui/material';
import { styled } from '@mui/material/styles';

const SplashContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#000814',
  background: 'linear-gradient(135deg, #000814 0%, #001d3d 100%)',
  zIndex: 9999,
  overflow: 'hidden',
}));

const Content = styled(Container)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  color: '#ffffff',
}));

const Logo = styled(Box)(({ theme }) => ({
  fontSize: '4rem',
  marginBottom: theme.spacing(2),
  animation: 'pulse 2s infinite',
  '@keyframes pulse': {
    '0%': { transform: 'scale(1)', opacity: 1 },
    '50%': { transform: 'scale(1.1)', opacity: 0.8 },
    '100%': { transform: 'scale(1)', opacity: 1 },
  },
}));

const Title = styled(Typography)(({ theme }) => ({
  fontSize: '3rem',
  fontWeight: 'bold',
  marginBottom: theme.spacing(1),
  background: 'linear-gradient(45deg, #00b4d8, #90e0ef)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  [theme.breakpoints.down('sm')]: {
    fontSize: '2rem',
  },
}));

const Subtitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.2rem',
  color: '#90e0ef',
  marginBottom: theme.spacing(4),
  [theme.breakpoints.down('sm')]: {
    fontSize: '1rem',
  },
}));

const ProgressContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: 300,
  marginTop: theme.spacing(4),
}));

const SplashScreen = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) {
          return 100;
        }
        const diff = Math.random() * 10;
        return Math.min(oldProgress + diff, 100);
      });
    }, 200);

    // Auto navigate after 3 seconds
    const finishTimer = setTimeout(() => {
      clearInterval(timer);
      onFinish();
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <SplashContainer>
      <Fade in={true} timeout={1000}>
        <Content maxWidth="sm">
          <Logo>🔐</Logo>
          <Title variant="h1">QuMail</Title>
          <Subtitle variant="h5">Quantum-Secure Email Platform</Subtitle>
          
          <ProgressContainer>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#00b4d8',
                  borderRadius: 3,
                }
              }}
            />
            <Typography variant="caption" sx={{ color: '#90e0ef', mt: 1 }}>
              {progress < 100 ? 'Initializing secure connection...' : 'Ready!'}
            </Typography>
          </ProgressContainer>
        </Content>
      </Fade>
    </SplashContainer>
  );
};

export default SplashScreen;