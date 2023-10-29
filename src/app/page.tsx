"use client"

import * as React from 'react';
import { useState, useEffect } from 'react';
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
import { Cartridge } from '@/domain/model/nes/cartridge/cartridge';

export default function Home() {
  // TODO キーボード周りの入力系は、今かなりやっつけなので、整理・分離したい。
  const padOne = new KeyboardOne();
  const [padUp, padUpSet] = useState(false);
  const [padDown, padDownSet] = useState(false);
  const [padLeft, padLeftSet] = useState(false);
  const [padRight, padRightSet] = useState(false);
  const [padA, padASet] = useState(false);
  const [padB, padBSet] = useState(false);
  const [padSelect, padSelectSet] = useState(false);
  const [padStart, padStartSet] = useState(false);
  if (typeof window !== 'undefined') {
    const changeKeyState = (key: string, state: boolean): void => {
      switch (key.toLowerCase()) {
        case 'arrowup':
          if (padUp === state) return;
          padUpSet(state);
          padOne.up = state;
          break;
        case 'arrowdown':
          if (padDown === state) return;
          padDownSet(state);
          padOne.down = state;
          break;
        case 'arrowleft':
          if (padLeft === state) return;
          padLeftSet(state);
          padOne.left = state;
          break;
        case 'arrowright':
          if (padRight === state) return;
          padRightSet(state);
          padOne.right = state;
          break;
        case 'a':
          if (padA === state) return;
          padASet(state);
          padOne.a = state;
          break;
        case 'b':
          if (padB === state) return;
          padBSet(state);
          padOne.b = state;
          break;
        case 'l':
          if (padSelect === state) return;
          padSelectSet(state);
          padOne.select = state;
          break;
        case 'r':
          if (padStart === state) return;
          padStartSet(state);
          padOne.start = state;
          break;
        default:
          return;
      }
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

  const [targetCartridge, targetCartridgeSet] = useState<Cartridge | null>(null);
  useEffect(() => console.log("カートリッジが変更されました。cartridge: " + targetCartridge?.name), [targetCartridge]);

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
                <SelectCartridgeDialog
                  handlerChangeCartridge={targetCartridgeSet}
                  nowTargetCartridge={targetCartridge}
                />
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
                      <TableCell>Cartridge Name</TableCell>
                      <TableCell>{targetCartridge?.name}</TableCell>
                      <TableCell>Original File Name</TableCell>
                      <TableCell>{targetCartridge?.fileName}</TableCell>
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
