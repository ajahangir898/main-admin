// pages/AdminFigmaIntegration.tsx
import React, { useState, useCallback } from 'react';
import { 
  Figma, Link2, Unlink, Download, Eye, Search, 
  Loader2, ExternalLink, Image as ImageIcon, 
  ArrowLeft, RefreshCw, Copy, Check, AlertCircle,
  Folder, File, Layers
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface FigmaFile {
  key: string;
  name: string;
  thumbnail_url?: string;
  last_modified: string;
}

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
}

interface AdminFigmaIntegrationProps {
  onBack?: () => void;
  onImportImage?: (imageUrl: string, name: string) => void;
  tenantId?: string;
}

const AdminFigmaIntegration: React.FC<AdminFigmaIntegrationProps> = ({
  onBack,
  onImportImage,
  tenantId
}) => {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [figmaUser, setFigmaUser] = useState<{ name: string; email: string } | null>(null);
  
  // File browser state
  const [figmaUrl, setFigmaUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [designPreview, setDesignPreview] = useState<string | null>(null);
  const [designCode, setDesignCode] = useState<string | null>(null);
  const [designName, setDesignName] = useState<string>('');
  const [nodeInfo, setNodeInfo] = useState<any>(null);
  
  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  
  // Recent designs
  const [recentDesigns, setRecentDesigns] = useState<Array<{
    url: string;
    name: string;
    thumbnail: string;
    date: string;
  }>>([]);

  // Parse Figma URL to extract file key and node ID
  const parseFigmaUrl = (url: string): { fileKey: string; nodeId: string } | null => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      
      // Handle different Figma URL formats
      // https://figma.com/design/:fileKey/:fileName?node-id=:nodeId
      // https://figma.com/file/:fileKey/:fileName?node-id=:nodeId
      // https://www.figma.com/board/:fileKey/:fileName?node-id=:nodeId
      
      let fileKey = '';
      const designIndex = pathParts.indexOf('design');
      const fileIndex = pathParts.indexOf('file');
      const boardIndex = pathParts.indexOf('board');
      
      if (designIndex !== -1 && pathParts[designIndex + 1]) {
        fileKey = pathParts[designIndex + 1];
      } else if (fileIndex !== -1 && pathParts[fileIndex + 1]) {
        fileKey = pathParts[fileIndex + 1];
      } else if (boardIndex !== -1 && pathParts[boardIndex + 1]) {
        fileKey = pathParts[boardIndex + 1];
      }
      
      // Handle branch URLs
      const branchIndex = pathParts.indexOf('branch');
      if (branchIndex !== -1 && pathParts[branchIndex + 1]) {
        fileKey = pathParts[branchIndex + 1];
      }
      
      // Extract node ID from query params
      const nodeIdParam = urlObj.searchParams.get('node-id');
      const nodeId = nodeIdParam ? nodeIdParam.replace('-', ':') : '';
      
      if (!fileKey) return null;
      
      return { fileKey, nodeId };
    } catch {
      return null;
    }
  };

  // Connect to Figma (simulated - in production this would use OAuth)
  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // In production, this would redirect to Figma OAuth
      // For now, we'll simulate the connection
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsConnected(true);
      setFigmaUser({ name: 'Figma User', email: 'user@example.com' });
      toast.success('Connected to Figma successfully!');
    } catch (error) {
      toast.error('Failed to connect to Figma');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect from Figma
  const handleDisconnect = () => {
    setIsConnected(false);
    setFigmaUser(null);
    setDesignPreview(null);
    setDesignCode(null);
    setNodeInfo(null);
    toast.success('Disconnected from Figma');
  };

  // Fetch design from Figma URL
  const handleFetchDesign = async () => {
    if (!figmaUrl.trim()) {
      toast.error('Please enter a Figma URL');
      return;
    }

    const parsed = parseFigmaUrl(figmaUrl);
    if (!parsed) {
      toast.error('Invalid Figma URL. Please use a valid Figma design link.');
      return;
    }

    setIsLoading(true);
    setDesignPreview(null);
    setDesignCode(null);
    setNodeInfo(null);

    try {
      // This would call the Figma MCP tools in production
      // For demonstration, we'll show the expected behavior
      
      const { fileKey, nodeId } = parsed;
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In production, this would use:
      // - mcp_figma_get_screenshot for preview
      // - mcp_figma_get_design_context for code generation
      // - mcp_figma_get_metadata for structure info
      
      // Simulated response
      setDesignName(`Design from ${fileKey}`);
      setNodeInfo({
        fileKey,
        nodeId: nodeId || 'root',
        type: 'FRAME',
        name: 'Imported Design'
      });
      
      // Add to recent designs
      setRecentDesigns(prev => [{
        url: figmaUrl,
        name: `Design ${prev.length + 1}`,
        thumbnail: '',
        date: new Date().toISOString()
      }, ...prev.slice(0, 9)]);
      
      toast.success('Design fetched successfully! Use Figma MCP tools for full functionality.');
      
    } catch (error) {
      console.error('Failed to fetch design:', error);
      toast.error('Failed to fetch design. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy generated code
  const handleCopyCode = () => {
    if (designCode) {
      navigator.clipboard.writeText(designCode);
      setCopiedCode(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Import design as image to gallery
  const handleImportToGallery = async () => {
    if (!designPreview || !onImportImage) {
      toast.error('No design to import or gallery not available');
      return;
    }

    setIsImporting(true);
    try {
      await onImportImage(designPreview, designName || 'Figma Import');
      toast.success('Design imported to gallery!');
    } catch (error) {
      toast.error('Failed to import design');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Figma className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Figma Integration</h1>
            <p className="text-sm text-gray-500">Import and preview designs from Figma</p>
          </div>
        </div>
      </div>

      {/* Connection Status Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${isConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
              {isConnected ? (
                <Link2 className="w-6 h-6 text-green-600" />
              ) : (
                <Unlink className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {isConnected ? 'Connected to Figma' : 'Not Connected'}
              </h3>
              {figmaUser && (
                <p className="text-sm text-gray-500">{figmaUser.email}</p>
              )}
            </div>
          </div>
          <button
            onClick={isConnected ? handleDisconnect : handleConnect}
            disabled={isConnecting}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              isConnected
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-purple-600 text-white hover:from-[#2BAEE8] hover:to-[#1A7FE8]'
            }`}
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : isConnected ? (
              <>
                <Unlink size={16} />
                Disconnect
              </>
            ) : (
              <>
                <Figma size={16} />
                Connect Figma
              </>
            )}
          </button>
        </div>
      </div>

      {/* URL Input Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Search size={18} />
          Fetch Design by URL
        </h3>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={figmaUrl}
              onChange={(e) => setFigmaUrl(e.target.value)}
              placeholder="Paste Figma URL (e.g., https://figma.com/design/abc123/MyDesign?node-id=1-2)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {figmaUrl && (
              <button
                onClick={() => setFigmaUrl('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
          <button
            onClick={handleFetchDesign}
            disabled={isLoading || !figmaUrl.trim()}
            className="px-6 py-3 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] text-white rounded-lg font-medium hover:from-[#2BAEE8] hover:to-[#1A7FE8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <Download size={18} />
                Fetch Design
              </>
            )}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Supported formats: Figma design URLs, file URLs, and frame-specific URLs with node-id
        </p>
      </div>

      {/* Design Preview & Info */}
      {nodeInfo && (
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Preview Panel */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Eye size={18} />
                Design Preview
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleFetchDesign}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Refresh"
                >
                  <RefreshCw size={16} />
                </button>
                <a
                  href={figmaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Open in Figma"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
            <div className="p-6">
              {designPreview ? (
                <img
                  src={designPreview}
                  alt={designName}
                  className="w-full h-auto rounded-lg border border-gray-200"
                />
              ) : (
                <div className="aspect-video bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-400">
                  <Figma size={48} className="mb-3 opacity-50" />
                  <p className="text-sm">Preview will appear here</p>
                  <p className="text-xs mt-1">Use Figma MCP tools for screenshots</p>
                </div>
              )}
            </div>
            {designPreview && onImportImage && (
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={handleImportToGallery}
                  disabled={isImporting}
                  className="w-full px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] text-white rounded-lg font-medium hover:from-[#2BAEE8] hover:to-[#1A7FE8] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <ImageIcon size={16} />
                      Import to Gallery
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Layers size={18} />
                Design Information
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">File Key</label>
                <p className="text-sm font-mono bg-gray-50 px-3 py-2 rounded mt-1">{nodeInfo.fileKey}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Node ID</label>
                <p className="text-sm font-mono bg-gray-50 px-3 py-2 rounded mt-1">{nodeInfo.nodeId || 'Root'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Type</label>
                <p className="text-sm bg-gray-50 px-3 py-2 rounded mt-1">{nodeInfo.type}</p>
              </div>
              
              {/* MCP Tools Info */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-start gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Using Figma MCP</p>
                    <p className="text-amber-700 mt-1">
                      For full functionality (screenshots, code generation, metadata), use VS Code's 
                      Figma MCP integration with the configured tools.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generated Code Section */}
      {designCode && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <File size={18} />
              Generated Code
            </h3>
            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
            >
              {copiedCode ? (
                <>
                  <Check size={14} className="text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={14} />
                  Copy Code
                </>
              )}
            </button>
          </div>
          <div className="p-4">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{designCode}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Recent Designs */}
      {recentDesigns.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Folder size={18} />
              Recent Designs
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {recentDesigns.map((design, index) => (
              <div
                key={index}
                onClick={() => setFigmaUrl(design.url)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Figma className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{design.name}</p>
                  <p className="text-sm text-gray-500 truncate">{design.url}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(design.date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-3">How to use Figma Integration</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
            <div>
              <p className="font-medium text-gray-900">Copy Figma URL</p>
              <p className="text-sm text-gray-600">Open your design in Figma and copy the URL from the browser</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
            <div>
              <p className="font-medium text-gray-900">Paste & Fetch</p>
              <p className="text-sm text-gray-600">Paste the URL above and click Fetch Design to load it</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">3</div>
            <div>
              <p className="font-medium text-gray-900">Import or Copy</p>
              <p className="text-sm text-gray-600">Import the design to gallery or copy generated code</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFigmaIntegration;
