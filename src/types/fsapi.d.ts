// File System Access API type augmentations
// Extends the standard lib types for browser compatibility

interface FileSystemDirectoryHandle {
  entries(): AsyncIterable<[string, FileSystemHandle]>;
  values(): AsyncIterable<FileSystemHandle>;
  keys(): AsyncIterable<string>;
  [Symbol.asyncIterator](): AsyncIterableIterator<[string, FileSystemHandle]>;
}
