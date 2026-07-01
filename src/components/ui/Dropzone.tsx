import { useCallback, useState } from 'react'
import { useDropzone, type Accept } from 'react-dropzone'
import { FaCloudUploadAlt, FaTimes } from 'react-icons/fa'
import { cn } from '@/lib/utils'

interface DropzoneProps {
  onFilesChange?: (files: File[]) => void
  accept?: Accept
  maxFiles?: number
  className?: string
}

export function Dropzone({ onFilesChange, accept, maxFiles = 10, className }: DropzoneProps) {
  const [files, setFiles] = useState<File[]>([])

  const onDrop = useCallback(
    (accepted: File[]) => {
      const next = [...files, ...accepted].slice(0, maxFiles)
      setFiles(next)
      onFilesChange?.(next)
    },
    [files, maxFiles, onFilesChange],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
  })

  const removeFile = (index: number) => {
    const next = files.filter((_, i) => i !== index)
    setFiles(next)
    onFilesChange?.(next)
  }

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={cn(
          'cursor-pointer rounded-[3px] border-2 border-dashed border-[#b6c2c9] bg-white p-10 text-center transition-colors',
          isDragActive && 'border-ca-theme bg-ca-theme/5',
        )}
      >
        <input {...getInputProps()} />
        <FaCloudUploadAlt className="mx-auto mb-3 text-4xl text-[#b6c2c9]" />
        <p className="mb-1 text-2xl font-medium text-ca-heading">
          Drop files here or click to upload.
        </p>
        <p className="text-sm font-light text-ca-text">
          (This is just a demo dropzone. Selected files are <strong>not</strong> actually uploaded.)
        </p>
      </div>

      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center justify-between rounded-[3px] border border-ca-border bg-ca-silver px-3 py-2 text-xs"
            >
              <span className="truncate text-ca-heading">
                {file.name}{' '}
                <span className="text-ca-text">({(file.size / 1024).toFixed(1)} KB)</span>
              </span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="ml-2 text-ca-red hover:opacity-70"
                aria-label="Remove file"
              >
                <FaTimes />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
