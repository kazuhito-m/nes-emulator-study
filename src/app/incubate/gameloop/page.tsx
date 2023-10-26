"use client"

import * as React from 'react';
import { useState } from 'react';
import { Box, Button, Grid, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { OscillatorUseSetInterval } from './osclilator/oscillator-use-setinterval';

let oscillator = {} as OscillatorUseSetInterval;
if (typeof window !== 'undefined') oscillator = new OscillatorUseSetInterval(window);

const togleText = ['start', 'stop'];

export default function Page() {
  const [fpsText, fpsTextSet] = useState('');
  const [countText, countTextSet] = useState('');
  const [inputFpsText, inputFpsTextSet] = useState('60');
  const [isLooping, isLoopingSet] = useState(false);

  const watchFps = (fps: number, count: number) => {
    fpsTextSet(fps.toFixed(3));
    countTextSet(count.toString());
  }

  const [buttonText, buttonTextSet] = useState(togleText[0]);

  const handleRunEmulator = () => {
    const inputFps = parseInt(inputFpsText, 10);
    if (!inputFps || inputFps <= 0) {
      alert('fpsの書式が不正です。');
      return;
    }

    if (isLooping) oscillator.stop()
    else oscillator.start(inputFps, () => { }, watchFps);

    isLoopingSet(!isLooping);
    buttonTextSet(togleText[isLooping ? 0 : 1]);
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={6}>
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
        <Grid item xs={12} md={3} lg={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 550,
            }}
          >
            <div>Run Parameter</div>

            <Table size="small">
              <TableBody>
                <TableRow >
                  <TableCell>
                    <Button onClick={handleRunEmulator}>{buttonText} loop</Button>
                  </TableCell>
                </TableRow >
                <TableRow >
                  <TableCell>
                    <TextField label="FPS" type="number" disabled={isLooping}
                      value={inputFpsText} onChange={(e) => inputFpsTextSet(e.target.value)} />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

          </Paper>
        </Grid>
        <Grid item xs={12} md={3} lg={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 550,
            }}
          >
            <div>Run Status</div>

            <Table size="small">
              <TableHead>
                <TableRow >
                  <TableCell>Name</TableCell>
                  <TableCell>Value</TableCell>
                </TableRow >
              </TableHead>
              <TableBody>
                <TableRow >
                  <TableCell>FPS</TableCell>
                  <TableCell>{fpsText}</TableCell>
                </TableRow>
                <TableRow >
                  <TableCell>Loop Count</TableCell>
                  <TableCell>{countText}</TableCell>
                </TableRow >
                <TableRow >
                  <TableCell>Idial Interval(ms)</TableCell>
                  <TableCell>{inputFpsText}</TableCell>
                </TableRow >              </TableBody>
            </Table>

          </Paper>
        </Grid>
      </Grid>
    </Box >
  );
}