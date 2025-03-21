'use client';

import { Editor } from '@tinymce/tinymce-react';
import { useRef } from 'react';

interface RichTextEditorProps {
  initialValue?: string;
  onEditorChange?: (content: string) => void;
  height?: number;
  placeholder?: string;
}

export default function RichTextEditor({
  initialValue = '',
  onEditorChange,
  height = 500,
  placeholder = 'Start typing your assignment here...'
}: RichTextEditorProps) {
  const editorRef = useRef<any>(null);

  return (
    <Editor
      apiKey="your-api-key" // Replace with your TinyMCE API key or remove to use the free dev tier
      onInit={(evt, editor) => editorRef.current = editor}
      initialValue={initialValue}
      onEditorChange={onEditorChange}
      init={{
        height,
        menubar: true,
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
        ],
        toolbar: 'undo redo | blocks | ' +
          'bold italic forecolor | alignleft aligncenter ' +
          'alignright alignjustify | bullist numlist outdent indent | ' +
          'removeformat | help',
        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
        placeholder,
        promotion: false
      }}
    />
  );
} 