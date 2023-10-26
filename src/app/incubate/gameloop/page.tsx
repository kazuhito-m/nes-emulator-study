"use client"

import * as React from 'react';
import { Box, Button, Paper, Slider, Stack, Typography } from '@mui/material';
import { VolumeDown, VolumeUp } from '@mui/icons-material';

export default function Page() {

  const handleRunEmulator = () => {
    alert('Click!');
  };


  return (
    <Box>
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
        <Button onClick={handleRunEmulator}>run emulator</Button>
      </Paper>
    </Box >
  );
}
