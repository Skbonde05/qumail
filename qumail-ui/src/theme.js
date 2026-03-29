import { createTheme, alpha } from "@mui/material/styles";

export const THEME_CONFIGS = {
  default: {
    primary: { light: "#1a73e8", dark: "#60a5fa" },
    secondary: { light: "#1e293b", dark: "#cbd5e1" }
  },
  midnight: {
    primary: { light: "#1e293b", dark: "#60a5fa" },
    secondary: { light: "#0f172a", dark: "#94a3b8" }
  },
  black: {
    primary: { light: "#000000", dark: "#cbd5e1" },
    secondary: { light: "#000000", dark: "#94a3b8" }
  },
  sunset: {
    primary: { light: "#f59e0b", dark: "#fbbf24" },
    secondary: { light: "#ea580c", dark: "#f97316" }
  },
  forest: {
    primary: { light: "#10b981", dark: "#34d399" },
    secondary: { light: "#065f46", dark: "#059669" }
  },
  lavender: {
    primary: { light: "#8b5cf6", dark: "#a78bfa" },
    secondary: { light: "#6d28d9", dark: "#7c3aed" }
  }
};

export const getTheme = (mode, themeName = 'default', hasBgImage = false) => {
  const config = THEME_CONFIGS[themeName] || THEME_CONFIGS.default;
  const isDark = mode === "dark";
  
  const glassStyle = {
    backgroundColor: hasBgImage 
      ? (isDark ? alpha("#0a0e14", 0.4) : alpha("#ffffff", 0.4))
      : (isDark ? alpha("#141b26", 0.7) : alpha("#ffffff", 0.7)),
    backdropFilter: "blur(16px) saturate(180%)",
    WebkitBackdropFilter: "blur(16px) saturate(180%)",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
  };

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? config.primary.dark : config.primary.light,
        contrastText: "#ffffff"
      },
      secondary: {
        main: isDark ? config.secondary.dark : config.secondary.light
      },
      success: {
        main: "#2563eb",
        light: "#dbeafe",
        dark: "#1e40af"
      },
      error: {
        main: "#000000",
        light: "#f1f5f9",
        dark: "#000000"
      },
      warning: {
        main: "#1e293b",
        light: "#f8fafc",
        dark: "#0f172a"
      },
      info: {
        main: isDark ? "#38bdf8" : "#0ea5e9"
      },
      background: {
        default: isDark 
          ? (themeName === 'default' ? "#0a0e14" : alpha(config.primary.dark, 0.03)) 
          : (themeName === 'default' ? "#f8fafc" : alpha(config.primary.light, 0.02)),
        paper: hasBgImage 
          ? (isDark ? alpha("#141b26", 0.4) : alpha("#ffffff", 0.4))
          : (isDark 
              ? (themeName === 'default' ? "#141b26" : alpha(config.primary.dark, 0.08)) 
              : (themeName === 'default' ? "#ffffff" : alpha(config.primary.light, 0.03)))
      },
      text: {
        primary: hasBgImage 
          ? (isDark ? "#ffffff" : "#000000") 
          : (isDark 
              ? alpha("#f1f5f9", 0.95) 
              : (themeName === 'default' ? "#1e293b" : alpha(config.primary.light, 0.9))),
        secondary: hasBgImage 
          ? (isDark ? alpha("#ffffff", 0.8) : alpha("#000000", 0.7))
          : (isDark 
              ? alpha("#94a3b8", 0.9) 
              : (themeName === 'default' ? "#64748b" : alpha(config.primary.light, 0.6))),
        disabled: isDark ? "#4b5563" : "#9ca3af"
      },
      divider: isDark 
        ? (themeName === 'default' ? "rgba(255,255,255,0.08)" : alpha(config.primary.dark, 0.1)) 
        : (themeName === 'default' ? "rgba(0,0,0,0.08)" : alpha(config.primary.light, 0.08)),
      action: {
        hover: isDark ? alpha(config.primary.dark, 0.12) : alpha(config.primary.light, 0.04),
        selected: isDark ? alpha(config.primary.dark, 0.18) : alpha(config.primary.light, 0.08),
        disabled: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"
      }
    },

    typography: {
      fontFamily: '"Inter", "system-ui", "-apple-system", sans-serif',
      h1: {
        fontSize: '3.5rem',
        fontWeight: 800,
        lineHeight: 1.1,
        letterSpacing: '-0.03em'
      },
      h2: {
        fontSize: '2.5rem',
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.02em'
      },
      h3: {
        fontSize: '2rem',
        fontWeight: 700,
        lineHeight: 1.3,
        letterSpacing: '-0.01em'
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.5
      },
      h6: {
        fontSize: '1.125rem',
        fontWeight: 600,
        lineHeight: 1.6
      },
      subtitle1: {
        fontWeight: 600,
        fontSize: '1rem'
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
        letterSpacing: '0.01em'
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
        letterSpacing: '0.01em'
      },
      button: {
        fontWeight: 600,
        textTransform: 'none',
        letterSpacing: '0.02em'
      },
      caption: {
        fontSize: '0.75rem',
        lineHeight: 1.5,
        fontWeight: 500
      }
    },

    shape: {
      borderRadius: 12
    },

    shadows: isDark ? [
      "none",
      "0 1px 2px 0 rgba(0, 0, 0, 0.5)",
      "0 1px 3px 0 rgba(0, 0, 0, 0.5), 0 1px 2px -1px rgba(0, 0, 0, 0.5)",
      "0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5)",
      "0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.5)",
      "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
      "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
      ...Array(18).fill("none")
    ] : [
      "none",
      "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
      "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
      ...Array(18).fill("none")
    ],

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDark ? "#0a0e14" : "#f8fafc",
            transition: "all 0.3s ease",
            ...(hasBgImage && {
              color: isDark ? "#ffffff" : "#000000",
              "& *": {
                textShadow: isDark 
                  ? "0 1px 2px rgba(0,0,0,0.4)" 
                  : "0 1px 1px rgba(255,255,255,0.4)"
              }
            }),
            "&::-webkit-scrollbar": {
              width: "10px",
              height: "10px"
            },
            "&::-webkit-scrollbar-track": {
              background: isDark ? "#0f172a" : "#f1f5f9"
            },
            "&::-webkit-scrollbar-thumb": {
              background: isDark ? "#334155" : "#cbd5e1",
              borderRadius: "5px",
              border: `2px solid ${isDark ? "#0f172a" : "#f1f5f9"}`,
              "&:hover": {
                background: isDark ? "#475569" : "#94a3b8"
              }
            }
          }
        }
      },

      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            borderRadius: 16,
            transition: "box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out, background-color 0.3s ease",
            ...(hasBgImage && {
              backgroundColor: isDark ? alpha("#141b26", 0.4) : alpha("#ffffff", 0.4),
              backdropFilter: "blur(16px) saturate(180%)",
              WebkitBackdropFilter: "blur(16px) saturate(180%)",
            })
          },
          elevation1: {
            boxShadow: isDark ? "0 4px 6px -1px rgba(0, 0, 0, 0.3)" : "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
          }
        }
      },

      MuiAppBar: {
        styleOverrides: {
          root: {
            ...glassStyle,
            color: isDark ? "#f1f5f9" : "#1e293b",
            boxShadow: "none",
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`
          }
        }
      },

      MuiDrawer: {
        styleOverrides: {
          paper: {
            ...glassStyle,
            borderRight: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`
          }
        }
      },

      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: "10px",
            padding: "8px 20px",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:active": {
              transform: "scale(0.96)"
            }
          },
          contained: {
            boxShadow: "none",
            "&:hover": {
              boxShadow: isDark 
                ? `0 6px 16px ${alpha(config.primary.dark, 0.4)}` 
                : `0 6px 16px ${alpha(config.primary.light, 0.2)}`,
              transform: "translateY(-1px)",
              filter: "brightness(1.05)"
            }
          },
          outlined: {
            borderColor: isDark ? alpha("#ffffff", 0.1) : alpha("#000000", 0.1),
            "&:hover": {
              backgroundColor: isDark ? alpha(config.primary.dark, 0.1) : alpha(config.primary.light, 0.05)
            }
          }
        }
      },

      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: "10px",
              transition: "all 0.2s ease",
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: isDark ? alpha("#ffffff", 0.2) : alpha("#000000", 0.2)
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderWidth: "1.5px"
              }
            }
          }
        }
      },

      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            overflow: "hidden",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            boxShadow: isDark ? "0 10px 30px -10px rgba(0,0,0,0.5)" : "0 10px 30px -10px rgba(0,0,0,0.05)"
          }
        }
      },

      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: "10px",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              backgroundColor: isDark ? alpha(config.primary.dark, 0.12) : alpha(config.primary.light, 0.08),
              transform: "translateY(-1px)"
            },
            "&:active": {
              transform: "scale(0.92)"
            }
          }
        }
      },

      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: "10px",
            margin: "2px 8px",
            transition: "all 0.2s ease",
            "&.Mui-selected": {
              backgroundColor: isDark ? alpha(config.primary.dark, 0.15) : alpha(config.primary.light, 0.08),
              color: isDark ? config.primary.dark : config.primary.light,
              "& .MuiListItemIcon-root": {
                color: isDark ? config.primary.dark : config.primary.light,
              },
              "&:hover": {
                backgroundColor: isDark ? alpha(config.primary.dark, 0.2) : alpha(config.primary.light, 0.12),
              }
            }
          }
        }
      },

      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 24,
            ...glassStyle,
            boxShadow: isDark ? "0 25px 50px -12px rgba(0, 0, 0, 0.7)" : "0 25px 50px -12px rgba(0, 0, 0, 0.15)"
          }
        }
      },

      MuiAvatar: {
        styleOverrides: {
          root: {
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }
        }
      }
    }
  });
};

export const lightTheme = getTheme('light');
export const darkTheme = getTheme('dark');