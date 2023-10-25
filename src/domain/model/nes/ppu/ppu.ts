import { Constants } from "../constants";
import { initializeTwoDimensionalArray, max, min } from "../cpp-functions";
import { PpuBus } from "./ppu-bus";
import { PpuInternalRegister } from "./ppu-internal-register";
import { PpuInternalRegistertarget } from "./ppu-internal-register-target";
import { Sprite } from "./sprite";
import { SpriteSize } from "./sprite-size";

export class Ppu {
    // 例によってレジスタは命名規則に従わないことにします
    // 0x2000
    private PPUCTRL = 0;
    // 0x2001
    private PPUMASK = 0;
    // 0x2002
    private PPUSTATUS = 0;
    // 0x2003
    private OAMADDR = 0;
    // 0x2004 = OAMDATA は OAM(Sprite RAM) に書かれるので保持しない
    // 0x2005 PPUSCROLL の代わりに描画用内部レジスタ(https://wiki.nesdev.com/w/index.php/PPU_scrolling#PPU_internal_registers)を使う、 PPUADDR はまあそのまま使っちゃう
    private m_InternalReg: PpuInternalRegister = new PpuInternalRegister();
    // 0x2006
    private PPUADDR = 0;
    // 0x2007
    private PPUDATA = 0;
    // 0x4014
    private OAMDMA = 0;

    private m_VramReadBuf = 0;
    // PPU Bus 経由で VRAM を読み書きする
    private m_pPpuBus: PpuBus;

    // 2度書き用フラグシリーズ
    // PPUADDR は上位バイト -> 下位バイトの順にかきこみ
    private m_IsLowerPpuAddr = false;
    // PPUADDR への2回書き込みが完了しているか？
    private m_IsValidPpuAddr = false;
    private m_VramAddr = 0;

    private m_Lines = 0;
    private m_Cycles = 0;
    // BG のタイル内でのx座標
    private m_BGRelativeX = 0;

    // ---- buffres ----

    // PPU は 256 byte の Object Attribute Memory(Sprite を書き込む場所)をもつ
    private m_Oam: number[] = new Array(Constants.OAM_SIZE);

    // PPU の出力(絵)。 Ppu に持たせるのが適切か若干微妙だけどとりあえずここ
    private m_PpuOutput: number[][] = initializeTwoDimensionalArray<number>(Constants.PPU_OUTPUT_Y, Constants.PPU_OUTPUT_X);

    // 背景が透明ピクセルか？
    private m_IsBackgroundClear: boolean[][] = initializeTwoDimensionalArray<boolean>(Constants.PPU_OUTPUT_Y, Constants.PPU_OUTPUT_X);

    constructor(pPpuBus: PpuBus) {
        this.m_pPpuBus = pPpuBus;
    }

    // PPU レジスタは不思議な副作用がたくさんあるので、それを実現できるようにすべてアクセサーでアクセスすることにする
    public writePpuCtrl(data: number): void {
        this.PPUCTRL = data;

        // 内部レジスタの nametable select に反映(この辺 見る https://wiki.nesdev.com/w/index.php/PPU_scrolling#Register_controls)
        const arg = data & 0b11;
        this.m_InternalReg.setNametableSelect(PpuInternalRegistertarget.PpuInternalRegistertarget_t, arg);

    }

    public writePpuMask(data: number): void {
        this.PPUMASK = data;
    }

    public writeOamAddr(data: number): void {
        this.OAMADDR = data;
    }

    public writeOamData(data: number): void {
        // 普通は DMA されるらしいので、あまり叩かれないかも
        // OAMADDR インクリメントの根拠: http://pgate1.at-ninja.jp/NES_on_FPGA/nes_ppu.htm
        this.m_Oam[this.OAMADDR] = data;
        this.OAMADDR++;
    }

    public writePpuScroll(data: number): void {
        const m_InternalReg = this.m_InternalReg;

        if (!m_InternalReg.getW()) {
            const coarseX = data >> 3;
            const fineX = data & 0b111;

            m_InternalReg.setCoarseX(PpuInternalRegistertarget.PpuInternalRegistertarget_t, coarseX);
            m_InternalReg.setFineX(fineX);
            m_InternalReg.setW(true);
        } else {
            const coarseY = data >> 3;
            const fineY = data & 0b111;

            m_InternalReg.setCoarseY(PpuInternalRegistertarget.PpuInternalRegistertarget_t, coarseY);
            m_InternalReg.setFineY(PpuInternalRegistertarget.PpuInternalRegistertarget_t, fineY);
            m_InternalReg.setW(false);
        }
    }

    public writePpuAddr(data: number): void {
        if (this.m_IsLowerPpuAddr) {
            this.m_VramAddr |= data;
            this.m_IsLowerPpuAddr = false;
            this.m_IsValidPpuAddr = true;
        } else {
            this.m_VramAddr = data;
            this.m_VramAddr <<= 8;
            this.m_IsLowerPpuAddr = true;
            this.m_IsValidPpuAddr = false;
        }

        // 内部レジスタにも一応反映させとく
        if (!this.m_InternalReg.getW()) {
            this.m_InternalReg.setUpperPpuAddr(data);
        } else {
            this.m_InternalReg.setLowerPpuAddr(data);
        }
    }

    public writePpuData(data: number): void {
        this.m_pPpuBus.writeByte(this.m_VramAddr, data);
        this.m_VramAddr += this.getVramOffset();
    }


    public readPpuStatus(): number {
        // 2回読みフラグをリセット
        this.m_InternalReg.setW(false);
        this.m_IsLowerPpuAddr = false;
        this.m_IsValidPpuAddr = false;

        // VBLANK フラグ クリアする前に値を保持しておく
        const ret = this.PPUSTATUS;

        // VBlank フラグをクリア
        this.setVBlankFlag(false);

        return ret;
    }

    public readPpuData(): number {
        const ppuBus = this.m_pPpuBus;

        const buffered = this.m_VramReadBuf;
        if (this.m_VramAddr >= Constants.PALETTE_BASE) {
            // パレットテーブルは即時読み出し、 "下"にあるネームテーブルのミラーがバッファに入る
            this.m_VramReadBuf = ppuBus.readByte(this.m_VramAddr, true);
            const ret = ppuBus.readByte(this.m_VramAddr);
            this.m_VramAddr += this.getVramOffset();

            return ret;
        } else {
            this.m_VramReadBuf = ppuBus.readByte(this.m_VramAddr);
            this.m_VramAddr += this.getVramOffset();
        }

        return buffered;
    }


    // レジスタ読み書き 終

    // クロックを与えてそのクロックだけ PPU を進める、1画面分処理したら true が返る
    public run(clk: number): boolean {
        const beforeCycles = this.m_Cycles;
        const beforeLines = this.m_Lines;

        // クロックの加算は BG 描画しながら行う
        this.drawBackGround(clk);

        // Line 241 にきてたら NMI する
        if (this.m_Lines != beforeLines && this.m_Lines == 241) {
            // 画面が完成する直前に sprite 描画
            this.buildSprites();
            // VBLANK フラグ立てる
            this.setVBlankFlag(true);

            if (this.PPUCTRL & (1 << 7)) {
                this.m_pPpuBus.generateCpuInterrupt();
            }
        }

        if (this.m_Lines < 240) {
            // 可視ラインのときだけ Sprite 0 hit を 1px ずつチェックする。[2, 257] cycle 目で判定する。
            // いまみてる line の beforecycles - 2 まで見終わってるはずなので、その次のピクセルから見る
            // line をまたいでる場合は start を 0 にする、 m_Cycles が 1以下 のとき end が負になるけど壊れないはず
            const start = beforeCycles + clk >= 341
                ? 0
                : max(0, beforeCycles - 2 + 1);
            const end = min(255, this.m_Cycles - 2);

            for (let x = start; x <= end; x++) {
                if (this.isSprite0Hit(this.m_Lines, x)) {
                    this.PPUSTATUS |= Constants.PPUSTATUS_SPRITE_0_HIT;
                }
            }
        }
        // line 261の先頭で sprite 0 hit フラグ と VBlank フラグを折る
        if (this.m_Lines === Constants.PPU_OUTPUT_Y + Constants.PPU_VBLANK_Y - 1) {
            this.PPUSTATUS &= ~Constants.PPUSTATUS_SPRITE_0_HIT;
            this.setVBlankFlag(false);
        }

        if (this.m_Lines === Constants.PPU_OUTPUT_Y + Constants.PPU_VBLANK_Y) {
            this.m_Lines = 0;
            return true;
        }
        return false;
    }


    // 座標を指定してテーブルを引いて背景色と透明か否か(透明 = true)を取得する、テスト用に公開しておく
    public getBackGroundPixelColor(y: number, x: number): [number, boolean] {
        return [this.m_PpuOutput[y][x], this.m_IsBackgroundClear[y][x]];
    }


    // スプライトの左上を原点とした座標を指定してテーブルを引いてスプライトの色と透明か否か(透明 = true)を取得する、テスト用に公開しておく
    public getSpritePixelColor(sprite: Sprite, relativeY: number, relativeX: number): [number, boolean] {
        const m_pPpuBus = this.m_pPpuBus;

        if (relativeX >= 8) throw new Error('Range out relativeX.');
        if (relativeY >= 8) throw new Error('Range out relativeY.');

        // 反転フラグを確認して立ってたら反転させる
        const invHorizontal = ((1 << 6) & sprite.attribute) == (1 << 6);
        const invVertical = ((1 << 7) & sprite.attribute) == (1 << 7);

        if (invHorizontal) relativeX = 7 - relativeX;
        if (invVertical) relativeY = 7 - relativeY;

        const patternTableBase = this.getSpritePatternTableBase() + sprite.patternTableIdx * Constants.PATTERN_TABLE_ELEMENT_SIZE;

        const patternTableLower = m_pPpuBus.readByte(patternTableBase + relativeY);
        const patternTableUpper = m_pPpuBus.readByte(patternTableBase + 8 + relativeY);

        const bitPos = 7 - relativeX;

        const colorLower = (patternTableLower & (1 << bitPos)) === (1 << bitPos);
        const colorUpper = (patternTableUpper & (1 << bitPos)) === (1 << bitPos);

        const colorLowerNum = colorLower ? 1 : 0;
        let colorUpperNum = colorUpper ? 1 : 0;
        colorUpperNum <<= 1;

        const color = colorLowerNum | colorUpperNum;
        if (color > 3) throw new Error('Invalid color parameter.');

        // パレットの id は Sprite がもってる
        // カラーパレットの上位2bit(http://pgate1.at-ninja.jp/NES_on_FPGA/nes_ppu.htm#sprite) というのの意味がわからないが、sprite palette base が 0x3f10 で、そこからのオフセットを4bitで指定すると考えるとつじつまがあうのでそう考える
        // バグったら疑う(最悪)
        const spritePaletteBase = Constants.PALETTE_BASE + Constants.SPRITE_PALETTE_OFFSET;
        // attribute の下位 2 bit が sprite palette の index
        const spritePaletteId = sprite.attribute & 0b11;
        // 各所で得られる情報にしたがって or にしとく(spritePaletteId を sprite palette のインデックスとみなして + spritePaletteId * 4 としても意味はおなじはず)
        const spritePaletteAddr = spritePaletteBase | (spritePaletteId << 2);
        // color を足して実際に読むべきアドレスにする
        const colorAddr = spritePaletteAddr + color;

        const ret = m_pPpuBus.readByte(colorAddr);

        return [ret, color === 0];
    }


    // PPU の絵をバッファにかきこむ
    public getPpuOutput(pOutBuffer: number[][]): void {
        for (let y = 0; y < Constants.PPU_OUTPUT_Y; y++) {
            for (let x = 0; x < Constants.PPU_OUTPUT_X; x++) {
                pOutBuffer[y][x] = this.m_PpuOutput[y][x];
            }
        }
    }


    // PPUの情報を取得
    public getPpuInfo(): [number, number] {
        // XXX C++ではポインタにて戻り引数で返してるので、仕様を変えて戻り値にタプルで返す。
        return [this.m_Lines, this.m_Cycles];
    }


    // private methods.

    // コントロールレジスタ 読み書き系
    private getVramOffset(): number {
        return (this.PPUCTRL & (1 << 2)) ? 32 : 1;
    }

    private setVBlankFlag(flag: boolean): void {
        if (flag) this.PPUSTATUS |= (1 << 7);
        else this.PPUSTATUS &= ~(1 << 7);
    }

    // クロックを受け取って、そのクロック分だけ背景描画とそれに付随する処理をする(内部レジスタX, Y のインクリメントとか)
    // 暗黙的であんまりよくないけど、 m_Clock の加算もここでやっちゃう
    private drawBackGround(clk: number): void {
        const m_InternalReg = this.m_InternalReg;
        const m_pPpuBus = this.m_pPpuBus;

        // clk クロック PPU をすすめる
        for (let i = 0; i < clk; i++) {
            // 1 cycle に 1 px 描画することに注意する
            if (this.m_Cycles == 0) {
                // Line の最初で Fine X Scroll を適用する
                this.m_BGRelativeX = m_InternalReg.getFineX();
            }

            const x = this.m_Cycles;
            const y = this.m_Lines;

            // 描画範囲内なら描画する
            if (y < Constants.PPU_OUTPUT_Y && x < Constants.PPU_OUTPUT_X) {
                const tileAddr = m_InternalReg.getTileAddress();
                const attributeAddr = m_InternalReg.getAttributeAddress();

                const attributeTable = m_pPpuBus.readByte(attributeAddr);

                // 使うパレットを特定する
                // 下位 10 bit が tile id 
                const tileId = tileAddr & 0b1111111111;
                const paletteId = this.getPaletteId(tileId, attributeTable);

                // tile 内での相対座標
                const relativeX = this.m_BGRelativeX;
                const relativeY = m_InternalReg.getFineY(PpuInternalRegistertarget.PpuInternalRegistertarget_v);

                // nametable 引き
                const spriteNum = m_pPpuBus.readByte(tileAddr);

                // pattern table 引き
                const offset = this.getBGPatternTableBase() + spriteNum * Constants.PATTERN_TABLE_ELEMENT_SIZE;
                const patternTableLower = m_pPpuBus.readByte(offset + relativeY);
                const patternTableUpper = m_pPpuBus.readByte(offset + relativeY + 8);

                const bitPos = 7 - relativeX;

                const colorLower = (patternTableLower & (1 << bitPos)) == (1 << bitPos);
                const colorUpper = (patternTableUpper & (1 << bitPos)) == (1 << bitPos);

                const colorLowerNum = colorLower ? 1 : 0;
                let colorUpperNum = colorUpper ? 1 : 0;
                colorUpperNum <<= 1;


                const color = colorLowerNum | colorUpperNum;
                if (color > 3) throw new Error('Invalid color parameter.');

                // palette[paletteId][color] が実際に絵として現れる色。 color == 0 のときは透明色
                const PaletteSize = 4;
                const outColor = m_pPpuBus.readByte(Constants.PALETTE_BASE + PaletteSize * paletteId + color);

                this.m_PpuOutput[y][x] = outColor;
                this.m_IsBackgroundClear[y][x] = color === 0;

                const masterBg = m_pPpuBus.readByte(Constants.PALETTE_BASE);
                if (color == 0) {
                    this.m_PpuOutput[y][x] = masterBg;
                }
            }

            // v 更新
            if (x == 257) {
                m_InternalReg.updateHorizontalV();
            }

            if (this.m_Lines == 261 && 280 <= x && x <= 304) {
                m_InternalReg.updateVerticalV();
            }

            // 描画座標に基づいて内部レジスタをインクリメントする
            // Line の 256 dot 目にきてたら Y インクリメント
            if (x == 256) {
                m_InternalReg.incrementY();
            }

            // X の相対座標(fine X から始まる奴) が 8 になっていたら Coarse X をインクリメント
            // Between dot 328 of a scanline, and 256 of the next scanline ???(https://wiki.nesdev.com/w/index.php/PPU_scrolling#Between_dot_328_of_a_scanline.2C_and_256_of_the_next_scanline)
            // 境界あやしいかも
            //if (x >= 328 || x < 256) 
            if (x < 256) {
                this.m_BGRelativeX++;
                if (this.m_BGRelativeX == 8) {
                    this.m_BGRelativeX = 0;
                    m_InternalReg.incrementCoarseX();
                }
            }

            this.m_Cycles++;
            // PPU サイクルは mod 341 で保持する(341 PPU cycles で 1 Line 描画されるので)
            if (this.m_Cycles >= 341) {
                this.m_Cycles %= 341;
                this.m_Lines++;
            }
        }
    }

    // スプライト を全部描画する
    private buildSprites(): void {
        // OAM に保持できるスプライトは 64 個
        for (let i = 0; i < Constants.OAM_SIZE / Sprite.SIZE; i++) {
            const sprite = this.getSprite(i);

            const offsetY = sprite.y + 1;
            const offsetX = sprite.x;

            for (let ry = 0; ry < 8; ry++) {
                for (let rx = 0; rx < 8; rx++) {
                    // はみ出してるならなんもしない
                    if (ry + offsetY >= Constants.PPU_OUTPUT_Y || rx + offsetX >= Constants.PPU_OUTPUT_X) {
                        continue;
                    }

                    const [color, isClear] = this.getSpritePixelColor(sprite, ry, rx);
                    if (isClear) {
                        // 透明色ならなんもしない
                        continue;
                    }

                    const isFront = (sprite.attribute & (1 << 5)) === 0;
                    if (isFront) {
                        // front: 問答無用で描画
                        this.m_PpuOutput[ry + offsetY][rx + offsetX] = color;
                    }
                    else if (this.m_IsBackgroundClear[ry + offsetY][rx + offsetX]) {
                        // back: 背景が透明なら描画
                        this.m_PpuOutput[ry + offsetY][rx + offsetX] = color;
                    }
                }
            }
        }
    }

    // パターンテーブルのベースアドレスを取得
    private getBGPatternTableBase(): number {
        // PPUCTRL[4] で背景パターンテーブルアドレスを分岐する
        return (this.PPUCTRL & 1 << 4) ? 0x1000 : 0x0000;
    }

    private getSpritePatternTableBase(): number {
        // PPUCTRL[3] でスプライトパターンテーブルアドレスを分岐する
        return (this.PPUCTRL & 1 << 3) ? 0x1000 : 0x0000;
    }

    // スプライトサイズを取得
    private getSpriteSize(): SpriteSize {
        return (this.PPUCTRL & (1 << 5))
            ? SpriteSize.SpriteSize_8x16
            : SpriteSize.SpriteSize_8x8;
    }

    // インデックスを指定して OAM からスプライトを一つ取得する
    private getSprite(idx: number): Sprite {
        const offset = idx * Sprite.SIZE;
        // OAM からはみ出さない
        if (offset + 3 >= Constants.OAM_SIZE) throw new Error('Over OAM Size');

        const m_Oam = this.m_Oam;
        return new Sprite(m_Oam[offset], m_Oam[offset + 1], m_Oam[offset + 2], m_Oam[offset + 3]);

    }

    // Sprite 0 hit してるか？
    private isSprite0Hit(y: number, x: number): boolean {
        // Sprite 0 hit が発生しない条件に当てはまっているなら早期 return しちゃう
        const enableClippingBg = (this.PPUMASK & Constants.PPUMASKS_ENABLE_BG_MASK) == 0;
        const enableClippingSprite = (this.PPUMASK & Constants.PPUMASKS_ENABLE_SPRITE_MASK) == 0;
        const enableBg = (this.PPUMASK & Constants.PPUMASKS_ENABLE_BG) == Constants.PPUMASKS_ENABLE_BG;
        const enableSprite = (this.PPUMASK & Constants.PPUMASKS_ENABLE_SPRITE) == Constants.PPUMASKS_ENABLE_SPRITE;

        // クリッピング有効 or {背景 or スプライト描画無効} ならスプライト0hitしない
        if (enableClippingBg || enableClippingSprite || !enableBg || !enableSprite) {
            return false;
        }

        const sprite0 = this.getSprite(0);
        // OAM に格納されるy座標は -1 されてるので足す
        sprite0.y++;

        // スプライト内の相対座標 計算
        const relativeY = y - sprite0.y;
        const relativeX = x - sprite0.x;

        // TORIAEZU: sprite size 8x8 のみ対応
        const isSize8x8 = this.getSpriteSize() === SpriteSize.SpriteSize_8x8;
        if (!isSize8x8) throw new Error('Only support "sprite size 8x8".');

        if (isSize8x8) {
            // 範囲外
            if (relativeX < 0 || relativeY < 0 || relativeX >= 8 || relativeY >= 8) {
                return false;
            }
            // 範囲内 なら pattern table 引く、今回ほしいのは 透明 or not だけなので second だけ見る
            const [color, isSpriteClear] = this.getSpritePixelColor(sprite0, relativeY, relativeX);
            // 事前条件(DrawBackGround(clk) 済)を満たしていれば、 m_IsBackgroundClear[y][x] には既に正しい値が入っているはずなので、これでよいはず
            const isBgClear = this.m_IsBackgroundClear[y][x];

            // 両方不透明なら hit
            return (!isSpriteClear && !isBgClear) ? true : false;
        } else {
            return false;
        }
    }

    // ---- helper methods ----

    private getPaletteId(tileId: number, attributeTableElement: number): number {
        let higher = (tileId / 64) % 2 == 0 ? 0 : 1;
        const lower = (tileId / 2) % 2 == 0 ? 0 : 1;
        higher <<= 1;

        const paletteIdx = higher | lower;

        // attribute table から paletteIdx 番目の値を取り出す
        let paletteId = attributeTableElement & (0b11 << (paletteIdx * 2));
        paletteId >>= (paletteIdx * 2);

        return paletteId;
    }
}
