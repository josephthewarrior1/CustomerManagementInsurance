import { Box, Button, Container, Typography } from '@mui/material';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router';

export default function Page404() {
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
                p: 3,
            }}
        >
            <Container maxWidth="sm">
                <Box
                    sx={{
                        textAlign: 'center',
                        py: { xs: 6, md: 8 },
                        px: { xs: 4, md: 6 },
                        borderRadius: '24px',
                        bgcolor: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Box
                        sx={{
                            width: 80,
                            height: 80,
                            borderRadius: '20px',
                            bgcolor: '#EFF6FF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 4,
                            color: '#1971C2',
                        }}
                    >
                        <Icon icon="mdi:alert-circle-outline" width={40} />
                    </Box>

                    <Typography
                        variant="h1"
                        sx={{
                            fontWeight: 900,
                            fontSize: { xs: '6rem', md: '8rem' },
                            lineHeight: 1,
                            background: 'linear-gradient(45deg, #1971C2, #0D47A1)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 2,
                            letterSpacing: '-0.02em',
                        }}
                    >
                        404
                    </Typography>

                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 700,
                            color: '#1C1E21',
                            mb: 1.5,
                        }}
                    >
                        Halaman Tidak Ditemukan
                    </Typography>

                    <Typography
                        variant="body1"
                        sx={{
                            color: '#606770',
                            mb: 4,
                            lineHeight: 1.6,
                        }}
                    >
                        Oops! Halaman yang Anda cari telah dipindahkan, dihapus, atau tidak pernah ada. Silakan kembali ke dashboard utama.
                    </Typography>

                    <Button
                        variant="contained"
                        onClick={() => navigate('/')}
                        startIcon={<Icon icon="mdi:home-outline" width={20} />}
                        sx={{
                            borderRadius: '12px',
                            py: 1.5,
                            px: 4,
                            textTransform: 'none',
                            fontSize: 15,
                            fontWeight: 700,
                            bgcolor: '#1971C2',
                            boxShadow: '0 10px 20px -5px rgba(25, 113, 194, 0.3)',
                            transition: 'all 0.2s',
                            '&:hover': {
                                bgcolor: '#145EA8',
                                boxShadow: '0 10px 25px -5px rgba(25, 113, 194, 0.4)',
                                transform: 'translateY(-1px)',
                            },
                            '&:active': {
                                transform: 'translateY(0)',
                            },
                        }}
                    >
                        Kembali ke Dashboard
                    </Button>
                </Box>
            </Container>
        </Box>
    );
}

