"use client"

import * as React from 'react';
import { useState, createRef } from 'react';
import { Box, Button, Grid, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, InputLabel, Select, MenuItem, SelectChangeEvent, FormControl, duration } from '@mui/material';
import { Oscillator } from './osclilator/oscillatori';
import { OscillatorUseRequestAnimationFrame } from './osclilator/requestanimationframe/oscillator-use-requestanimationframe';
import { OscillatorUseSetInterval } from './osclilator/setinterval/oscillator-use-setinterval';
import { EmulatorTestRunner } from './render/emulator-test-runner';
import { SampleNesFile } from './sample-rom/sample-nes-file';

const DEFAULT_FPS = '60';
const BUTTON_TOGGLE_TEXT = ['start', 'stop'];

const oscillators: { [index: string]: Oscillator } = {};
if (typeof window !== 'undefined') {
  oscillators["requestAnimationFrame"] = new OscillatorUseRequestAnimationFrame(window);
  oscillators["setInterval"] = new OscillatorUseSetInterval(window);
}

let runner: EmulatorTestRunner;

interface RunnerPerformanceStatus {
  fps: string;
  count: string;
  oneFProccessAverageTimeMs: string,
  emurator1FProccessAverageTimeMs: string,
  render1FProccessAverageTimeMs: string,
}

export default function Page() {
  const canvasRef = createRef<HTMLCanvasElement>();
  const [inputFpsText, inputFpsTextSet] = useState(DEFAULT_FPS);
  const [isLooping, isLoopingSet] = useState(false);
  const [oscillationAlgo, oscillationAlgoSet] = useState('requestAnimationFrame');
  const [performanceStatus, performanceStatusSet] = useState<RunnerPerformanceStatus>({} as RunnerPerformanceStatus);

  const handleChangeOscillationAlgo = (event: SelectChangeEvent) => {
    inputFpsTextSet(DEFAULT_FPS);;
    oscillationAlgoSet(event.target.value as string);
  };

  const watchFps = (fps: number, count: number) => {
    const MS_PRECISION = 3;
    const emu1FAve = runner.emulatorStopwatch.averageMs();
    const render1FAve = runner.renderStopwatch.averageMs();
    const total1FAve = emu1FAve + render1FAve;
    const nowStatus: RunnerPerformanceStatus = {
      fps: fps.toFixed(MS_PRECISION),
      count: count.toString(),
      oneFProccessAverageTimeMs: total1FAve.toFixed(MS_PRECISION),
      emurator1FProccessAverageTimeMs: emu1FAve.toFixed(MS_PRECISION),
      render1FProccessAverageTimeMs: render1FAve.toFixed(MS_PRECISION)
    }
    performanceStatusSet(nowStatus);
  }

  const [buttonText, buttonTextSet] = useState(BUTTON_TOGGLE_TEXT[0]);

  const handleRunEmulator = async (): Promise<void> => {
    const inputFps = parseInt(inputFpsText, 10);
    if (!inputFps || inputFps <= 0) {
      alert('fpsの書式が不正です。');
      return;
    }

    const oscillator = oscillators[oscillationAlgo];

    if (isLooping) oscillator.stop()
    else {
      const canvas = canvasRef.current;
      if (!canvas) { alert('キャンバスが取得出来ませんでした。処理は実行しません。'); return; }
      try {
        const sampleNesFile = new SampleNesFile();
        const bytes = await sampleNesFile.readBytes();
        runner = new EmulatorTestRunner(canvas, bytes);
        oscillator.start(inputFps, () => runner.stepFrame(), watchFps);
      } catch (e) {
        console.log(e);
        alert(`${e}\nエラーが発生したため、処理は実行しません。`);
        return;
      }
    }

    isLoopingSet(!isLooping);
    buttonTextSet(BUTTON_TOGGLE_TEXT[isLooping ? 0 : 1]);
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
            <canvas ref={canvasRef} width="512" height="480"></canvas>
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
                    <TextField label="FPS" type="number" disabled={isLooping || oscillationAlgo === 'requestAnimationFrame'}
                      value={inputFpsText} onChange={(e) => inputFpsTextSet(e.target.value)} />
                  </TableCell>
                </TableRow>
                <TableRow >
                  <TableCell>

                    <FormControl fullWidth>
                      <InputLabel id="demo-simple-select-label">Oscillation Algolism</InputLabel>
                      <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        value={oscillationAlgo}
                        label="Age"
                        onChange={handleChangeOscillationAlgo}
                      >
                        <MenuItem value="requestAnimationFrame">requestAnimationFrame</MenuItem>
                        <MenuItem value="setInterval">setInterval</MenuItem>
                      </Select>
                    </FormControl>

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
                  <TableCell>{performanceStatus.fps}</TableCell>
                </TableRow>
                <TableRow >
                  <TableCell>Loop Count</TableCell>
                  <TableCell>{performanceStatus.count}</TableCell>
                </TableRow >
                <TableRow >
                  <TableCell>1F Prossess(ms)</TableCell>
                  <TableCell>{performanceStatus.oneFProccessAverageTimeMs}</TableCell>
                </TableRow >
                <TableRow >
                  <TableCell>Emulator 1F Prossess(ms)</TableCell>
                  <TableCell>{performanceStatus.emurator1FProccessAverageTimeMs}</TableCell>
                </TableRow >
                <TableRow >
                  <TableCell>Render 1F Prossess(ms)</TableCell>
                  <TableCell>{performanceStatus.render1FProccessAverageTimeMs}</TableCell>
                </TableRow >
                <TableRow >
                  <TableCell>Idial FPS</TableCell>
                  <TableCell>{inputFpsText}</TableCell>
                </TableRow >
                <TableRow >
                  <TableCell>Idial Interval(ms)</TableCell>
                  <TableCell>{(inputFpsText) ? (1000 / parseInt(inputFpsText)).toFixed(3) : ''}</TableCell>
                </TableRow >
              </TableBody>
            </Table>

          </Paper>
        </Grid>
      </Grid>
    </Box >
  );
}
