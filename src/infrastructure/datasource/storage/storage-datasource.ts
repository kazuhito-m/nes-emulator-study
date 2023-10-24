import { Cartridge } from "@/domain/model/nes/cartridge/cartridge";
import { StorageRepository } from "@/domain/model/storage/storage-repository";

export class StorageDatasource implements StorageRepository {
    constructor(private readonly storage: Storage) { }

    private static readonly STORAGE_ID = 'nes-emulator-storage';

    public getCartridges(): Cartridge[] {
        const startTime = performance.now();

        const jsonText = this.storage.getItem(StorageDatasource.STORAGE_ID);
        if (!jsonText) return [];

        const cartridges = JSON.parse(jsonText);

        const ms = performance.now() - startTime;

        console.log(cartridges);
        console.log(`StorageDatasource.loadCartridges(),      ${(new Blob([jsonText])).size} byte取得。${ms.toFixed(3)} ms`);

        return cartridges;
    }

    public registerCartridges(cartridges: Cartridge[]): void {
        const startTime = performance.now();

        const jsonText = JSON.stringify(cartridges);
        this.storage.setItem(StorageDatasource.STORAGE_ID, jsonText);

        const ms = performance.now() - startTime;
        // console.log('register: ' + jsonText)
        console.log(cartridges);
        console.log(`StorageDatasource.registerCartridges(), ${(new Blob([jsonText])).size} byte保存。${ms.toFixed(3)} ms`);
        // alert('reg: ' + jsonText);
    }

    public clear(): void {
        this.storage.removeItem(StorageDatasource.STORAGE_ID);
    }
}
