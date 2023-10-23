"use client"

import * as React from 'react';
import { Box, Button, Slider, Stack, Typography } from '@mui/material';
import { VolumeDown, VolumeUp } from '@mui/icons-material';
import { useState } from 'react';

let oscillator: OscillatorNode;
let gainContext: GainNode;
let freq = 440;

export default function Page() {
  let audio: AudioContext;
  if (typeof window !== 'undefined') {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    audio = new AudioContext();
  }

  const [volume, setVolume] = useState<number>(30);
  const [gain, setGain] = useState<number>(0.3);
  const [play, setPlay] = useState<boolean>(false);

  const playSound = (command: OscillatorType = 'sine'): void => {
    console.log(command);
    console.log('gain:' + gain);
    if (!play) {
      oscillator = audio.createOscillator();
      gainContext = audio.createGain();
      oscillator.connect(gainContext);
      gainContext.connect(audio.destination);
      oscillator.frequency.value = freq;
      gainContext.gain.value = gain;
      console.log(gainContext);
      oscillator.start();
      setPlay(true);
    }
    oscillator.type = command;
  };

  const stopSound = (): void => {
    if (!play) return;
    oscillator.stop();
  };

  const onChangeVolume = (event: Event, newValue: number | number[]) => {
    const newValume = newValue as number;
    setVolume(newValume);
    console.log('volume:' + newValue);
    setGain(newValume / 100);
    console.log('gain:' + gain);
    if (typeof gainContext !== 'undefined') {
      gainContext.gain.value = gain;
    }
  };

  return (
    <Box>
      <Button onClick={(e) => playSound('sine')}>Sin</Button>
      <Button onClick={(e) => playSound('triangle')}>Triangle</Button>
      <Button onClick={(e) => playSound('square')}>Square</Button>
      <Button onClick={(e) => playSound('sawtooth')}>Sawtooth</Button>
      <Button onClick={(e) => stopSound()}>Stop</Button>

      <Typography style={{ visibility: play ? "visible" : "hidden" }}>Plaing!</Typography>

      <Stack spacing={2} direction="row" sx={{ mb: 1 }} alignItems="center">
        <VolumeDown />
        <Slider aria-label="Default" valueLabelDisplay="auto" value={volume} onChange={onChangeVolume} />
        <VolumeUp />
      </Stack>
    </Box >
  );
}
