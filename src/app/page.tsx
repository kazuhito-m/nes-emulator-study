"use client"

import * as React from 'react';
import { Box, CssBaseline, Grid, Link, Paper, Toolbar } from '@mui/material';
import MuiAppBar from '@mui/material/AppBar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

export default function Home() {
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <MuiAppBar position="absolute">
        <Toolbar
          sx={{
            pr: '24px', // keep right padding when drawer closed
          }}
        >
          <Typography
            component="h1"
            variant="h6"
            color="inherit"
            noWrap
            sx={{ flexGrow: 1 }}
          >
            NES Emulator on Web
          </Typography>
        </Toolbar>
      </MuiAppBar>

      <Box
        component="main"
        sx={{
          backgroundColor: (theme) => theme.palette.grey[300],
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
        }}
      >
        <Toolbar />

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Grid container spacing={3}>

            <Grid item xs={12} md={8} lg={8}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 500,
                }}
              >
                Game Monitor
              </Paper>
            </Grid>

            <Grid item xs={12} md={4} lg={4}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 500,
                }}
              >
                Controll Panel
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                Status Pameters
                <Table size="small">
                  <TableBody>
                    <TableRow >
                      <TableCell>paramA</TableCell>
                      <TableCell>x</TableCell>
                      <TableCell>paramB</TableCell>
                      <TableCell>y</TableCell>
                    </TableRow>
                    <TableRow >
                      <TableCell>paramC</TableCell>
                      <TableCell>z</TableCell>
                      <TableCell>paramD</TableCell>
                      <TableCell>999</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Paper>
            </Grid>

          </Grid>
        </Container>
      </Box>
    </Box>
  );
}
