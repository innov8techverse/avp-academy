import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams,useNavigate } from 'react-router-dom';

interface VideoPlayerProps {
  id?: string;
}

function formatTime(seconds: number) {
  if (!seconds || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

const VideoPlayer: React.FC<VideoPlayerProps> = () => {
  const { id } = useParams<{ id: string }>();
  const playerRef = useRef<HTMLDivElement>(null);
  const playerBgRef = useRef<HTMLDivElement>(null);
  const seekSliderRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [player, setPlayer] = useState<any>(null);
  const [isPaused, setIsPaused] = useState(true);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState<number | null>(null);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const loadYouTubeAPI = () => {
      if ((window as any).YT && (window as any).YT.Player) {
        initializePlayer();
        return;
      }
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        document.body.appendChild(script);
      }
      (window as any).onYouTubeIframeAPIReady = () => initializePlayer();
    };
    loadYouTubeAPI();

    return () => {
      if (player && typeof player.destroy === 'function') {
        try { player.destroy(); } catch (e) {}
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
    };
  }, [id]);

  const decodeVideoId = (hashedId: string): string => {
    try {
      return atob(hashedId);
    } catch (error) {
      return hashedId;
    }
  };

  const initializePlayer = () => {
    if (!playerRef.current) return;
    const newPlayer = new (window as any).YT.Player(playerRef.current, {
      width: '100%',
      height: '100%',
      videoId: decodeVideoId(id),
      playerVars: { playsinline: 1, rel: 0, controls: 0 },
      events: {
        onReady: onPlayerReady,
        onError: onPlayerError,
        onStateChange: onPlayerStateChange
      }
    });
    setPlayer(newPlayer);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const onPlayerReady = (event: any) => {
    setIsPlayerReady(true);
    setDuration(event.target.getDuration());
    setCurrent(event.target.getCurrentTime());

    if (intervalRef.current) clearInterval(intervalRef.current);

    const ytPlayer = event.target;

    intervalRef.current = setInterval(() => {
      if (ytPlayer && ytPlayer.getCurrentTime && ytPlayer.getDuration) {
        setCurrent(ytPlayer.getCurrentTime());
        setDuration(ytPlayer.getDuration());
      }
    }, 500);
  };


  const onPlayerError = (event: any) => {
    // Player error occurred
  };

  const onPlayerStateChange = (event: any) => {
    const YT = (window as any).YT;
    if (event.data === YT.PlayerState.PLAYING) {
      setIsPaused(false);
      if (isFullscreen) startHideControlsTimer();
    } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
      setIsPaused(true);
      if (isFullscreen) {
        setShowControls(true);
        clearHideControlsTimer();
      }
    }
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
    clearHideControlsTimer();
    setShowControls(true);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekToValue = parseFloat(e.target.value);
    setSeekTime(seekToValue);
  };

  const handleSeekEnd = (e?: any) => {
    if (seekTime !== null && player && typeof player.seekTo === 'function') {
      player.seekTo(seekTime, true);
    }
    setIsSeeking(false);
    setSeekTime(null);
    if (isFullscreen && !isPaused) startHideControlsTimer();
  };

  const handlePlay = () => {
    player?.playVideo?.();
    setIsPaused(false);
    if (isFullscreen) startHideControlsTimer();
  };

  const handlePause = () => {
    player?.pauseVideo?.();
    setIsPaused(true);
    setShowControls(true);
    clearHideControlsTimer();
  };

  const handleStop = () => {
    player?.stopVideo?.();
    setIsPaused(true);
    setCurrent(0);
    setSeekTime(null);
    if (isFullscreen) {
      setShowControls(true);
      clearHideControlsTimer();
    }
  };

  const handleSpeedChange = (speed: number) => {
    player?.setPlaybackRate?.(speed);
    setCurrentSpeed(speed);
    setShowControls(true);
    if (isFullscreen && !isPaused) startHideControlsTimer();
  };

  const startHideControlsTimer = useCallback(() => {
    clearHideControlsTimer();
    hideControlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);
  const clearHideControlsTimer = useCallback(() => {
    if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
    hideControlsTimeoutRef.current = null;
  }, []);

  const handleMouseMove = () => {
    if (isFullscreen) {
      setShowControls(true);
      if (!isPaused) startHideControlsTimer();
    }
  };
  const handleClick = handleMouseMove;

  const toggleSimulatedFullscreen = () => {
    const newFullscreenState = !isFullscreen;
    setIsFullscreen(newFullscreenState);
    setShowControls(true);

    if (newFullscreenState) {
      Object.assign(document.body.style, {
        margin: '0',
        padding: '0',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        overscrollBehavior: 'none',
        position: 'fixed',
        top: '0',
        left: '0'
      });
      if (!isPaused) startHideControlsTimer();
    } else {
      Object.assign(document.body.style, {
        margin: '',
        padding: '',
        width: '',
        height: '',
        overflow: '',
        overscrollBehavior: '',
        position: '',
        top: '',
        left: ''
      });
      clearHideControlsTimer();
    }
    if (newFullscreenState && isMobileDevice()) {
      setTimeout(() => {
        window.scrollTo(0, 1);
        window.dispatchEvent(new Event('resize'));
      }, 100);
    }
  };

  const isMobileDevice = () =>
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) toggleSimulatedFullscreen();
    };
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [isFullscreen]);

  const actualCurrent = isSeeking && seekTime !== null ? seekTime : current;
  const pct = duration ? (actualCurrent / duration) * 100 : 0;
  const sliderBg =
    `linear-gradient(to right, #e53935 0%, #e53935 ${pct}%, #d3d3d3 ${pct}%, #d3d3d3 100%)`;

  const backButtonStyle: React.CSSProperties = {
    position: 'relative',
    zIndex: 30,
    padding: '8px 12px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px'
  };

  const playerBgStyle: React.CSSProperties = isFullscreen ? {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', margin: 0, zIndex: 9999,
    display: 'flex', flexDirection: 'column', alignItems: 'stretch', background: '#000',
    transition: 'all 0.3s', cursor: showControls ? 'default' : 'none'
  } : {
    display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%',
    maxWidth: '920px', margin: '0 auto', background: '#000', position: 'relative', transition: 'all 0.3s',height:'auto'
  };
  const playerStyle: React.CSSProperties = isFullscreen ? { flex: 1, width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#000' }
    : { position: 'relative', width: '100%', aspectRatio: '16 / 9', backgroundColor: '#000', flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' };
  const overlayStyle = { width: '100%', height: '100%', background: 'transparent', position: 'absolute', top: 0, left: 0, zIndex: 10 } as React.CSSProperties;
  const bottomControlsStyle: React.CSSProperties = isFullscreen ? {
    position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', padding: '8px', gap: '4px',
    boxSizing: 'border-box', textAlign: 'center' as const, zIndex: 20, background: 'rgba(0,0,0,0.8)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    opacity: showControls ? 1 : 0, visibility: showControls ? 'visible' : 'hidden', transition: 'opacity 0.3s, visibility 0.3s'
  } : {
    textAlign: 'center' as const, zIndex: 20, background: '#000', padding: '10px 10px 0px 10px',
    width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '5px', flexShrink: 0
  };
  const controlsStyle: React.CSSProperties = isFullscreen ? {
    margin: 0, padding: '4px', gap: '6px', display: 'flex', justifyContent: 'center',
    alignItems: 'center', zIndex: 20, width: '100%', boxSizing: 'border-box', flexWrap: 'wrap'
  } : {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    margin: '10px 0', gap: '10px', zIndex: 20, background: '#000', padding: '10px',
    width: '100%', boxSizing: 'border-box'
  };
  const buttonStyle: React.CSSProperties = isFullscreen ? {
    padding: '4px 8px', fontSize: '12px', borderRadius: '3px', cursor: 'pointer', border: 'none',
    background: '#f0f0f0', transition: 'background 0.2s', display: 'flex', alignItems: 'center',
    gap: '4px', minWidth: '32px', justifyContent: 'center'
  } : {
    padding: '8px', cursor: 'pointer', fontSize: '16px', border: 'none',
    background: '#f0f0f0', borderRadius: '4px', transition: 'background 0.2s',
    display: 'flex', alignItems: 'center', gap: '5px'
  };
  const iconStyle: React.CSSProperties = isFullscreen ? {
    width: '14px', height: '14px', fill: 'currentColor'
  } : { width: '24px', height: '24px', fill: 'currentColor' };
  const seekContainerStyle: React.CSSProperties = isFullscreen ? {
    marginBottom: '4px', gap: '8px', width: '100%', display: 'flex', alignItems: 'center'
  } : { width: '100%', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '10px' };
  const sliderStyle: React.CSSProperties = isFullscreen ? {
    flexGrow: 1, minWidth: 0, WebkitAppearance: 'none', appearance: 'none', height: '6px',
    background: sliderBg, outline: 'none', opacity: 0.8, transition: 'opacity .2s', borderRadius: '3px'
  } : {
    flexGrow: 1, minWidth: 0, WebkitAppearance: 'none', appearance: 'none', height: '8px',
    background: sliderBg, outline: 'none', opacity: 0.7, transition: 'opacity .2s', borderRadius: '5px'
  };
  const timeDisplayStyle = isFullscreen ? { fontSize: '11px', color: '#fff', minWidth: '80px', textAlign: 'center' as const } : {
    fontSize: '14px', color: '#fff', minWidth: '80px', textAlign: 'center' as const };

  return (
    <div>
      <button
        onClick={handleGoBack}
        style={backButtonStyle}
        title="Go Back"
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.9)')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)')}
      >
        <svg style={{ width: '16px', height: '16px', fill: 'currentColor' }} viewBox="0 0 24 24">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
        Back
      </button>
    <div
      ref={playerBgRef}
      style={playerBgStyle}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    >
      <div style={playerStyle}>
        <div style={overlayStyle}></div>
        <div ref={playerRef} style={{ width: '100%', height: '100%', backgroundColor: 'black', border: 'none' }} />
      </div>
      <div style={bottomControlsStyle}>
        <div style={seekContainerStyle}>
          <input
            ref={seekSliderRef}
            type="range"
            min={0} max={duration || 1} step={0.01}
            value={isSeeking && seekTime !== null ? seekTime : current}
            style={sliderStyle}
            onChange={handleSeek}
            onInput={handleSeek}
            onMouseDown={handleSeekStart}
            onMouseUp={handleSeekEnd}
            onTouchStart={handleSeekStart}
            onTouchEnd={handleSeekEnd}
            disabled={!isPlayerReady}
          />
          <div style={timeDisplayStyle}>
            {formatTime(isSeeking && seekTime !== null ? seekTime : current)}{' / '}{formatTime(duration)}
          </div>
        </div>
        <div style={controlsStyle}>
          <button
            onClick={handlePlay}
            title="Play"
            disabled={!isPlayerReady || !isPaused}
            style={buttonStyle}
            onMouseEnter={e => (e.currentTarget.style.background = '#e0e0e0')}
            onMouseLeave={e => (e.currentTarget.style.background = '#f0f0f0')}
          >
            <svg style={iconStyle} viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </button>
          <button
            onClick={handlePause}
            title="Pause"
            disabled={!isPlayerReady || isPaused}
            style={buttonStyle}
            onMouseEnter={e => (e.currentTarget.style.background = '#e0e0e0')}
            onMouseLeave={e => (e.currentTarget.style.background = '#f0f0f0')}
          >
            <svg style={iconStyle} viewBox="0 0 24 24"><path d="M6 19h4V5H6zm8-14v14h4V5z" /></svg>
          </button>
          <button
            onClick={handleStop}
            title="Stop"
            disabled={!isPlayerReady}
            style={buttonStyle}
            onMouseEnter={e => (e.currentTarget.style.background = '#e0e0e0')}
            onMouseLeave={e => (e.currentTarget.style.background = '#f0f0f0')}
          >
            <svg style={iconStyle} viewBox="0 0 24 24"><path d="M6 6h12v12H6z" /></svg>
          </button>
          <button
            onClick={() => handleSpeedChange(1)}
            title="1x Speed"
            style={{
              ...buttonStyle, background: currentSpeed === 1 ? '#d0d0d0' : '#f0f0f0'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#e0e0e0')}
            onMouseLeave={e => (e.currentTarget.style.background = currentSpeed === 1 ? '#d0d0d0' : '#f0f0f0')}
          ><svg style={iconStyle} viewBox="0 0 24 24">
              <path d="M12 2a10 10 0 0 0-10 10 10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2zm0 18a8 8 0 0 1-8-8 8 8 0 0 1 8-8 8 8 0 0 1 8 8 8 8 0 0 1-8 8zm-2-12h4v8h-4z" />
            </svg> 1x
          </button>
          <button
            onClick={() => handleSpeedChange(2)}
            title="2x Speed"
            style={{
              ...buttonStyle, background: currentSpeed === 2 ? '#d0d0d0' : '#f0f0f0'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#e0e0e0')}
            onMouseLeave={e => (e.currentTarget.style.background = currentSpeed === 2 ? '#d0d0d0' : '#f0f0f0')}
          ><svg style={iconStyle} viewBox="0 0 24 24">
              <path d="M12 2a10 10 0 0 0-10 10 10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2zm0 18a8 8 0 0 1-8-8 8 8 0 0 1 8-8 8 8 0 0 1 8 8 8 8 0 0 1-8 8zm-2-12h4v8h-4z" />
            </svg> 2x
          </button>
          <button
            onClick={toggleSimulatedFullscreen}
            title="Fullscreen"
            style={buttonStyle}
            onMouseEnter={e => (e.currentTarget.style.background = '#e0e0e0')}
            onMouseLeave={e => (e.currentTarget.style.background = '#f0f0f0')}
          >
            <svg style={iconStyle} viewBox="0 0 24 24">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            </svg>
          </button>
        </div>
      </div>
    </div></div>
  );
};

export default VideoPlayer;
