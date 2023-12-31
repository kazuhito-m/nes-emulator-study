"use client"

import * as React from 'react';
import { SetStateAction, Dispatch, useState, useEffect, ChangeEvent, useRef } from 'react';
import {
  AppBar,
  Button,
  Card,
  CardContent,
  Dialog,
  IconButton,
  Slide,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import CloseIcon from '@mui/icons-material/Close';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import LZString from 'lz-string';
import { Cartridge } from '@/domain/model/nes/cartridge/cartridge';
import { BinaryAndTextMutualConverter } from '@/domain/model/nes/cartridge/binary-text-mutual-converter';
import { StorageRepository } from '@/domain/model/storage/storage-repository';
import { StorageDatasource } from '@/infrastructure/datasource/storage/storage-datasource';


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
  const repository: StorageRepository = new StorageDatasource();

  const [open, setOpen] = useState(false);
  const [cartridges, setCartridges] = useState<Cartridge[]>([]);
  const [newCartridgeName, setNewCartridgeName] = useState('');
  const [newCartridgeFile, setNewCartridgeFile] = useState<File | null>(null);
  const [disableAddCartridge, setDisableAddCartridge] = useState(true);
  useEffect(() => console.log(newCartridgeFile), [newCartridgeFile]);
  const newCartridgeFileRef: any = useRef();

  const handleClickOpen = () => {
    setCartridges(repository.getCartridges())
    setOpen(true);
  }

  const handleClose = () => {
    clearNewCartridgeInput();
    setOpen(false);
  }

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

    repository.registerCartridges(newItems);
  }

  const handleAddCartridge = async () => {
    const file = newCartridgeFile as File;

    const binary = await file.arrayBuffer();
    if (!binary) {
      alert(`ファイルの読み込みに失敗しました。 path:${file.name}`)
      return;
    }

    const converter = new BinaryAndTextMutualConverter();

    const base64Text = converter.encodeBinaryToBase64Text(binary);
    const compressedText = LZString.compress(base64Text);

    const cartridge: Cartridge = {
      id: crypto.randomUUID(),
      name: newCartridgeName,
      fileName: file.name,
      size: file.size,
      registerTime: new Date().toLocaleString(),
      fileBinaryOfBase64CompressedText: compressedText,
    };
    const newItems = [...cartridges];
    newItems.push(cartridge);
    setCartridges(newItems);

    clearNewCartridgeInput();

    repository.registerCartridges(newItems);
  }

  const handleSelectCartridge = (cartridge: Cartridge) => {
    props.handlerChangeCartridge(cartridge);
    setOpen(false);
  }

  const clearNewCartridgeInput = (): void => {
    setNewCartridgeName('');
    setNewCartridgeFile(null);
    setDisableAddCartridge(true);

    console.log('current:' + newCartridgeFileRef.current);
    newCartridgeFileRef.current.value = '';
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

  const handleName = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const ie = e as ChangeEvent<HTMLInputElement>;
    const name = ie.target.value;
    setNewCartridgeName(name);

    setDisableAddCartridge(name.length === 0 || !newCartridgeFile);
  }

  const handleFile = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const ie = e as ChangeEvent<HTMLInputElement>;
    const files = ie.target.files;
    const file = files && files.length > 0 ? files[0] : null;
    setNewCartridgeFile(file);

    setDisableAddCartridge(newCartridgeName.length === 0 || !file);
  }

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
            <TextField label="Name" variant="outlined" value={newCartridgeName} onChange={handleName} />
            <TextField type="file" onChange={e => handleFile(e)} ref={newCartridgeFileRef} />
            <Button variant="contained" onClick={handleAddCartridge} disabled={disableAddCartridge}>
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
