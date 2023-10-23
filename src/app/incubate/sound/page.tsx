"use client"

import * as React from 'react';
import { Box, Button, Slider, Stack, Typography } from '@mui/material';
import { VolumeDown, VolumeUp } from '@mui/icons-material';
import { useState } from 'react';

let oscillator: OscillatorNode;
let gainCtx: GainNode;
let freq = 440;

export default function Page() {
  let audioCtx: AudioContext;
  if (typeof window !== 'undefined') {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }

  const [volume, setVolume] = useState<number>(30);
  const [gain, setGain] = useState<number>(0.3);
  const [play, setPlay] = useState<boolean>(false);

  const playOsc = (command: OscillatorType = 'sine'): void => {
    console.log(command);
    console.log('gain:' + gain);
    if (!play) {
      oscillator = audioCtx.createOscillator();
      gainCtx = audioCtx.createGain();
      oscillator.connect(gainCtx);
      gainCtx.connect(audioCtx.destination);
      oscillator.frequency.value = freq;
      gainCtx.gain.value = gain;
      console.log(gainCtx);
      oscillator.start();
      setPlay(true);
    }
    oscillator.type = command;
  };

  const stopOsc = (): void => {
    if (!play) return;
    oscillator.stop();
    setPlay(false);
  };

  const onChangeVolume = (event: Event, newValue: number | number[]) => {
    const newValume = newValue as number;
    setVolume(newValume);
    console.log('volume:' + newValue);
    setGain(newValume / 100);
    console.log('gain:' + gain);
    if (typeof gainCtx !== 'undefined') {
      gainCtx.gain.value = gain;
    }
    stopOsc();
  };

  return (
    <Box>
      <Button onClick={(e) => playOsc('sine')}>Sin</Button>
      <Button onClick={(e) => playOsc('triangle')}>Triangle</Button>
      <Button onClick={(e) => playOsc('square')}>Square</Button>
      <Button onClick={(e) => playOsc('sawtooth')}>Sawtooth</Button>
      <Button onClick={(e) => stopOsc()}>Stop</Button>

      <Typography style={{ visibility: play ? "visible" : "hidden" }}>Plaing!</Typography>

      <Stack spacing={2} direction="row" sx={{ mb: 1 }} alignItems="center">
        <VolumeDown />
        <Slider aria-label="Default" valueLabelDisplay="auto" value={volume} onChange={onChangeVolume} />
        <VolumeUp />
      </Stack>
    </Box >
  );
}
