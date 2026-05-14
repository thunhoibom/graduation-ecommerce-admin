import React, { useEffect, useRef } from 'react'
import 'quill/dist/quill.snow.css'

interface QuillEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
}

export default function QuillEditor({ value, onChange, placeholder }: QuillEditorProps) {
  const editorContainerRef = useRef<HTMLDivElement | null>(null)
  const quillInstanceRef = useRef<any>(null)
  const latestValueRef = useRef<string>('')
  const onChangeRef = useRef<typeof onChange>(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    let mounted = true

    const setupEditor = async () => {
      const Quill = (await import('quill')).default

      if (!mounted || !editorContainerRef.current || quillInstanceRef.current) {
        return
      }

      const quill = new Quill(editorContainerRef.current, {
        theme: 'snow',
        placeholder: placeholder || 'Nhập nội dung...',
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image', 'video'],
            ['clean'],
          ],
        },
      })

      quillInstanceRef.current = quill

      if (value) {
        quill.clipboard.dangerouslyPasteHTML(value)
        latestValueRef.current = value
      }

      quill.on('text-change', () => {
        const html = quill.root.innerHTML === '<p><br></p>' ? '' : quill.root.innerHTML
        latestValueRef.current = html
        onChangeRef.current?.(html)
      })
    }

    setupEditor()

    return () => {
      mounted = false
      quillInstanceRef.current = null
      if (editorContainerRef.current) {
        editorContainerRef.current.innerHTML = ''
      }
    }
  }, [placeholder])

  useEffect(() => {
    const quill = quillInstanceRef.current
    if (!quill) {
      return
    }

    const nextValue = value || ''
    if (nextValue === latestValueRef.current) {
      return
    }

    if (!nextValue) {
      quill.setText('')
      latestValueRef.current = ''
      return
    }

    quill.clipboard.dangerouslyPasteHTML(nextValue)
    latestValueRef.current = nextValue
  }, [value])

  return (
    <div className="bg-white">
      <div ref={editorContainerRef} className="min-h-96" />
    </div>
  )
}
