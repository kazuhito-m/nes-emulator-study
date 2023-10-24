import { Cartridge } from "../nes/cartridge/cartridge";

export interface StorageRepository {
    getCartridges(): Cartridge[];
    registerCartridges(cartridges: Cartridge[]): void;
    clear(): void;
}