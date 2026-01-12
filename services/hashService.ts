// Implementation of the OpenSubtitles Hash Algorithm
// Logic: 64-bit checksum of the first 64kb + last 64kb + file size

export const computeMovieHash = async (file: File): Promise<string> => {
  const chunkSize = 65536; // 64KB
  const fileSize = file.size;

  const readChunk = (start: number, end: number): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file.slice(start, end));
    });
  };

  try {
    const head = await readChunk(0, Math.min(chunkSize, fileSize));
    const tail = await readChunk(Math.max(fileSize - chunkSize, 0), fileSize);

    const processBuffer = (buffer: ArrayBuffer, initialHash: bigint): bigint => {
      const longArray = new BigUint64Array(buffer);
      let hash = initialHash;
      for (const long of longArray) {
         // Sum with 64-bit overflow wrapping
         hash = (hash + long) & 0xffffffffffffffffn;
      }
      return hash;
    };

    let hash = BigInt(fileSize);
    
    // If file is smaller than chunk size*2, we might read overlapping/same data, 
    // but the algo standard is usually meant for larger video files. 
    // For small files, this logic generally still holds as "bytes are bytes".
    if (fileSize > 0) {
        hash = processBuffer(head, hash);
        hash = processBuffer(tail, hash);
    }

    // Format as 16-char hex string
    return hash.toString(16).padStart(16, '0');
  } catch (err) {
    console.error("Hash computation failed", err);
    throw err;
  }
};
