export class TextCompressor {
    private static readonly COMPRESS_ALGORITHM = 'deflate-raw';

    public async deflateOf(text: string): Promise<string> {
        const blob = new Blob([text]);
        const stream: ReadableStream<Uint8Array> = blob.stream();

        const compressedStream = stream.pipeThrough(
            new CompressionStream(TextCompressor.COMPRESS_ALGORITHM)
        );
        const response = new Response(compressedStream);

        return await response.text();
    }

    public async inflateOf(text: string): Promise<string> {
        const blob = new Blob([text]);
        const stream: ReadableStream<Uint8Array> = blob.stream();

        const decompressedStream = stream.pipeThrough(
            new DecompressionStream(TextCompressor.COMPRESS_ALGORITHM)
        );
        const response = new Response(decompressedStream);

        return await response.text();
    }
}