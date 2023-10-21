"use client"

import * as React from 'react';
import { Box, Button } from '@mui/material';

const onClickExecute = () => {
  console.log('実行押された！');
}

export default function Page() {
  return (
    <Box>
      <Button onClick={onClickExecute}>実行</Button>
    </Box >
  );
}
