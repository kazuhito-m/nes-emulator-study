"use client"

import * as React from 'react';
import { Box, Button, Slider, Stack, Typography } from '@mui/material';
import { VolumeDown, VolumeUp } from '@mui/icons-material';
import { useState } from 'react';

const OSCILLATOR_TYPES: OscillatorType[] = ["sine", "square", "triangle", "sawtooth"];

let oscillator: OscillatorNode;
let gainContext: GainNode;

export default function Page() {
  let audio: AudioContext;
  if (typeof window !== 'undefined') {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    audio = new AudioContext();
  }

  const [volume, setVolume] = useState<number>(30);
  const [gain, setGain] = useState<number>(0.3);
  const [play, setPlay] = useState<boolean>(false);
  const [freq, setFreq] = useState<number>(440);

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
    gainContext.disconnect();
    oscillator.disconnect();
    setPlay(false);
  };

  const onChangeVolume = (event: Event, newValue: number | number[]) => {
    const newValume = newValue as number;
    setVolume(newValume);
    setGain(newValume / 100);
    if (typeof gainContext === 'undefined') return;
    gainContext.gain.value = gain;
  };

  const onChangeFrequency = (event: Event, newValue: number | number[]) => {
    const newValume = newValue as number;
    setFreq(newValume);
    if (typeof oscillator === 'undefined') return;
    oscillator.frequency.value = freq;
  };

  return (
    <Box>
      {OSCILLATOR_TYPES.map((type) => {
        return <Button key={type} onClick={(e) => playSound(type)}>{type}</Button>;
      })}
      <Button onClick={(e) => stopSound()}>Stop</Button>

      <Typography style={{ visibility: play ? "visible" : "hidden" }}>Plaing!</Typography>

      <Stack spacing={2} direction="row" sx={{ mb: 1 }} alignItems="center">
        <VolumeDown />
        <Slider aria-label="Default" valueLabelDisplay="auto" value={volume} onChange={onChangeVolume} />
        <VolumeUp />
      </Stack>

      <Stack spacing={2} direction="row" sx={{ mb: 1 }} alignItems="center">
        低
        <Slider aria-label="Default" valueLabelDisplay="auto" min={20} max={1000} value={freq} onChange={onChangeFrequency} />
        高
      </Stack>
    </Box >
  );
}
