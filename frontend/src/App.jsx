import { useState } from "react";
import axios from "axios";
import { toDataURL } from "qrcode";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

function App() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrImage, setQrImage] = useState("");
  const [toasts, setToasts] = useState([]);
  
  // Local storage history of shortened URLs with strict array validation
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("url_shortener_history");
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to load history from localStorage", e);
      return [];
    }
  });

  // Analytics modal state
  const [activeStats, setActiveStats] = useState(null);
  const [fetchingStatsId, setFetchingStatsId] = useState(null);

  // Utility to push customized animated toast notifications
  const triggerToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3500);
  };

  // Pre-validate inputs client-side
  const validateUrl = (input) => {
    if (!input.trim()) {
      triggerToast("Please enter a URL to shorten", "error");
      return false;
    }
    // Secure, non-nested regex to completely avoid Catastrophic Backtracking (ReDoS) locks
    const pattern = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,12})(\/.*)?$/i;
    if (!pattern.test(input.trim())) {
      triggerToast("Please enter a valid web URL address", "error");
      return false;
    }
    return true;
  };

  const handleShorten = async () => {
    if (loading) return;
    if (!validateUrl(url)) return;

    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/shorten`, {
        originalUrl: url,
      });

      const generatedShortUrl = res.data.shortUrl;
      const shortId = res.data.shortId;

      setShortUrl(generatedShortUrl);
      setCopied(false);

      // Generate premium dark-themed QR code
      const qr = await toDataURL(generatedShortUrl, {
        width: 350,
        margin: 2,
        color: {
          dark: "#0a0b10",
          light: "#ffffff",
        },
      });
      setQrImage(qr);
      triggerToast("Short Link Created!", "success");

      // Save to localStorage history (up to last 6 entries)
      const newItem = {
        shortId,
        originalUrl: url,
        shortUrl: generatedShortUrl,
        createdAt: new Date().toLocaleDateString(),
      };

      setHistory((prev) => {
        const filtered = prev.filter((item) => item.originalUrl !== url);
        const updated = [newItem, ...filtered].slice(0, 6);
        localStorage.setItem("url_shortener_history", JSON.stringify(updated));
        return updated;
      });

    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.error || "Unable to shorten URL. Server error.";
      triggerToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (textToCopy, message = "Copied to clipboard!") => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    triggerToast(message, "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchLiveStats = async (shortId, originalUrl) => {
    if (fetchingStatsId) return;
    setFetchingStatsId(shortId);

    try {
      const res = await axios.get(`${API_BASE_URL}/stats/${shortId}`);
      
      // Open the detailed analytics dashboard modal
      setActiveStats({
        shortId: res.data.shortId,
        originalUrl: res.data.originalUrl,
        shortUrl: `${API_BASE_URL}/${res.data.shortId}`,
        clicks: res.data.clicks,
        createdAt: new Date(res.data.createdAt).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric"
        })
      });
      
      triggerToast("Latest analytics loaded!", "success");
    } catch (err) {
      console.error(err);
      triggerToast("Failed to fetch live click stats", "error");
    } finally {
      setFetchingStatsId(null);
    }
  };

  const clearHistory = () => {
    localStorage.removeItem("url_shortener_history");
    setHistory([]);
    triggerToast("Your history has been cleared", "success");
  };

  return (
    <div className="relative min-h-screen bg-[#07080d] text-[#e2e8f0] flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden selection:bg-violet-600 selection:text-white font-sans">
      
      {/* 3D Tech Grid Mesh Layer - Static to prevent browser repaint load */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: "28px 28px"
        }}
      />

      {/* Heavy Premium Background Gradient Glares with slow GPU-activated pulses */}
      <div className="absolute top-[-15%] left-[-15%] w-[60%] h-[60%] bg-[#581c87]/15 rounded-full blur-[140px] pointer-events-none z-0 animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] bg-[#1e1b4b]/25 rounded-full blur-[140px] pointer-events-none z-0 animate-pulse duration-[10000ms]" />
      <div className="absolute top-[35%] right-[20%] w-[35%] h-[35%] bg-[#0369a1]/8 rounded-full blur-[110px] pointer-events-none z-0 animate-pulse duration-[12000ms]" />

      {/* Floating Sparkles effect */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff02_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none z-0" />

      {/* Slick Toast Notifications System */}
      <div className="fixed top-6 right-6 z-[60] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3.5 px-4.5 py-3.5 rounded-2xl border shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-500 animate-slide-in pointer-events-auto ${
              toast.type === "success"
                ? "bg-emerald-950/70 border-emerald-500/30 text-emerald-300 shadow-emerald-950/10"
                : "bg-rose-950/70 border-rose-500/30 text-rose-300 shadow-rose-950/10"
            }`}
          >
            {toast.type === "success" ? (
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            )}
            <p className="text-xs sm:text-sm font-bold tracking-wide">{toast.message}</p>
          </div>
        ))}
      </div>

      {/* Global Interactive Analytics Modal Dashboard */}
      {activeStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-lg bg-black/60 transition-all duration-300 animate-fade-in">
          <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-[32px] border border-white/10 bg-[#0d0e16]/90 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] animate-scale-up text-left">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-5 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-extrabold tracking-tight text-white">Live Analytics</h3>
              </div>
              <button
                onClick={() => setActiveStats(null)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Click Count Ring Indicator */}
            <div className="flex flex-col items-center justify-center py-4 mb-6">
              <div className="relative w-32 h-32 rounded-full border-4 border-violet-500/25 flex flex-col items-center justify-center bg-[#131522]/50 shadow-[0_0_40px_rgba(139,92,246,0.15)] select-none">
                {/* Glow ring */}
                <div className="absolute inset-0 rounded-full border border-violet-500/40 animate-ping opacity-25" />
                <span className="text-4xl font-black text-white tracking-tight">{activeStats.clicks}</span>
                <span className="text-[10px] font-extrabold text-violet-400 uppercase tracking-widest mt-1">Total Clicks</span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="flex flex-col gap-4">
              {/* Short URL field */}
              <div className="p-4 rounded-2xl bg-[#131522] border border-white/5 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Short Link</span>
                <div className="flex items-center justify-between gap-3">
                  <a
                    href={activeStats.shortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-bold text-white hover:text-cyan-400 transition-colors truncate underline decoration-white/10 hover:decoration-cyan-400/30"
                  >
                    {activeStats.shortUrl}
                  </a>
                  <button
                    onClick={() => handleCopy(activeStats.shortUrl, "Short link copied!")}
                    className="text-xs font-bold text-violet-400 hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Original URL field */}
              <div className="p-4 rounded-2xl bg-[#131522] border border-white/5 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Original target link</span>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-300 font-mono truncate">{activeStats.originalUrl}</span>
                  <button
                    onClick={() => handleCopy(activeStats.originalUrl, "Original URL copied!")}
                    className="text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Created Date */}
              <div className="flex items-center justify-between px-2 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-violet-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Created on
                </span>
                <span className="font-bold text-gray-200">{activeStats.createdAt}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-8">
              <button
                onClick={() => setActiveStats(null)}
                className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-sm font-bold text-white transition-all active:scale-[0.98] cursor-pointer text-center block"
              >
                Close Dashboard
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-3xl flex flex-col items-center gap-8 sm:gap-10 z-10 animate-fade-in">
        
        {/* Modern SaaS Header */}
        <div className="text-center flex flex-col gap-2">
          <div className="inline-flex self-center items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-300 font-bold text-[10px] tracking-wider uppercase mb-1 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Designed for Velocity
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight select-none">
            <span className="bg-gradient-to-r from-white via-slate-100 to-gray-400 bg-clip-text text-transparent">Sleek </span>
            <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">Shortener</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-sm sm:max-w-md mx-auto leading-relaxed">
            Convert long, clumsy links into clean, aesthetics-driven shortened links and instantly download customizable QR codes.
          </p>
        </div>

        {/* Outer Premium Card Shell */}
        <div className="w-full p-0.5 rounded-[36px] bg-gradient-to-b from-white/10 to-transparent shadow-[0_30px_70px_-20px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
          
          {/* Inner Card Container */}
          <div className="w-full p-6 sm:p-9 rounded-[34px] bg-[#0c0d15]/85 flex flex-col gap-8">
            
            {/* Input & Call to action */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1 group">
                <input
                  type="text"
                  placeholder="Paste your long link here (e.g. https://example.com/deep/path/to/analytics/report?session=active&user=premium)"
                  className="w-full px-5 py-4.5 bg-[#121420] rounded-2xl border border-white/5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500/50 focus:ring-[4px] focus:ring-violet-500/10 transition-all duration-300 pr-10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] group-hover:border-white/10"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleShorten()}
                />
                {url && (
                  <button
                    onClick={() => setUrl("")}
                    className="absolute right-4.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <button
                onClick={handleShorten}
                disabled={loading}
                className="px-8 py-4.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-2xl border border-violet-500/20 shadow-lg shadow-violet-500/10 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all duration-300 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <span>Shorten Link</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>

            {/* Showcase Output Box */}
            {shortUrl && (
              <div className="p-0.5 rounded-[24px] bg-gradient-to-r from-white/10 via-white/5 to-transparent shadow-xl animate-fade-in">
                <div className="p-5 sm:p-6 rounded-[22px] bg-[#121420]/80 backdrop-blur-lg flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                    
                    {/* Link metadata */}
                    <div className="flex-1 flex flex-col gap-2 w-full text-left">
                      <div className="inline-flex self-start items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 font-bold text-[9px] uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Short Link Active
                      </div>
                      
                      <div className="flex flex-col gap-1.5 mt-1.5">
                        <a
                          href={shortUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xl sm:text-2xl font-black text-white hover:text-cyan-300 transition-colors break-all leading-tight"
                        >
                          {shortUrl}
                        </a>
                        <span className="text-[10px] text-gray-500 truncate max-w-sm sm:max-w-md font-mono block">
                          Target: {url}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-3.5 border-t border-white/5 pt-3">
                        <button
                          onClick={() => handleCopy(shortUrl, "Copied short URL!")}
                          className="px-4.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white border border-white/10 hover:border-white/20 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer shadow-md"
                        >
                          {copied ? (
                            <>
                              <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleCopy(url, "Original link copied!")}
                          className="px-4 py-2.5 rounded-xl bg-transparent hover:bg-white/5 text-xs font-bold text-gray-500 hover:text-white transition-all cursor-pointer"
                        >
                          Copy Original Link
                        </button>
                      </div>
                    </div>

                    {/* QR Code Container */}
                    {qrImage && (
                      <div className="p-0.5 rounded-[22px] bg-gradient-to-tr from-white/10 to-transparent shrink-0 shadow-lg animate-scale-up group">
                        <div className="p-3 bg-white rounded-[20px] flex flex-col items-center">
                          <img
                            src={qrImage}
                            alt="Short URL QR Code"
                            className="w-28 h-28 select-none"
                          />
                          <a
                            href={qrImage}
                            download="shorturl-qrcode.png"
                            className="mt-2.5 text-[9px] font-black text-black hover:text-violet-600 transition-colors uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                          >
                            <span>Download QR</span>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            )}

            {/* Premium Dashboard History Grid */}
            {history.length > 0 && (
              <div className="border-t border-white/5 pt-6 flex flex-col gap-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.7)]" />
                    <h3 className="text-xs font-black tracking-widest uppercase text-white">Your History Dashboard</h3>
                  </div>
                  <button
                    onClick={clearHistory}
                    className="text-[10px] font-bold text-rose-400/80 hover:text-rose-400 hover:underline transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear All
                  </button>
                </div>

                <div className="grid gap-3">
                  {history.map((item) => (
                    <div
                      key={item.shortId}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border border-white/5 bg-[#121420]/30 hover:bg-[#121420]/75 hover:border-violet-500/30 transition-all duration-300 gap-3 group relative overflow-hidden"
                    >
                      {/* Hover subtle glowing node */}
                      <div className="absolute top-0 right-0 w-24 h-full bg-violet-600/5 blur-[25px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      
                      {/* Link Info */}
                      <div className="flex-1 flex flex-col gap-1 w-full text-left z-10">
                        <span className="text-sm font-extrabold text-white group-hover:text-violet-300 transition-colors break-all">
                          {item.shortUrl}
                        </span>
                        <span className="text-[10px] text-gray-500 break-all font-mono truncate max-w-sm sm:max-w-md block">
                          {item.originalUrl}
                        </span>
                      </div>

                      {/* Control Actions & Badges */}
                      <div className="flex items-center justify-end gap-2 w-full sm:w-auto shrink-0 border-t border-white/5 sm:border-0 pt-3 sm:pt-0 z-10">
                        
                        {/* Quick View Stats Button */}
                        <button
                          onClick={() => fetchLiveStats(item.shortId, item.originalUrl)}
                          disabled={fetchingStatsId === item.shortId}
                          title="Open Live Analytics Dashboard"
                          className="px-3.5 py-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-300 hover:text-white transition-all disabled:opacity-50 active:scale-[0.98] flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                        >
                          {fetchingStatsId === item.shortId ? (
                            <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                              </svg>
                              <span>Analytics</span>
                            </>
                          )}
                        </button>

                        {/* Action: Copy Link */}
                        <button
                          onClick={() => handleCopy(item.shortUrl, "Short URL copied!")}
                          title="Copy Link"
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white transition-all active:scale-[0.98] cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        </button>

                        {/* Action: Open in new tab */}
                        <a
                          href={item.shortUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Open Link"
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white transition-all active:scale-[0.98] flex items-center justify-center cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>

                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* High Performance Animations Injection */}
        <style>{`
          @keyframes slide-in {
            from { transform: translateX(120%) scale(0.9); opacity: 0; }
            to { transform: translateX(0) scale(1); opacity: 1; }
          }
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes scale-up {
            from { opacity: 0; transform: scale(0.94); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-slide-in {
            animation: slide-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .animate-fade-in {
            animation: fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .animate-scale-up {
            animation: scale-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
        `}</style>

      </div>
    </div>
  );
}

export default App;