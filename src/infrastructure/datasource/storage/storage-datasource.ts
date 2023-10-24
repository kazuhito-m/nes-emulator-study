import { Cartridge } from "@/domain/model/nes/cartridge/cartridge";
import { StorageRepository } from "@/domain/model/storage/storage-repository";

export class StorageDatasource implements StorageRepository {
    private static readonly STORAGE_ID = 'nes-emulator-storage';

    public getCartridges(): Cartridge[] {
        if (typeof window === 'undefined') return [];

        const startTime = performance.now();

        const jsonText = localStorage.getItem(StorageDatasource.STORAGE_ID);
        if (!jsonText) return [];

        const cartridges = JSON.parse(jsonText);

        const ms = performance.now() - startTime;

        console.log(cartridges);
        console.log(`StorageDatasource.loadCartridges(),      ${(new Blob([jsonText])).size} byte取得。${ms.toFixed(3)} ms`);

        return cartridges;
    }

    public registerCartridges(cartridges: Cartridge[]): void {
        if (typeof window === 'undefined') return;

        const startTime = performance.now();

        const jsonText = JSON.stringify(cartridges);
        localStorage.setItem(StorageDatasource.STORAGE_ID, jsonText);

        const ms = performance.now() - startTime;
        // console.log('register: ' + jsonText)
        console.log(cartridges);
        console.log(`StorageDatasource.registerCartridges(), ${(new Blob([jsonText])).size} byte保存。${ms.toFixed(3)} ms`);
        // alert('reg: ' + jsonText);
    }

    public clear(): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(StorageDatasource.STORAGE_ID);
    }
}
