import * as React from 'react';
import { SetStateAction, Dispatch, useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { TransitionProps } from '@mui/material/transitions';
import { Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material';
import { Cartridge } from '@/domain/model/nes/cartridge/cartridge';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

type SelectCartridgeDialogProps = {
  handlerChangeCartridge: Dispatch<SetStateAction<Cartridge | null>>
  nowTargetCartridge: Cartridge | null
};

export default function SelectCartridgeDialog(props: SelectCartridgeDialogProps) {
  const [open, setOpen] = React.useState(false);
  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleRemoveCartridge = (cartridge: Cartridge) => {
    if (cartridge.id === props.nowTargetCartridge?.id) {
      alert('現在選択中のカートリッジは削除出来ません。');
      return;
    }

    const newItems = [...cartridges];
    const foundIndex = newItems.findIndex(c => c.id === cartridge.id);
    newItems.splice(foundIndex, 1);
    setCartridges(newItems);

    console.log('cartridges.length:' + newItems.length);

    // TODO 保存。
  }

  const handleAddCartridge = () => {
    alert('TODO Nesファイルの追加。');

    // TODO 保存。
  }

  const handleSelectCartridge = (cartridge: Cartridge) => {
    props.handlerChangeCartridge(cartridge);
    setOpen(false);
  }

  // ---- table contents ----

  interface Column {
    id: 'name' | 'fileName' | 'size' | 'registerTime';
    label: string;
    minWidth?: number;
    align?: 'right';
    format?: (value: number) => string;
  }

  const columns: readonly Column[] = [
    { id: 'name', label: 'Name', minWidth: 170 },
    { id: 'fileName', label: 'Original File Name', minWidth: 200 },
    {
      id: 'size',
      label: 'Size(byte)',
      minWidth: 170,
      align: 'right',
      format: (value: number) => value.toLocaleString('en-US'),
    },
    { id: 'registerTime', label: 'Register Time', minWidth: 170, align: 'right' },
  ];

  function createData(
    id: string,
    name: string,
    fileName: string,
    size: number,
    registerTime: string,
  ): Cartridge {
    return { id, name, fileName, size, registerTime };
  }

  const loadCartridges = () => {
    // TODO 読み出し、以下はサンプルデータ。
    return [
      createData('abc', 'スーパーマリオブラザーズ', 'smb.nes', 128000, '2023/10/24 12:40:11'),
      createData('efg', 'グラディウス', 'gradius.nes', 128000, '2023/10/24 12:40:11'),
    ];
  }

  const [cartridges, setCartridges] = useState(loadCartridges());

  return (
    <div>
      <Button variant="outlined" onClick={handleClickOpen}>
        Select Cartridge...
      </Button>

      <Dialog
        fullScreen
        open={open}
        onClose={handleClose}
        TransitionComponent={Transition}
      >
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              Select Cartrdge(Register & Select NES file)
            </Typography>
          </Toolbar>
        </AppBar>
        <Card sx={{ minWidth: 275 }}>
          <CardContent>
            Register File:
            <TextField id="outlined-basic" label="Name" variant="outlined" />
            <TextField type="file" />
            <Button variant="contained" onClick={handleAddCartridge}>
              Add Cartridge
            </Button>
          </CardContent>
        </Card>
        <TableContainer>
          <Table stickyHeader aria-label="nes files" size="small" >
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align}
                    style={{ minWidth: column.minWidth }}
                  >
                    {column.label}
                  </TableCell>
                ))}
                <TableCell>
                  Trash
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cartridges
                .sort((left, right) => left.name.localeCompare(right.name))
                .map(row =>
                  <TableRow hover role="button" tabIndex={-1} key={row.id} >
                    {columns.map((column) => {
                      const value = row[column.id];
                      return (
                        <TableCell key={column.id} align={column.align} onClick={() => handleSelectCartridge(row)}>
                          {column.format && typeof value === 'number'
                            ? column.format(value)
                            : value}
                        </TableCell>
                      );
                    })}
                    <TableCell key={row.id} align="center">
                      <IconButton
                        edge="start"
                        color="inherit"
                        onClick={() => handleRemoveCartridge(row)}
                        aria-label="close"
                      >
                        <DeleteForeverIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )}
            </TableBody>
          </Table>
        </TableContainer>
      </Dialog>
    </div>
  );
}
