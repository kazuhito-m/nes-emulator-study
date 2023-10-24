"use client"

import * as React from 'react';
import { useState } from 'react';
import { Box, CssBaseline, Grid, Paper, Toolbar } from '@mui/material';
import MuiAppBar from '@mui/material/AppBar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { KeyboardOne } from '@/presentation/input/keybord-one';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import SelectCartridgeDialog from './controll-panel/select-cartridge-dialog';

export default function Home() {
  // TODO キーボード周りの入力系は、今かなりやっつけなので、整理・分離したい。
  const padOne = new KeyboardOne();
  let [padUp, padUpSet] = useState(false);
  let [padDown, padDownSet] = useState(false);
  let [padLeft, padLeftSet] = useState(false);
  let [padRight, padRightSet] = useState(false);
  let [padA, padASet] = useState(false);
  let [padB, padBSet] = useState(false);
  let [padSelect, padSelectSet] = useState(false);
  let [padStart, padStartSet] = useState(false);
  if (typeof window !== 'undefined') {
    const changeKeyState = (key: string, state: boolean): void => {
      switch (key.toLowerCase()) {
        case 'arrowup':
          if (padUp === state) return;
          padUp = state;
          padUpSet(padUp);
          padOne.up = padUp;
          break;
        case 'arrowdown':
          if (padDown === state) return;
          padDown = state;
          padDownSet(padDown);
          padOne.down = padDown;
          break;
        case 'arrowleft':
          if (padLeft === state) return;
          padLeft = state;
          padLeftSet(padLeft);
          padOne.left = padLeft;
          break;
        case 'arrowright':
          if (padRight === state) return;
          padRight = state;
          padRightSet(padRight);
          padOne.right = padRight;
          break;
        case 'a':
          if (padA === state) return;
          padA = state;
          padASet(padA);
          padOne.a = padA;
          break;
        case 'b':
          if (padB === state) return;
          padB = state;
          padBSet(padB);
          padOne.b = padB;
          break;
        case 'l':
          if (padSelect === state) return;
          padSelect = state;
          padSelectSet(padSelect);
          padOne.select = padSelect;
          break;
        case 'r':
          if (padStart === state) return;
          padStart = state;
          padStartSet(padStart);
          padOne.start = padStart;
          break;
        default:
          return;
      }
      console.log(JSON.stringify(padOne));
    };
    const clearStates = (): void => {
      ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'a', 'b', 'l', 'r',]
        .forEach(k => changeKeyState(k, false));
      console.log(JSON.stringify(padOne));
    };

    const document = window.document;
    document.onkeydown = (e) => changeKeyState(e.key, true);
    document.onkeyup = (e) => changeKeyState(e.key, false);
    window.onblur = () => clearStates();
    window.onfocus = () => clearStates();
  }

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
                  height: 550,
                }}
              >
                <div>Game Monitor</div>
                <canvas width="512" height="480"></canvas>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4} lg={4}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 550,
                }}
              >
                <div>Controll Panel</div>
                <SelectCartridgeDialog />
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                Status Pameters

                <Table size="small">
                  <TableBody>
                    <TableRow >
                      <TableCell>Input Status:</TableCell>
                      <TableCell>{padUp ? '↑' : ' '}</TableCell>
                      <TableCell>{padDown ? '↓' : ' '}</TableCell>
                      <TableCell>{padLeft ? '←' : ' '}</TableCell>
                      <TableCell>{padRight ? '→' : ' '}</TableCell>
                      <TableCell>{padB ? 'B' : ' '}</TableCell>
                      <TableCell>{padA ? 'A' : ' '}</TableCell>
                      <TableCell>{padSelect ? 'SELECT' : ' '}</TableCell>
                      <TableCell>{padStart ? 'START' : ' '}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

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
    </Box >
  );
}
