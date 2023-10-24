export class BinaryAndTextMutualConverter {
    public encodeBinaryToBase64Text(binary: ArrayBuffer): string {
        const unit8Array = new Uint8Array(binary);
        const charCodesText = Array.from(unit8Array)
            .map(c => String.fromCharCode(c))
            .join();
        return btoa(charCodesText);
    }

    public decodeBase64TextToBinary(base64Text: string): ArrayBuffer {
        const charCodesText = atob(base64Text);
        const unit8Array = Uint8Array.from(charCodesText, c => c.charCodeAt(0));
        return unit8Array.buffer;
    }
}