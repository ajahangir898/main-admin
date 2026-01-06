import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bold, Italic, Underline, Link, Image as ImageIcon, List, ListOrdered, Heading2, Code, Trash2, Youtube } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

type FormatType = 'bold' | 'italic' | 'underline' | 'link' | 'image' | 'h2' | 'ul' | 'ol' | 'code';

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter product description...',
  minHeight = 'min-h-[300px]'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // Initialize editor on mount only
  useEffect(() => {
    setIsMounted(true);
    
    // Only set HTML if editorRef exists and value is not empty
    if (editorRef.current && value) {
      editorRef.current.innerHTML = value;
    }

    // Cleanup function
    return () => {
      setIsMounted(false);
      // Clear editor reference on unmount to prevent removeChild errors
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    };
  }, []);

  const handleEditorChange = useCallback(() => {
    if (editorRef.current && isMounted) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange, isMounted]);

  const applyFormat = useCallback((format: FormatType) => {
    if (!isMounted || !editorRef.current) return;

    // Ensure editor has focus before applying format
    editorRef.current.focus();
    
    switch (format) {
      case 'bold':
        document.execCommand('bold', false);
        break;
      case 'italic':
        document.execCommand('italic', false);
        break;
      case 'underline':
        document.execCommand('underline', false);
        break;
      case 'h2':
        document.execCommand('formatBlock', false, 'h2');
        break;
      case 'code':
        document.execCommand('formatBlock', false, 'pre');
        break;
      case 'ul':
        document.execCommand('insertUnorderedList', false);
        break;
      case 'ol':
        document.execCommand('insertOrderedList', false);
        break;
      case 'link': {
        const url = prompt('Enter URL:');
        if (url) {
          document.execCommand('createLink', false, url);
        }
        break;
      }
      case 'image': {
        fileInputRef.current?.click();
        break;
      }
    }
    
    editorRef.current?.focus();
    handleEditorChange();
  }, [isMounted, handleEditorChange]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isMounted) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      if (isMounted && editorRef.current) {
        editorRef.current.focus();
        document.execCommand('insertImage', false, imageUrl);
        handleEditorChange();
      }
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    e.target.value = '';
  }, [isMounted, handleEditorChange]);

  const clearFormatting = useCallback(() => {
    if (!isMounted || !editorRef.current) return;
    
    document.execCommand('removeFormat', false);
    handleEditorChange();
  }, [isMounted, handleEditorChange]);

  const handleYouTubeEmbed = useCallback(() => {
    if (!youtubeUrl.trim() || !editorRef.current) return;

    // Extract video ID from various YouTube URL formats
    let videoId = '';
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = youtubeUrl.match(youtubeRegex);
    
    if (match && match[1]) {
      videoId = match[1];
    } else if (youtubeUrl.length === 11) {
      // Assume it's just a video ID
      videoId = youtubeUrl;
    } else {
      alert('Please enter a valid YouTube URL or video ID');
      return;
    }

    // Create embedded iframe HTML
    const embedHtml = `<div style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; margin: 1rem 0;"><iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" src="https://www.youtube.com/embed/${videoId}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe></div>`;
    
    editorRef.current.focus();
    document.execCommand('insertHTML', false, embedHtml);
    handleEditorChange();
    setYoutubeUrl('');
    setShowYouTubeModal(false);
  }, [youtubeUrl, isMounted, handleEditorChange]);

  const ToolButton = ({ 
    icon: Icon, 
    title, 
    onClick, 
    isActive = false 
  }: { 
    icon: React.ComponentType<{ size: number }>;
    title: string;
    onClick: () => void;
    isActive?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded border transition ${
        isActive 
          ? 'bg-purple-100 border-purple-300 text-purple-700' 
          : 'border-gray-300 text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon size={16} />
    </button>
  );

  const handleFormatChange = useCallback((blockFormat: string) => {
    if (!isMounted || !editorRef.current) return;
    
    editorRef.current.focus();
    document.execCommand('formatBlock', false, blockFormat);
    handleEditorChange();
  }, [isMounted, handleEditorChange]);

  const handleFontChange = useCallback((fontName: string) => {
    if (!isMounted || !editorRef.current) return;
    
    editorRef.current.focus();
    document.execCommand('fontName', false, fontName);
    handleEditorChange();
  }, [isMounted, handleEditorChange]);

  const handleSizeChange = useCallback((fontSize: string) => {
    if (!isMounted || !editorRef.current) return;
    
    editorRef.current.focus();
    document.execCommand('fontSize', false, fontSize);
    handleEditorChange();
  }, [isMounted, handleEditorChange]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Product Description</label>
      
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-3 bg-gray-50 border border-gray-300 rounded-t-lg">
        <select 
          className="px-2 py-1 border border-gray-300 rounded text-sm bg-white hover:bg-gray-50"
          onChange={(e) => {
            if (e.target.value) {
              handleFormatChange(e.target.value);
              e.target.value = '';
            }
          }}
        >
          <option value="">Format</option>
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="pre">Code</option>
        </select>

        <div className="w-px bg-gray-300"></div>

        <select 
          className="px-2 py-1 border border-gray-300 rounded text-sm bg-white hover:bg-gray-50"
          onChange={(e) => {
            if (e.target.value) {
              handleFontChange(e.target.value);
              e.target.value = '';
            }
          }}
        >
          <option value="">Font</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Verdana">Verdana</option>
        </select>

        <div className="w-px bg-gray-300"></div>

        <select 
          className="px-2 py-1 border border-gray-300 rounded text-sm bg-white hover:bg-gray-50"
          onChange={(e) => {
            if (e.target.value) {
              handleSizeChange(e.target.value);
              e.target.value = '';
            }
          }}
        >
          <option value="">Size</option>
          <option value="1">Small</option>
          <option value="3">Normal</option>
          <option value="5">Large</option>
          <option value="7">Extra Large</option>
        </select>

        <div className="w-px bg-gray-300"></div>

        <ToolButton icon={Bold} title="Bold (Ctrl+B)" onClick={() => applyFormat('bold')} />
        <ToolButton icon={Italic} title="Italic (Ctrl+I)" onClick={() => applyFormat('italic')} />
        <ToolButton icon={Underline} title="Underline (Ctrl+U)" onClick={() => applyFormat('underline')} />

        <div className="w-px bg-gray-300"></div>

        <ToolButton icon={Link} title="Insert Link" onClick={() => applyFormat('link')} />
        <ToolButton icon={ImageIcon} title="Insert Image" onClick={() => applyFormat('image')} />
        <ToolButton icon={Youtube} title="Embed YouTube" onClick={() => setShowYouTubeModal(true)} />

        <div className="w-px bg-gray-300"></div>

        <ToolButton icon={Heading2} title="Heading 2" onClick={() => applyFormat('h2')} />
        <ToolButton icon={List} title="Bullet List" onClick={() => applyFormat('ul')} />
        <ToolButton icon={ListOrdered} title="Numbered List" onClick={() => applyFormat('ol')} />

        <div className="w-px bg-gray-300"></div>

        <ToolButton icon={Code} title="Code Block" onClick={() => applyFormat('code')} />
        
        <button
          type="button"
          onClick={clearFormatting}
          title="Clear Formatting"
          className="p-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Editor Container */}
      <div className="relative">
        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleEditorChange}
          onFocus={() => setIsEditing(true)}
          onBlur={() => setIsEditing(false)}
          className={`w-full px-4 py-3 border ${
            isEditing ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-300'
          } rounded-b-lg focus:outline-none transition ${minHeight} bg-white prose prose-sm max-w-none overflow-auto`}
          style={{
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            outline: 'none'
          }}
          data-placeholder={placeholder}
        />
      </div>

      {/* Global styles for placeholder - injected once */}
      <style dangerouslySetInnerHTML={{
        __html: `
          div[data-placeholder]:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
          }
        `
      }} />

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* YouTube URL Modal */}
      {showYouTubeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <Youtube size={24} className="text-red-600" />
              <h3 className="text-lg font-bold text-gray-900">Embed YouTube Video</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  YouTube URL or Video ID
                </label>
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleYouTubeEmbed()}
                  placeholder="https://youtube.com/watch?v=... or dQw4w9WgXcQ"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 Paste a YouTube URL or just the video ID
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleYouTubeEmbed}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition"
                >
                  Embed
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowYouTubeModal(false);
                    setYoutubeUrl('');
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-gray-500 mt-2">
        💡 Tip: Use the toolbar above to format your text with bold, italics, links, images, and more!
      </p>
    </div>
  );
};

export default RichTextEditor;
