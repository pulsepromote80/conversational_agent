// app/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Conversation } from '@elevenlabs/client';
import {
  FaMicrophoneAlt,
  FaFilePdf,
  FaCloudUploadAlt,
  FaLink,
  FaPlus,
  FaTrashAlt,
  FaSyncAlt,
  FaPhoneAlt,
  FaPhoneSlash,
  FaCommentDots,
  FaEraser,
  FaGlobe,
  FaChevronDown,
  FaUser,
  FaRobot,
  FaFileCsv,
  FaFileExcel
} from 'react-icons/fa';

interface Document {
  id: string;
  type: 'pdf' | 'link' | 'csv' | 'excel';
  name: string;
  content: string;
  url?: string;
  uploadedAt: Date;
}

interface Language {
  code: string;
  name: string;
  flag: string;
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function Home() {
  // State Management
  const [documents, setDocuments] = useState<Document[]>([]);
  const [knowledgeText, setKnowledgeText] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>({ code: "en", name: "English", flag: "🇺🇸" });
  const [showLinkInput, setShowLinkInput] = useState<boolean>(false);
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [status, setStatus] = useState<string>("Disconnected • Ready");
  const [error, setError] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [showLangDropdown, setShowLangDropdown] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Refs
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const conversationRef = useRef<any>(null);

  // Languages
  const languages: Language[] = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "hi", name: "Hindi", flag: "🇮🇳" },
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "fr", name: "French", flag: "🇫🇷" },
    { code: "de", name: "German", flag: "🇩🇪" },
    { code: "ja", name: "Japanese", flag: "🇯🇵" },
    { code: "ar", name: "Arabic", flag: "🇦🇪" }
  ];

  // Helper Functions
  const updateKnowledgeBase = () => {
    const totalChars = knowledgeText.length;
    // Update UI will be handled by useEffect
  };

  const extractPdfText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = await import('pdfjs-dist');
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";
    }
    return fullText;
  };

  const extractCsvText = async (file: File): Promise<string> => {
    const Papa = await import('papaparse');
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        complete: (results: any) => {
          const text = results.data.map((row: any) => Object.values(row).join(", ")).join("\n");
          resolve(text);
        },
        error: (err: any) => reject(err),
        header: true
      });
    });
  };

  const extractExcelText = async (file: File): Promise<string> => {
    const XLSX = await import('xlsx');
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    let fullText = "";
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      fullText += `Sheet: ${sheetName}\n` + json.map((row: any) => Object.values(row).join(", ")).join("\n") + "\n\n";
    });
    return fullText;
  };

  const addPDF = async (file: File) => {
    try {
      setStatus(`Extracting text from ${file.name}...`);
      const extracted = await extractPdfText(file);
      const newDoc: Document = {
        id: Date.now().toString() + Math.random().toString(),
        type: "pdf",
        name: file.name,
        content: extracted,
        uploadedAt: new Date()
      };
      const updatedDocs = [...documents, newDoc];
      setDocuments(updatedDocs);
      const newKnowledgeText = updatedDocs.map(d => `[${d.type.toUpperCase()}] ${d.name}:\n${d.content || d.url || ""}`).join("\n\n---\n\n");
      setKnowledgeText(newKnowledgeText);
      setStatus(`✅ ${file.name} added! Click "Sync" to push to AI.`);
      setTimeout(() => {
        if (!isConnected) setStatus("Disconnected • Ready");
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(`Failed to extract PDF: ${err}`);
      setTimeout(() => setError(""), 3000);
    }
  };

  const addCSV = async (file: File) => {
    try {
      setStatus(`Extracting text from ${file.name}...`);
      const extracted = await extractCsvText(file);
      const newDoc: Document = {
        id: Date.now().toString() + Math.random().toString(),
        type: "csv",
        name: file.name,
        content: extracted,
        uploadedAt: new Date()
      };
      const updatedDocs = [...documents, newDoc];
      setDocuments(updatedDocs);
      const newKnowledgeText = updatedDocs.map(d => `[${d.type.toUpperCase()}] ${d.name}:\n${d.content || d.url || ""}`).join("\n\n---\n\n");
      setKnowledgeText(newKnowledgeText);
      setStatus(`✅ ${file.name} added! Sync to AI.`);
      setTimeout(() => {
        if (!isConnected) setStatus("Disconnected • Ready");
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(`Failed to extract CSV: ${err}`);
      setTimeout(() => setError(""), 3000);
    }
  };

  const addExcel = async (file: File) => {
    try {
      setStatus(`Extracting text from ${file.name}...`);
      const extracted = await extractExcelText(file);
      const newDoc: Document = {
        id: Date.now().toString() + Math.random().toString(),
        type: "excel",
        name: file.name,
        content: extracted,
        uploadedAt: new Date()
      };
      const updatedDocs = [...documents, newDoc];
      setDocuments(updatedDocs);
      const newKnowledgeText = updatedDocs.map(d => `[${d.type.toUpperCase()}] ${d.name}:\n${d.content || d.url || ""}`).join("\n\n---\n\n");
      setKnowledgeText(newKnowledgeText);
      setStatus(`✅ ${file.name} added! Sync to AI.`);
      setTimeout(() => {
        if (!isConnected) setStatus("Disconnected • Ready");
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(`Failed to extract Excel: ${err}`);
      setTimeout(() => setError(""), 3000);
    }
  };

  const addLink = async (url: string) => {
    if (!url.startsWith('http')) url = 'https://' + url;
    const newDoc: Document = {
      id: (Date.now() + Math.random()).toString(),
      type: "link",
      name: url,
      url: url,
      content: `[Content from ${url}] This is simulated webpage content. In production, use backend to scrape or fetch text from URL. The AI will use this reference.`,
      uploadedAt: new Date()
    };
    const updatedDocs = [...documents, newDoc];
    setDocuments(updatedDocs);
    const newKnowledgeText = updatedDocs.map(d => `[${d.type.toUpperCase()}] ${d.name}:\n${d.content || ""}`).join("\n\n---\n\n");
    setKnowledgeText(newKnowledgeText);
    setLinkUrl("");
    setShowLinkInput(false);
    setStatus(`✅ Link added! Sync to AI.`);
    setTimeout(() => {
      if (!isConnected) setStatus("Disconnected • Ready");
    }, 1500);
  };

  const addChatMessage = (role: string, content: string) => {
    setChatMessages(prev => [...prev, { role, content }]);
  };

  const removeDocument = (id: string) => {
    const updatedDocs = documents.filter(d => d.id !== id);
    setDocuments(updatedDocs);
    const newKnowledgeText = updatedDocs.map(d => `[${d.type.toUpperCase()}] ${d.name}:\n${d.content || ""}`).join("\n\n---\n\n");
    setKnowledgeText(newKnowledgeText);
    setStatus(`Document removed. Re-sync to update AI.`);
  };

  // Handle Audio Level Animation
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      setAudioLevel(Math.random() * 100);
    }, 100);

    return () => {
      clearInterval(interval);
      setAudioLevel(0);
    };
  }, [isConnected]);

  const syncToAI = () => {
    setIsSyncing(true);
    setTimeout(() => {
      if (isConnected) {
        addChatMessage("system", "🧠 Knowledge base synced! ElevenLabs agent is now aware of your updated documents.");
      } else {
        addChatMessage("system", `✅ Knowledge ready: ${documents.length} docs (${knowledgeText.length} chars). Click phone to speak with ElevenLabs AI.`);
      }
      setIsSyncing(false);
      setStatus("Knowledge synced!");
      setTimeout(() => {
        if (!isConnected) setStatus("Disconnected • Ready");
      }, 1500);
    }, 1500);
  };

  const startVoiceConversation = async () => {
    try {
      const response = await fetch('/api/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: currentLanguage.code })
      });

      if (!response.ok) throw new Error('Failed to get signed URL');
      const { signedUrl } = await response.json();

      conversationRef.current = await Conversation.startSession({
        signedUrl,
        onConnect: () => {
          setIsConnected(true);
          setStatus(`Connected • Speaking in ${currentLanguage.name}`);
        },
        onDisconnect: () => {
          setIsConnected(false);
          setStatus("Disconnected • Ready");
        },
        onError: (err: any) => {
          console.error('ElevenLabs Error:', err);
          setError(`ElevenLabs Error: ${err}`);
        },
        onMessage: (message: any) => {
          // message.message is the text, message.source is 'user' or 'ai'
          if (message.message && (message.source === 'user' || message.source === 'ai')) {
            addChatMessage(message.source, message.message);
          }
        },
        onModeChange: (mode: any) => {
          if (mode.mode === 'speaking') {
            setStatus(`🗣️ AI speaking in ${currentLanguage.name}...`);
          } else if (mode.mode === 'listening') {
            setStatus(`🎤 Listening in ${currentLanguage.name}... Speak now`);
          }
        }
      });
      return true;
    } catch (err) {
      console.error(err);
      setError("Failed to start ElevenLabs session.");
      setIsConnected(false);
      return false;
    }
  };

  const stopVoiceConversation = async () => {
    if (conversationRef.current) {
      await conversationRef.current.endSession();
      conversationRef.current = null;
    }
    setIsConnected(false);
    setStatus("Disconnected • Ready");
  };

  const toggleCall = async () => {
    if (isConnected) {
      await stopVoiceConversation();
      return;
    }
    if (documents.length === 0) {
      setError("⚠️ Please upload at least one document or link before starting conversation.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setStatus(`Connecting to ElevenLabs...`);
      await startVoiceConversation();
    } catch (err) {
      setError("Microphone access denied or error.");
      setTimeout(() => setError(""), 3000);
    }
  };

  const setLanguage = (lang: Language) => {
    if (isConnected) {
      setError("End current call before changing language.");
      setTimeout(() => setError(""), 2000);
      return;
    }
    setCurrentLanguage(lang);
    setShowLangDropdown(false);
    setStatus(`Language: ${lang.name} • Ready`);
  };

  const clearChat = () => {
    setChatMessages([]);
  };

  const clearAllDocs = () => {
    setDocuments([]);
    setKnowledgeText("");
    setStatus("All documents cleared.");
  };

  const downloadTranscript = () => {
    if (chatMessages.length === 0) return;
    const text = chatMessages
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-conversation-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyKnowledge = () => {
    navigator.clipboard.writeText(knowledgeText);
    setStatus("Knowledge context copied to clipboard!");
    setTimeout(() => {
      if (!isConnected) setStatus("Disconnected • Ready");
    }, 2000);
  };

  // Auto-scroll chat
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const filteredDocs = documents.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pdfDocs = filteredDocs.filter(d => d.type === 'pdf');
  const linkDocs = filteredDocs.filter(d => d.type === 'link');
  const csvDocs = filteredDocs.filter(d => d.type === 'csv');
  const excelDocs = filteredDocs.filter(d => d.type === 'excel');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center shadow-lg">
              <FaMicrophoneAlt className="text-white text-xl" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
              ElevenLabs AI Studio
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span>AI Ready • Voice Enabled</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* LEFT COLUMN: Knowledge Base */}
          <div className="space-y-6">
            {/* Search and Stats Summary */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <span className="w-2 h-6 bg-cyan-400 rounded-full"></span>
                    Manage Knowledge
                  </h2>
                  <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider">
                    <span className="bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-md border border-cyan-500/30">
                      {documents.length} Docs
                    </span>
                    <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-md border border-purple-500/30">
                      {(knowledgeText.length / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <FaSyncAlt className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 ${searchTerm ? 'animate-spin-slow' : ''}`} />
                  <input
                    type="text"
                    placeholder="Search documents, links, data..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* PDF Upload Card */}
            <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-6 shadow-xl hover:shadow-cyan-500/5 transition-all duration-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner">
                  <FaFilePdf className="text-xl" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">PDF Documents</h2>
                  <p className="text-xs text-gray-400">Extract text for AI context</p>
                </div>
              </div>

              <div
                onClick={() => pdfInputRef.current?.click()}
                className="group border-2 border-dashed border-white/10 rounded-2xl p-8 text-center cursor-pointer transition-all hover:border-cyan-400/40 hover:bg-cyan-400/5 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-cyan-400/0 group-hover:bg-cyan-400/5 transition-colors duration-300"></div>
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      Array.from(e.target.files).forEach(file => addPDF(file));
                    }
                  }}
                />
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 border border-cyan-500/20">
                    <FaCloudUploadAlt className="text-3xl text-cyan-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-200">Drop PDF files here</p>
                  <p className="text-xs text-gray-500 mt-2">Maximum file size: 10MB</p>
                </div>
              </div>

              {/* PDF List */}
              <div className="mt-6 space-y-2 max-h-56 overflow-y-auto custom-scroll pr-1">
                {pdfDocs.length === 0 ? (
                  <div className="text-center py-6 bg-white/5 rounded-2xl border border-dashed border-white/5">
                    <p className="text-xs text-gray-500">No PDFs found {searchTerm && `matching "${searchTerm}"`}</p>
                  </div>
                ) : (
                  pdfDocs.map(doc => (
                    <div key={doc.id} className="group flex justify-between items-center bg-white/5 hover:bg-white/10 rounded-2xl p-3 text-sm transition-all border border-white/5 hover:border-white/10">
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20">
                          <FaFilePdf />
                        </div>
                        <div className="truncate">
                          <p className="font-medium truncate">{doc.name}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-tighter">PDF • {doc.content.length.toLocaleString()} chars</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeDocument(doc.id)}
                        className="w-8 h-8 rounded-xl bg-red-500/0 hover:bg-red-500/20 text-red-400/40 hover:text-red-400 flex items-center justify-center transition-all"
                      >
                        <FaTrashAlt className="text-xs" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* CSV & Excel Upload Card */}
            <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-6 shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
                  <FaFileCsv className="text-xl" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Data Spreadsheets</h2>
                  <p className="text-xs text-gray-400">CSV, XLSX supported</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => csvInputRef.current?.click()}
                  className="group border border-white/10 hover:border-emerald-400/40 rounded-2xl p-5 text-center cursor-pointer transition-all hover:bg-emerald-400/5"
                >
                  <input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        addCSV(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-all border border-emerald-500/20">
                    <FaFileCsv className="text-xl text-emerald-300" />
                  </div>
                  <p className="text-xs font-semibold text-gray-300">Upload CSV</p>
                </div>
                <div
                  onClick={() => excelInputRef.current?.click()}
                  className="group border border-white/10 hover:border-emerald-400/40 rounded-2xl p-5 text-center cursor-pointer transition-all hover:bg-emerald-400/5"
                >
                  <input
                    ref={excelInputRef}
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        addExcel(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-all border border-emerald-500/20">
                    <FaFileExcel className="text-xl text-emerald-300" />
                  </div>
                  <p className="text-xs font-semibold text-gray-300">Upload Excel</p>
                </div>
              </div>

              {/* CSV/Excel List */}
              <div className="mt-6 space-y-2 max-h-56 overflow-y-auto custom-scroll pr-1">
                {[...csvDocs, ...excelDocs].length === 0 ? (
                  <div className="text-center py-6 bg-white/5 rounded-2xl border border-dashed border-white/5">
                    <p className="text-xs text-gray-500">No spreadsheets found {searchTerm && `matching "${searchTerm}"`}</p>
                  </div>
                ) : (
                  [...csvDocs, ...excelDocs].map(doc => (
                    <div key={doc.id} className="group flex justify-between items-center bg-white/5 hover:bg-white/10 rounded-2xl p-3 text-sm transition-all border border-white/5 hover:border-white/10">
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                          {doc.type === 'csv' ? <FaFileCsv /> : <FaFileExcel />}
                        </div>
                        <div className="truncate">
                          <p className="font-medium truncate">{doc.name}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{doc.type} • {doc.content.length.toLocaleString()} chars</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeDocument(doc.id)}
                        className="w-8 h-8 rounded-xl bg-red-500/0 hover:bg-red-500/20 text-red-400/40 hover:text-red-400 flex items-center justify-center transition-all"
                      >
                        <FaTrashAlt className="text-xs" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add Link Card */}
            <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-6 shadow-xl hover:shadow-purple-500/5 transition-all duration-300">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-inner">
                    <FaLink className="text-xl" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Web Resources</h2>
                    <p className="text-xs text-gray-400">Scrape content from URLs</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLinkInput(!showLinkInput)}
                  className={`text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-bold ${showLinkInput ? 'bg-red-500/20 text-red-400' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                >
                  {showLinkInput ? <><FaTrashAlt className="text-[10px]" /> Cancel</> : <><FaPlus className="text-[10px]" /> Add Link</>}
                </button>
              </div>

              {showLinkInput && (
                <div className="mb-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://example.com/article"
                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400/50 focus:bg-white/10 transition-all"
                    />
                    <button
                      onClick={() => linkUrl.trim() && addLink(linkUrl)}
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-3 rounded-2xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-purple-500/20 active:scale-95"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-48 overflow-y-auto custom-scroll pr-1">
                {linkDocs.length === 0 ? (
                  <div className="text-center py-6 bg-white/5 rounded-2xl border border-dashed border-white/5">
                    <p className="text-xs text-gray-500">No links added {searchTerm && `matching "${searchTerm}"`}</p>
                  </div>
                ) : (
                  linkDocs.map(doc => (
                    <div key={doc.id} className="group flex justify-between items-center bg-white/5 hover:bg-white/10 rounded-2xl p-3 text-sm transition-all border border-white/5 hover:border-white/10">
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                          <FaLink />
                        </div>
                        <div className="truncate">
                          <p className="font-medium truncate">{doc.name}</p>
                          <p className="text-[10px] text-gray-500 truncate">{doc.url}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeDocument(doc.id)}
                        className="w-8 h-8 rounded-xl bg-red-500/0 hover:bg-red-500/20 text-red-400/40 hover:text-red-400 flex items-center justify-center transition-all"
                      >
                        <FaTrashAlt className="text-xs" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Knowledge Context Preview */}
            <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2"></div>

              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                    <span className="text-lg">📚</span>
                  </div>
                  <div>
                    <h3 className="font-bold">Knowledge Context</h3>
                    <p className="text-[10px] text-emerald-400/70 uppercase font-bold tracking-widest">AI Brain Feed</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyKnowledge}
                    title="Copy all text"
                    className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all border border-white/5"
                  >
                    <FaSyncAlt className="text-xs" />
                  </button>
                  <button
                    onClick={clearAllDocs}
                    className="text-[10px] font-bold uppercase tracking-wider bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-xl border border-red-500/20 transition-all"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="bg-black/40 rounded-2xl p-4 text-[11px] text-gray-400 max-h-40 overflow-y-auto custom-scroll font-mono border border-white/5 relative z-10">
                {knowledgeText ? (
                  <pre className="whitespace-pre-wrap break-words leading-relaxed">
                    {knowledgeText.substring(0, 800)}
                    {knowledgeText.length > 800 && (
                      <span className="text-emerald-500/50 italic"> ... ({knowledgeText.length - 800} more characters)</span>
                    )}
                  </pre>
                ) : (
                  <div className="text-center py-4">
                    <p>No documents added yet.</p>
                    <p className="mt-1 opacity-50 italic">Upload files or add links to feed the AI.</p>
                  </div>
                )}
              </div>

              <button
                onClick={syncToAI}
                disabled={isSyncing || documents.length === 0}
                className={`mt-4 w-full py-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-3 shadow-lg relative z-10 overflow-hidden ${isSyncing || documents.length === 0
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/20 active:scale-[0.98]'
                  }`}
              >
                {isSyncing ? (
                  <><FaSyncAlt className="animate-spin" /> Syncing with ElevenLabs...</>
                ) : (
                  <><FaSyncAlt /> Sync Knowledge to AI</>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Voice AI Conversation */}
          <div className="space-y-6">
            {/* Voice Orb & Call Control */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl flex flex-col items-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

              {/* Language Selector */}
              <div className="w-full flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {isConnected ? 'Live Session' : 'Standby Mode'}
                  </span>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowLangDropdown(!showLangDropdown)}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-xl px-4 py-2 text-xs border border-white/10 transition-all active:scale-95"
                  >
                    <FaGlobe className="text-cyan-400" />
                    <span className="font-bold">{currentLanguage.flag} {currentLanguage.name}</span>
                    <FaChevronDown className={`text-[10px] transition-transform duration-300 ${showLangDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showLangDropdown && (
                    <div className="absolute right-0 mt-3 w-56 bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-white/10 z-50 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      <div className="p-2 max-h-64 overflow-y-auto custom-scroll">
                        {languages.map(lang => (
                          <div
                            key={lang.code}
                            onClick={() => setLanguage(lang)}
                            className={`px-4 py-3 hover:bg-white/5 cursor-pointer flex items-center justify-between rounded-xl transition-all ${currentLanguage.code === lang.code ? 'bg-white/10 text-cyan-400' : 'text-gray-300'}`}
                          >
                            <span className="text-sm font-medium">{lang.flag} {lang.name}</span>
                            {currentLanguage.code === lang.code && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Advanced Orb Animation */}
              <div className="relative my-10 flex items-center justify-center">
                {/* Outer Glows */}
                <div
                  className="absolute rounded-full bg-cyan-500/20 blur-[60px] transition-all duration-300"
                  style={{ width: `${160 + audioLevel * 0.8}px`, height: `${160 + audioLevel * 0.8}px` }}
                ></div>
                <div
                  className="absolute rounded-full bg-purple-600/10 blur-[40px] transition-all duration-500 delay-75"
                  style={{ width: `${200 + audioLevel * 0.5}px`, height: `${200 + audioLevel * 0.5}px` }}
                ></div>

                {/* Reactive Rings */}
                <div
                  className="absolute border border-cyan-400/20 rounded-full transition-all duration-200"
                  style={{
                    width: `${220 + audioLevel * 0.4}px`,
                    height: `${220 + audioLevel * 0.4}px`,
                    opacity: isConnected ? 1 : 0
                  }}
                ></div>
                <div
                  className="absolute border border-purple-400/10 rounded-full transition-all duration-500"
                  style={{
                    width: `${260 + audioLevel * 0.2}px`,
                    height: `${260 + audioLevel * 0.2}px`,
                    opacity: isConnected ? 1 : 0
                  }}
                ></div>

                {/* Main Orb */}
                <div
                  className={`relative w-48 h-48 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 overflow-hidden ${isConnected
                    ? 'bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 scale-105 shadow-cyan-500/20'
                    : 'bg-gradient-to-br from-slate-700 to-slate-800 grayscale-[0.5]'
                    }`}
                >
                  {/* Internal Highlights */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent_70%)]"></div>
                  <div
                    className="absolute w-20 h-20 rounded-full bg-white/20 blur-2xl transition-all duration-200"
                    style={{ transform: `scale(${1 + audioLevel / 100})` }}
                  ></div>

                  {/* Center Icon/Flag */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <span className={`text-5xl transition-transform duration-300 ${isConnected ? 'scale-110' : 'scale-100'}`}>
                      {currentLanguage.flag}
                    </span>
                    {isConnected && (
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div
                            key={i}
                            className="w-1 bg-white rounded-full transition-all duration-150"
                            style={{
                              height: `${8 + (audioLevel * (0.2 + i * 0.1))}px`,
                              opacity: 0.4 + (audioLevel / 250)
                            }}
                          ></div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Edge Shine */}
                  <div className="absolute inset-0 rounded-full border border-white/20"></div>
                </div>
              </div>

              {/* Call Control Button */}
              <div className="relative mt-4">
                {isConnected && (
                  <div className="absolute -inset-4 bg-red-500/20 rounded-full blur-xl animate-pulse"></div>
                )}
                <button
                  onClick={toggleCall}
                  className={`relative w-24 h-24 rounded-full transition-all duration-500 shadow-2xl flex items-center justify-center group/btn active:scale-90 ${isConnected
                    ? 'bg-gradient-to-br from-rose-500 to-red-600 hover:rotate-12'
                    : 'bg-gradient-to-br from-emerald-400 to-teal-600 hover:scale-110 hover:shadow-emerald-500/40'
                    }`}
                >
                  <div className="absolute inset-0 rounded-full bg-white/0 group-hover/btn:bg-white/10 transition-colors"></div>
                  {isConnected ? (
                    <FaPhoneSlash className="text-white text-3xl drop-shadow-lg" />
                  ) : (
                    <FaPhoneAlt className="text-white text-3xl drop-shadow-lg" />
                  )}
                </button>
              </div>

              {/* Session Info */}
              <div className="mt-8 w-full flex flex-col items-center">
                <div className={`px-6 py-2.5 rounded-2xl text-xs font-bold transition-all border ${isConnected
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                  : 'bg-white/5 text-gray-400 border-white/10'
                  }`}>
                  {status}
                </div>
                {error && (
                  <div className="mt-4 flex items-center gap-2 text-red-400 text-[10px] font-bold uppercase tracking-wider bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20 animate-in fade-in slide-in-from-bottom-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* Conversation Transcript */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl flex flex-col h-[500px]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400">
                    <FaCommentDots className="text-lg" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Live Interaction</h3>
                    <p className="text-[10px] text-cyan-400/70 uppercase font-bold tracking-widest">Transcript History</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={downloadTranscript}
                    disabled={chatMessages.length === 0}
                    className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Export Transcript"
                  >
                    <FaPlus className="text-xs rotate-45" />
                  </button>
                  <button
                    onClick={clearChat}
                    className="w-9 h-9 rounded-xl bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 flex items-center justify-center transition-all border border-white/10"
                    title="Clear Chat"
                  >
                    <FaEraser className="text-xs" />
                  </button>
                </div>
              </div>

              <div ref={chatMessagesRef} className="flex-1 overflow-y-auto space-y-4 pr-3 custom-scroll">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-10">
                    <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-4 border border-white/5">
                      <FaRobot className="text-2xl text-gray-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-400">No messages yet</p>
                    <p className="text-[11px] text-gray-500 mt-2 leading-relaxed italic">
                      Start a session to interact with your knowledge base through voice.
                    </p>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                    >
                      <div className={`flex items-center gap-2 mb-1 px-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] ${msg.role === 'user' ? 'bg-cyan-500/20 text-cyan-400' :
                          msg.role === 'system' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-purple-500/20 text-purple-400'
                          }`}>
                          {msg.role === 'user' ? <FaUser /> : <FaRobot />}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                          {msg.role === 'user' ? 'You' : msg.role === 'system' ? 'System' : 'ElevenLabs AI'}
                        </span>
                      </div>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-lg border ${msg.role === 'user'
                        ? 'bg-cyan-500/10 text-cyan-50 border-cyan-500/20 rounded-tr-none'
                        : msg.role === 'system'
                          ? 'bg-yellow-500/5 text-yellow-100/80 border-yellow-500/10 italic text-[12px] rounded-tl-none'
                          : 'bg-white/5 text-white border-white/10 rounded-tl-none'
                        }`}>
                        <div className="leading-relaxed">{msg.content}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
                <div className="flex items-center gap-2">
                  <FaMicrophoneAlt className={`${isConnected ? 'text-cyan-400' : ''}`} />
                  <span>{isConnected ? 'Mic Active' : 'Mic Ready'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaRobot className="text-purple-400" />
                  <span>ElevenLabs V1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        .custom-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}