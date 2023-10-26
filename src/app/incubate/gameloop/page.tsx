"use client"

import * as React from 'react';
import { useState } from 'react';
import { Box, Button, Grid, Paper, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { OscillatorUseSetInterval } from './oscillator-use-setinterval';

const IDEAL_FPX = 60;
const IDEAL_INTERVAL_MS = 1000 / IDEAL_FPX;

let oscillator = {} as OscillatorUseSetInterval;
if (typeof window !== 'undefined') oscillator = new OscillatorUseSetInterval(window);

const togleText = ['start', 'stop'];

export default function Page() {
  const [fpsText, fpsTextSet] = useState('');
  const [countText, countTextSet] = useState('');

  const watchFps = (fps: number, count: number) => {
    fpsTextSet(fps.toFixed(3));
    countTextSet(count.toString());
  }

  const [buttonText, buttonTextSet] = useState(togleText[0]);

  const handleRunEmulator = () => {
    buttonTextSet(togleText.find(i => i !== buttonText) as string);
    if (oscillator.isStarted()) oscillator.stop()
    else oscillator.start(IDEAL_FPX, () => { }, watchFps);
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
                  <TableCell>FPS</TableCell>
                </TableRow>
                <TableRow >
                  <TableCell>
                    <Button onClick={handleRunEmulator}>{buttonText} loop</Button>
                  </TableCell>
                </TableRow >
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
                  <TableCell>{IDEAL_INTERVAL_MS}</TableCell>
                </TableRow >              </TableBody>
            </Table>

          </Paper>
        </Grid>
      </Grid>
    </Box >
  );
}
