"use client"

import * as React from 'react';
import { useState } from 'react';
import { Box, Button, Grid, Paper, Slider, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

const IDEAL_FPX = 60;
const IDEAL_INTERVAL_MS = 1000 / IDEAL_FPX;

let count = 0;
let startTime: Date;

let lastWatchTotalCount = 0;
let lastWatch: Date;

let frameIId = 0;
let watchIId = 0;
const togleText = ['start', 'stop'];

export default function Page() {
  const frameProcess = () => {
    count++;
  }

  const [fpsText, fpsTextSet] = useState('');
  const [countText, countTextSet] = useState('');

  const watchProcess = () => {
    const now = new Date();
    const nowIntervalCount = count - lastWatchTotalCount;
    const intavalMs = now.getTime() - lastWatch.getTime();
    const fps = nowIntervalCount / intavalMs * 1000;
    const text = fps.toFixed(3);
    fpsTextSet(fps.toFixed(3));
    countTextSet(count.toString());

    lastWatchTotalCount = count;
    lastWatch = now;
  }

  const [buttonText, buttonTextSet] = useState(togleText[0]);

  const handleRunEmulator = () => {
    buttonTextSet(togleText.find(i => i !== buttonText) as string);

    if (frameIId !== 0) {
      window.clearInterval(frameIId);
      window.clearInterval(watchIId);
      frameIId = 0;
      watchIId = 0;
      return;
    }

    count = 0;
    startTime = new Date();
    lastWatchTotalCount = 0;
    lastWatch = startTime;

    frameIId = window.setInterval(frameProcess, IDEAL_INTERVAL_MS);
    watchIId = window.setInterval(watchProcess, 1000);
  };

  return (
    <Box>
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
            <Button onClick={handleRunEmulator}>{buttonText} loop</Button>
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
