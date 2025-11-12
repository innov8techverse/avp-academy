import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin, ToolbarSlot, ToolbarProps } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

// Helper to normalize file type
function getNormalizedType(type, fileName = '') {
  if (!type && fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext)) return 'PDF';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) return 'IMAGE';
    if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) return 'VIDEO';
  }
  if (!type) return '';
  const t = type.toString().toLowerCase();
  if (t === 'pdf' || t === 'application/pdf') return 'PDF';
  if (t === 'image' || t.startsWith('image/')) return 'IMAGE';
  if (t === 'video' || t.startsWith('video/')) return 'VIDEO';
  if (t === 'doc' || t === 'application/msword' || t === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'DOC';
  if (t === 'ppt' || t === 'application/vnd.ms-powerpoint' || t === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'PPT';
  return t.toUpperCase();
}

const ContentViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [contentUrl, setContentUrl] = useState<string>('');
  const [contentBlob, setContentBlob] = useState<Blob | null>(null);
  const [material, setMaterial] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullscreenKey, setFullscreenKey] = useState(0);

  // Configure the default layout plugin with custom toolbar (no download/print)
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    renderToolbar: (Toolbar: (props: ToolbarProps) => React.ReactElement) => (
      <Toolbar>
        {(slots: ToolbarSlot) => {
          const {
            CurrentPageInput,
            EnterFullScreen,
            GoToNextPage,
            GoToPreviousPage,
            NumberOfPages,
            ShowSearchPopover,
            Zoom,
            ZoomIn,
            ZoomOut,
          } = slots;
          return (
            <div style={{ alignItems: 'center', display: 'flex', width: '100%' }}>
              <div style={{ padding: '0px 2px' }}><ShowSearchPopover /></div>
              <div style={{ padding: '0px 2px' }}><ZoomOut /></div>
              <div style={{ padding: '0px 2px' }}><Zoom /></div>
              <div style={{ padding: '0px 2px' }}><ZoomIn /></div>
              <div style={{ padding: '0px 2px', }}><GoToPreviousPage /></div>
              <div style={{ padding: '0px 2px' }}>

                <CurrentPageInput /> </div>
                
                 <div style={{ padding: '0px 2px' }}>/<NumberOfPages />  </div> 
              <div style={{ padding: '0px 2px' }}><GoToNextPage /></div>
              
            </div>
          );
        }}
      </Toolbar>
    ),
    sidebarTabs: (defaultTabs) => [defaultTabs[0]], // Only show thumbnails tab
  });

  // Responsive width for PDF viewer
  const [pageWidth, setPageWidth] = useState<number>(800);
  useEffect(() => {
    const updatePageWidth = () => {
      const containerWidth = window.innerWidth * 0.9;
      setPageWidth(Math.min(containerWidth, 1000));
    };
    updatePageWidth();
    window.addEventListener('resize', updatePageWidth);
    return () => window.removeEventListener('resize', updatePageWidth);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreenKey((k) => k + 1);
      window.dispatchEvent(new Event('resize'));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!id) {
      setError('No content ID provided.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const abortController = new AbortController();
    let blobUrl: string | null = null;

    const fetchMaterial = async () => {
      try {
        const metaRes = await fetch(`${import.meta.env.VITE_API_URL}/content/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
          signal: abortController.signal,
        });
        if (!metaRes.ok) throw new Error(`Metadata fetch failed: ${metaRes.status}`);
        const metaData = await metaRes.json();
        setMaterial(metaData.data);

        const fileRes = await fetch(`${import.meta.env.VITE_API_URL}/content/view/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
          signal: abortController.signal,
        });
        if (!fileRes.ok) throw new Error(`File fetch failed: ${fileRes.status}`);
        const blob = await fileRes.blob();
        if (blob.type !== 'application/pdf' && material?.file_type?.toLowerCase() === 'pdf') {
          throw new Error('Invalid PDF content received.');
        }
        blobUrl = URL.createObjectURL(blob);
        setContentUrl(blobUrl);
        setContentBlob(blob);
        setLoading(false);
      } catch (e) {
        if (!abortController.signal.aborted) {
          setError(`Failed to load content: ${e.message}`);
          setLoading(false);
        }
      }
    };

    fetchMaterial();

    return () => {
      abortController.abort();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [id]);

  let viewer = null;
  const normalizedType = getNormalizedType(material?.file_type || material?.type, material?.file_name || material?.title);

  if (material && contentBlob) {
    if (normalizedType === 'PDF') {
      viewer = (
        <div style={{ width: '100%', height: '100%', overflow: 'auto', background: '#fff', display: 'flex', justifyContent: 'center' }}>
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
            <Viewer
              key={fullscreenKey}
              fileUrl={contentUrl}
              plugins={[defaultLayoutPluginInstance]}
            />
          </Worker>
        </div>
      );
    } else if (normalizedType === 'IMAGE') {
      viewer = (
        <img
          src={contentUrl}
          alt={material.file_name || material.title}
          style={{ maxWidth: '100%', maxHeight: '90vh', margin: '0 auto', display: 'block', background: '#fff' }}
          onContextMenu={(e) => e.preventDefault()}
          draggable={false}
        />
      );
    } else if (normalizedType === 'VIDEO') {
      viewer = (
        <video
          src={contentUrl}
          controls
          controlsList="nodownload"
          style={{ width: '100%', maxHeight: '90vh', margin: '0 auto', display: 'block', background: '#fff' }}
          onContextMenu={(e) => e.preventDefault()}
        />
      );
    } else {
      viewer = (
        <div style={{ color: '#333', textAlign: 'center', marginTop: 40 }}>
          Preview not available for this file type.<br />
          <span style={{ fontSize: 12, color: '#888' }}>Type: {material.file_type || material.type}</span>
        </div>
      );
    }
  }

  return (
    <div style={{ background: '#f4f4f5', minHeight: '100vh', padding: 0, margin: 0 }}>

      {loading && (
        <div style={{ height: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span style={{ marginLeft: 16 }}>Loading content...</span>
        </div>
      )}
      {error && <div style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>{error}</div>}
      {!loading && !error && (!material || !contentBlob) && (
        <div style={{ color: '#333', textAlign: 'center', marginTop: 40 }}>
          No content available.<br />
          <span style={{ fontSize: 12, color: '#888' }}>Debug: material={JSON.stringify(material)} contentUrl={contentUrl}</span>
        </div>
      )}
      {!loading && !error && viewer}
      {!loading && !error && material && contentBlob && !['PDF', 'IMAGE', 'VIDEO'].includes(normalizedType) && (
        <div style={{ color: '#333', textAlign: 'center', marginTop: 20 }}>
          Unsupported file type: {material.file_type || material.type}
        </div>
      )}
    </div>
  );
};

export default ContentViewer;