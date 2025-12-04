'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import TinyMCE Editor with SSR disabled
const Editor = dynamic(
  () => import('@tinymce/tinymce-react').then((mod) => mod.Editor),
  { 
    ssr: false,
    loading: () => (
      <div className="border border-gray-300 rounded-md p-4 flex items-center justify-center bg-gray-50" style={{ height: '500px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading editor...</p>
        </div>
      </div>
    )
  }
);

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
      apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY || "5vzbklf4x3hbeb8mcumkruowbljz3slj1ynpvt2wcn2l6z2m"}
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
        promotion: false,
        // Enhanced VM compatibility settings
        referrer_policy: 'origin',
        target_list: false,
        link_default_target: '_blank',
        setup: (editor: any) => {
          editor.on('init', () => {
            console.log('TinyMCE editor initialized successfully');
          });
          editor.on('LoadError', (e: any) => {
            console.error('TinyMCE failed to load:', e);
            console.log('Falling back to basic textarea if needed');
          });
        }
      }}
    />
  );
}
