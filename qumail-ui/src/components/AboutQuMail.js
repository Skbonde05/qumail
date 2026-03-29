import React from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  Divider,
  Chip,
  Link,
  useTheme
} from "@mui/material";
import {
  InfoOutlined as InfoIcon,
  Security,
  Speed,
  Storage,
  Group,
  Update,
  Code,
  GitHub,
  Twitter,
  LinkedIn,
  Email,
  Language
} from "@mui/icons-material";
import { styled } from '@mui/material/styles';

export default function AboutQumail() {
  const theme = useTheme();

  const teamMembers = [
    { name: "Alex Johnson", role: "Founder & CEO", avatar: "AJ" },
    { name: "Sarah Chen", role: "Lead Developer", avatar: "SC" },
    { name: "Marcus Lee", role: "UX Designer", avatar: "ML" },
    { name: "Priya Patel", role: "Support Lead", avatar: "PP" }
  ];

  const features = [
    {
      icon: <Security />,
      title: "Security First",
      description: "End-to-end encryption and advanced security features"
    },
    {
      icon: <Speed />,
      title: "Lightning Fast",
      description: "Optimized for speed with minimal latency"
    },
    {
      icon: <Storage />,
      title: "Generous Storage",
      description: "15GB free storage with affordable upgrades"
    },
    {
      icon: <Group />,
      title: "Team Collaboration",
      description: "Built-in tools for team communication"
    }
  ];

  const stats = [
    { label: "Active Users", value: "2M+" },
    { label: "Emails Processed", value: "50B+" },
    { label: "Uptime", value: "99.9%" },
    { label: "Countries", value: "150+" }
  ];

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 6, textAlign: "center" }}>
        <Typography variant="h3" fontWeight="800" gutterBottom sx={{ fontSize: { xs: '2.4rem', sm: '3rem' } }}>
          <InfoIcon sx={{ mr: 2, verticalAlign: "middle", fontSize: { xs: 32, sm: 48 } }} />
          About Qumail
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: "auto" }}>
          A modern email platform designed for productivity, security, and seamless communication
        </Typography>
      </Box>

      {/* Mission */}
      <Paper sx={{ p: { xs: 3, md: 6 }, mb: 4, textAlign: "center", borderRadius: 4 }}>
        <Typography variant="h4" fontWeight="700" gutterBottom color="primary" sx={{ fontSize: { xs: '1.8rem', sm: '2.125rem' } }}>
          Our Mission
        </Typography>
        <Typography variant="body1" sx={{ maxWidth: 800, mx: "auto", fontSize: { xs: '1rem', sm: '1.1rem' }, lineHeight: 1.8 }}>
          To revolutionize email communication by providing a secure, intuitive, and feature-rich platform 
          that empowers individuals and teams to communicate more effectively. We believe email should be 
          fast, reliable, and privacy-focused.
        </Typography>
      </Paper>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {stats.map((stat, index) => (
          <Grid size={{ xs: 6, sm: 3 }} key={index}>
            <Card sx={{ textAlign: "center", height: "100%" }}>
              <CardContent>
                <Typography variant="h2" fontWeight="800" color="primary" gutterBottom>
                  {stat.value}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Features */}
      <Typography variant="h4" fontWeight="700" gutterBottom sx={{ mb: 4 }}>
        Why Choose Qumail?
      </Typography>
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {features.map((feature, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card sx={{ height: "100%", textAlign: "center" }}>
              <CardContent>
                <Box sx={{ 
                  width: 60, 
                  height: 60, 
                  borderRadius: "50%", 
                  bgcolor: theme.palette.primary.main + "20",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 2
                }}>
                  <Box sx={{ color: theme.palette.primary.main, fontSize: 30 }}>
                    {feature.icon}
                  </Box>
                </Box>
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Team */}
      <Typography variant="h4" fontWeight="700" gutterBottom sx={{ mb: 4 }}>
        Meet Our Team
      </Typography>
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {teamMembers.map((member, index) => (
          <Grid size={{ xs: 6, sm: 3 }} key={index}>
            <Card sx={{ textAlign: "center" }}>
              <CardContent>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mx: "auto",
                    mb: 2,
                    bgcolor: theme.palette.primary.main,
                    fontSize: "1.5rem"
                  }}
                >
                  {member.avatar}
                </Avatar>
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  {member.name}
                </Typography>
                <Typography variant="body2" color="primary" fontWeight="500">
                  {member.role}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Technology */}
      <Paper sx={{ p: 4, mb: 6 }}>
        <Typography variant="h4" fontWeight="700" gutterBottom sx={{ mb: 3 }}>
          <Code sx={{ mr: 2, verticalAlign: "middle" }} />
          Technology Stack
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
          {["React", "Node.js", "MongoDB", "Redis", "Docker", "AWS", "Material-UI", "TypeScript"].map((tech) => (
            <Chip
              key={tech}
              label={tech}
              variant="outlined"
              sx={{
                height: 40,
                fontSize: "1rem",
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main
              }}
            />
          ))}
        </Box>
        <Typography variant="body1" color="text.secondary">
          We use modern, scalable technologies to ensure Qumail remains fast, reliable, and secure 
          as we continue to grow and serve millions of users worldwide.
        </Typography>
      </Paper>

      {/* Version & Updates */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Update sx={{ mr: 2, color: theme.palette.primary.main }} />
                <Typography variant="h5" fontWeight="600">
                  Version Information
                </Typography>
              </Box>
              <Box sx={{ pl: 4 }}>
                <Typography variant="h3" fontWeight="800" color="primary" gutterBottom>
                  v2.1.0
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Release Date:</strong> November 15, 2023
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Status:</strong> Stable
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>License:</strong> Proprietary
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Update sx={{ mr: 2, color: theme.palette.primary.main }} />
                <Typography variant="h5" fontWeight="600">
                  Recent Updates
                </Typography>
              </Box>
              <Box sx={{ pl: 4 }}>
                <ul style={{ margin: 0, paddingLeft: "1rem", color: theme.palette.text.secondary }}>
                  <li>Enhanced security with end-to-end encryption</li>
                  <li>Improved search functionality</li>
                  <li>Dark mode improvements</li>
                  <li>Performance optimizations</li>
                  <li>Bug fixes and stability improvements</li>
                </ul>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Social & Links */}
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h5" fontWeight="700" gutterBottom>
          Connect With Us
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: "auto" }}>
          Stay updated with our latest developments, features, and announcements
        </Typography>
        
        <Box sx={{ display: "flex", justifyContent: "center", gap: 3, mb: 4, flexWrap: "wrap" }}>
          {[
            { icon: <GitHub />, label: "GitHub", url: "https://github.com/qumail" },
            { icon: <Twitter />, label: "Twitter", url: "https://twitter.com/qumail" },
            { icon: <LinkedIn />, label: "LinkedIn", url: "https://linkedin.com/company/qumail" },
            { icon: <Email />, label: "Blog", url: "https://blog.qumail.com" },
            { icon: <Language />, label: "Website", url: "https://qumail.com" }
          ].map((social, index) => (
            <Button
              key={index}
              variant="outlined"
              startIcon={social.icon}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {social.label}
            </Button>
          ))}
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="body2" color="text.secondary">
           {new Date().getFullYear()} Qumail Inc. All rights reserved.
          <br />
          <Link href="#" color="inherit">Privacy Policy</Link> • 
          <Link href="#" color="inherit" sx={{ mx: 1 }}>Terms of Service</Link> • 
          <Link href="#" color="inherit">Cookie Policy</Link>
        </Typography>
      </Paper>
    </Box>
  );
}