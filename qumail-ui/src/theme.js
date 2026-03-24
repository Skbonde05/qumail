import { createTheme } from "@mui/material/styles";

export const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,

      primary: {
        main: mode === "dark" ? "#60a5fa" : "#2563eb",
        light: mode === "dark" ? "#93c5fd" : "#dbeafe",
        dark: mode === "dark" ? "#1d4ed8" : "#1e3a8a"
      },

      secondary: {
        main: mode === "dark" ? "#a78bfa" : "#7c3aed"
      },

      success: {
        main: "#22c55e",
        light: "#bbf7d0",
        dark: "#15803d"
      },

      error: {
        main: "#ef4444",
        light: "#fecaca",
        dark: "#b91c1c"
      },

      warning: {
        main: "#f59e0b",
        light: "#fde68a",
        dark: "#b45309"
      },

      info: {
        main: mode === "dark" ? "#38bdf8" : "#0ea5e9"
      },

      background: {
        default: mode === "dark" ? "#020617" : "#f8fafc",
        paper: mode === "dark" ? "#0f172a" : "#ffffff"
      },

      text: {
        primary: mode === "dark" ? "#f1f5f9" : "#0f172a",
        secondary: mode === "dark" ? "#cbd5e1" : "#475569",
        disabled: mode === "dark" ? "#64748b" : "#94a3b8"
      },

      divider: mode === "dark"
        ? "rgba(255,255,255,0.12)"
        : "rgba(0,0,0,0.12)",

      action: {
        hover: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
        selected: mode === "dark" ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.08)",
        disabled: mode === "dark" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.26)"
      }
    },

    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
        lineHeight: 1.2
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
        lineHeight: 1.3
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
        lineHeight: 1.4
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.5
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.6
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 600,
        lineHeight: 1.7
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6
      },
      caption: {
        fontSize: '0.75rem',
        lineHeight: 1.5
      }
    },

    shape: {
      borderRadius: 8
    },

    shadows: mode === "dark" ? [
      "none",
      "0px 1px 2px rgba(0,0,0,0.24)",
      "0px 2px 4px rgba(0,0,0,0.24)",
      "0px 4px 8px rgba(0,0,0,0.24)",
      "0px 8px 16px rgba(0,0,0,0.24)",
      "0px 16px 32px rgba(0,0,0,0.24)",
      "0px 24px 48px rgba(0,0,0,0.24)",
      "0px 32px 64px rgba(0,0,0,0.24)",
      "0px 40px 80px rgba(0,0,0,0.24)",
      "0px 48px 96px rgba(0,0,0,0.24)",
      "0px 56px 112px rgba(0,0,0,0.24)",
      "0px 64px 128px rgba(0,0,0,0.24)",
      "0px 72px 144px rgba(0,0,0,0.24)",
      "0px 80px 160px rgba(0,0,0,0.24)",
      "0px 88px 176px rgba(0,0,0,0.24)",
      "0px 96px 192px rgba(0,0,0,0.24)",
      "0px 104px 208px rgba(0,0,0,0.24)",
      "0px 112px 224px rgba(0,0,0,0.24)",
      "0px 120px 240px rgba(0,0,0,0.24)",
      "0px 128px 256px rgba(0,0,0,0.24)",
      "0px 136px 272px rgba(0,0,0,0.24)",
      "0px 144px 288px rgba(0,0,0,0.24)",
      "0px 152px 304px rgba(0,0,0,0.24)",
      "0px 160px 320px rgba(0,0,0,0.24)",
      "0px 168px 336px rgba(0,0,0,0.24)"
    ] : [
      "none",
      "0px 1px 2px rgba(0,0,0,0.05)",
      "0px 1px 3px rgba(0,0,0,0.1)",
      "0px 1px 8px rgba(0,0,0,0.1)",
      "0px 2px 16px rgba(0,0,0,0.1)",
      "0px 3px 24px rgba(0,0,0,0.1)",
      "0px 4px 32px rgba(0,0,0,0.1)",
      "0px 5px 40px rgba(0,0,0,0.1)",
      "0px 6px 48px rgba(0,0,0,0.1)",
      "0px 7px 56px rgba(0,0,0,0.1)",
      "0px 8px 64px rgba(0,0,0,0.1)",
      "0px 9px 72px rgba(0,0,0,0.1)",
      "0px 10px 80px rgba(0,0,0,0.1)",
      "0px 11px 88px rgba(0,0,0,0.1)",
      "0px 12px 96px rgba(0,0,0,0.1)",
      "0px 13px 104px rgba(0,0,0,0.1)",
      "0px 14px 112px rgba(0,0,0,0.1)",
      "0px 15px 120px rgba(0,0,0,0.1)",
      "0px 16px 128px rgba(0,0,0,0.1)",
      "0px 17px 136px rgba(0,0,0,0.1)",
      "0px 18px 144px rgba(0,0,0,0.1)",
      "0px 19px 152px rgba(0,0,0,0.1)",
      "0px 20px 160px rgba(0,0,0,0.1)",
      "0px 21px 168px rgba(0,0,0,0.1)",
      "0px 22px 176px rgba(0,0,0,0.1)"
    ],

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: "inherit",
            transition: "background-color 0.3s ease"
          },
          "&::-webkit-scrollbar": {
            width: "8px",
            height: "8px"
          },
          "&::-webkit-scrollbar-track": {
            background: mode === "dark" ? "#0f172a" : "#f1f5f9"
          },
          "&::-webkit-scrollbar-thumb": {
            background: mode === "dark" ? "#475569" : "#cbd5e1",
            borderRadius: "4px",
            "&:hover": {
              background: mode === "dark" ? "#64748b" : "#94a3b8"
            }
          }
        }
      },

      MuiTypography: {
        styleOverrides: {
          root: {
            color: "inherit"
          }
        }
      },

      MuiSvgIcon: {
        styleOverrides: {
          root: {
            color: "inherit"
          }
        }
      },

      MuiIconButton: {
        styleOverrides: {
          root: {
            color: "inherit",
            transition: "all 0.2s ease",
            "&:hover": {
              transform: "scale(1.05)"
            }
          }
        }
      },

      MuiInputBase: {
        styleOverrides: {
          root: {
            color: "inherit",
            "&::before": {
              borderBottom: `1px solid ${mode === "dark" ? "#475569" : "#cbd5e1"}`
            }
          }
        }
      },

      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: "text.primary",
            borderRadius: "6px",
            margin: "2px 8px",
            padding: "8px 12px",
            "&:hover": {
              backgroundColor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)"
            },
            "&.Mui-selected": {
              backgroundColor: mode === "dark" ? "rgba(96,165,250,0.16)" : "rgba(37,99,235,0.08)",
              "&:hover": {
                backgroundColor: mode === "dark" ? "rgba(96,165,250,0.24)" : "rgba(37,99,235,0.12)"
              }
            }
          }
        }
      },

      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 500,
            borderRadius: "8px",
            transition: "all 0.2s ease"
          },
          contained: {
            boxShadow: mode === "dark" 
              ? "0 1px 2px 0 rgba(0,0,0,0.24)" 
              : "0 1px 2px 0 rgba(0,0,0,0.05)"
          }
        }
      },

      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none"
          }
        }
      },

      MuiAvatar: {
        styleOverrides: {
          root: {
            fontWeight: 600
          }
        }
      }
    }
  });

export const lightTheme = getTheme('light');
export const darkTheme = getTheme('dark');