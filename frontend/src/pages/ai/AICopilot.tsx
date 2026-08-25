import { useEffect, useState, useRef, type FormEvent } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  Copy,
  Cpu,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Key,
  Loader2,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Search,
  Send,
  Settings as SettingsIcon,
  ShieldAlert,
  Sparkles,
  Trash2,
  User,
  X,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { getMyWorkspaces, type Workspace } from "../../services/workspace";
import {
  chatAI,
  getAIDailyStandup,
  getAISprintAnalysis,
  searchAIKnowledge,
  type DailyStandupResponse,
  type KnowledgeSearchResponse,
  type SprintAnalysisResponse,
} from "../../services/ai";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  modelUsed?: string;
  provider?: string;
  attachment?: {
    name: string;
    type: string;
    previewUrl?: string;
    isImage: boolean;
  };
  suggestedAction?: {
    label: string;
    path: string;
  };
}

type AIMode = "chat" | "standup" | "sprint" | "knowledge";

export default function AICopilot() {
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [activeMode, setActiveMode] = useState<AIMode>("chat");
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);

  // External AI Settings
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [provider, setProvider] = useState<string>(() => localStorage.getItem("ai_provider") || "openai");
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem("ai_api_key") || "");
  const [model, setModel] = useState<string>(() => localStorage.getItem("ai_model") || "gpt-4o-mini");
  const [endpoint, setEndpoint] = useState<string>(() => localStorage.getItem("ai_endpoint") || "");

  // Chat & File Upload State
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    type: string;
    base64: string;
    previewUrl?: string;
    isImage: boolean;
  } | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Hello! I am your AI Workspace Copilot. I have real-time visibility into your deliverables, sprint velocity, and team capacity. You can ask me anything about your project codebase, tasks, architecture, or sprint strategy.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      modelUsed: "workspace-grounded",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Standup Agent State
  const [standup, setStandup] = useState<DailyStandupResponse | null>(null);
  const [loadingStandup, setLoadingStandup] = useState(false);
  const [copiedStandup, setCopiedStandup] = useState(false);

  // Sprint Health State
  const [sprintAnalysis, setSprintAnalysis] = useState<SprintAnalysisResponse | null>(null);
  const [loadingSprint, setLoadingSprint] = useState(false);

  // Knowledge Base State
  const [knowledgeQuery, setKnowledgeQuery] = useState("");
  const [knowledgeResult, setKnowledgeResult] = useState<KnowledgeSearchResponse | null>(null);
  const [searchingKnowledge, setSearchingKnowledge] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        setLoadingWorkspace(true);
        const workspaces = await getMyWorkspaces();
        if (workspaces.length > 0) {
          setWorkspace(workspaces[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingWorkspace(false);
      }
    }
    void init();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Feature 2: Global clipboard paste listener — fires anywhere on page when in chat mode
  useEffect(() => {
    if (activeMode !== "chat") return;

    function onWindowPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const namedFile = new File(
              [file],
              `clipboard-paste-${Date.now()}.png`,
              { type: item.type },
            );
            loadFileIntoState(namedFile);
          }
          break;
        }
      }
    }

    window.addEventListener("paste", onWindowPaste);
    return () => {
      window.removeEventListener("paste", onWindowPaste);
    };
  }, [activeMode]);

  function saveAISettings() {
    localStorage.setItem("ai_provider", provider);
    localStorage.setItem("ai_api_key", apiKey);
    localStorage.setItem("ai_model", model);
    localStorage.setItem("ai_endpoint", endpoint);
    setSettingsOpen(false);
  }

  /* Load Standup Report */
  async function loadStandupReport() {
    if (!workspace) return;
    try {
      setLoadingStandup(true);
      const data = await getAIDailyStandup(workspace.id);
      setStandup(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStandup(false);
    }
  }

  /* Load Sprint Diagnostics */
  async function loadSprintDiagnostics() {
    if (!workspace) return;
    try {
      setLoadingSprint(true);
      const data = await getAISprintAnalysis(workspace.id);
      setSprintAnalysis(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSprint(false);
    }
  }

  /* Search Knowledge Base */
  async function handleKnowledgeSearch(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!workspace || !knowledgeQuery.trim()) return;
    try {
      setSearchingKnowledge(true);
      const data = await searchAIKnowledge(workspace.id, knowledgeQuery.trim());
      setKnowledgeResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingKnowledge(false);
    }
  }

  function loadFileIntoState(file: File) {
    const isImage = file.type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(",")[1] || "";
      setSelectedFile({
        name: file.name,
        type: file.type || (isImage ? "image/png" : "application/octet-stream"),
        base64: base64Data,
        previewUrl: isImage ? result : undefined,
        isImage,
      });
    };
    reader.readAsDataURL(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    loadFileIntoState(file);
    e.target.value = "";
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFileIntoState(file);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const namedFile = new File([file], `clipboard-paste-${Date.now()}.png`, { type: item.type });
          loadFileIntoState(namedFile);
        }
        break;
      }
    }
  }


  function handleClearChat() {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "assistant",
        text: "Hello! I am your AI Workspace Copilot. I have real-time visibility into your deliverables, sprint velocity, and team capacity. You can ask me anything about your project codebase, tasks, architecture, or sprint strategy.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: "workspace-grounded",
      },
    ]);
    setSelectedFile(null);
    setInput("");
  }

  async function handleSend(queryText?: string) {
    const textToSend = (queryText || input).trim();
    if ((!textToSend && !selectedFile) || !workspace) return;

    const currentFile = selectedFile;
    setSelectedFile(null);

    const userMessage: ChatMessage = {
      id: String(Date.now()),
      sender: "user",
      text: textToSend || (currentFile ? `[Uploaded ${currentFile.isImage ? "Photo" : "File"}: ${currentFile.name}]` : ""),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      attachment: currentFile ? {
        name: currentFile.name,
        type: currentFile.type,
        previewUrl: currentFile.previewUrl,
        isImage: currentFile.isImage,
      } : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!queryText) setInput("");
    setIsTyping(true);

    try {
      const historyPayload = messages
        .filter((m) => m.id !== "welcome")
        .slice(-6)
        .map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        }));

      const res = await chatAI(workspace.id, {
        prompt: textToSend || `Please analyze this attached ${currentFile?.isImage ? "photo" : "file"}.`,
        provider,
        api_key: apiKey.trim() || undefined,
        model: model.trim() || undefined,
        endpoint: endpoint.trim() || undefined,
        history: historyPayload,
        file_name: currentFile?.name,
        file_type: currentFile?.type,
        file_data: currentFile?.base64,
      });

      const assistantMessage: ChatMessage = {
        id: String(Date.now() + 1),
        sender: "assistant",
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: res.model_used,
        provider: res.provider,
        suggestedAction: res.suggested_action,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      const assistantMessage: ChatMessage = {
        id: String(Date.now() + 1),
        sender: "assistant",
        text: "I encountered an error reaching the AI service. Please verify your network or check API key settings.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsTyping(false);
    }
  }

  if (loadingWorkspace) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="animate-spin text-indigo-300" size={28} />
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-[calc(100vh-140px)] max-w-6xl flex-col space-y-4">
      {/* Background Ambient Glows */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[20%] top-[15%] h-[400px] w-[400px] rounded-full bg-indigo-600/[0.08] blur-[150px]" />
        <div className="absolute right-[15%] bottom-[15%] h-[450px] w-[450px] rounded-full bg-purple-600/[0.08] blur-[160px]" />
      </div>

      {/* HEADER WITH MULTI-MODE TABS */}
      <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_25px_rgba(99,102,241,0.4)]">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">AI Intelligence Command Center</h1>
              <span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-300">
                {apiKey ? `${provider.toUpperCase()} (${model})` : "Workspace Intelligence"}
              </span>
            </div>
            <p className="text-xs text-white/40">
              Autonomous agents, external LLM chat, and knowledge retrieval for {workspace?.name || "your workspace"}
            </p>
          </div>
        </div>

        {/* AGENT MODE SWITCHER & SETTINGS */}
        <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.035] p-1 scrollbar-none">
          {[
            { id: "chat", label: "Copilot Chat", icon: MessageSquare },
            { id: "standup", label: "Daily Standup", icon: FileText },
            { id: "sprint", label: "Sprint Diagnostics", icon: Zap },
            { id: "knowledge", label: "Knowledge Search", icon: Search },
          ].map((mode) => {
            const Icon = mode.icon;
            const active = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  setActiveMode(mode.id as AIMode);
                  if (mode.id === "standup" && !standup) void loadStandupReport();
                  if (mode.id === "sprint" && !sprintAnalysis) void loadSprintDiagnostics();
                }}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-indigo-500/20 text-indigo-200 shadow-md shadow-indigo-500/15"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon size={14} className={active ? "text-indigo-300" : "text-white/40"} />
                <span>{mode.label}</span>
              </button>
            );
          })}

          {activeMode === "chat" && (
            <button
              type="button"
              onClick={handleClearChat}
              title="Clear chat history"
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/25 bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20 hover:text-rose-200"
            >
              <Trash2 size={13} className="text-rose-400" />
              <span>Clear Chat</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            title="Configure External AI Model & API Key"
            className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <SettingsIcon size={13} className="text-indigo-300" />
            <span className="hidden sm:inline">AI Settings</span>
          </button>
        </div>
      </div>

      {/* MODE 1: COPILOT CHAT STREAM */}
      {activeMode === "chat" && (
        <div
          className={`relative flex flex-1 flex-col space-y-4 overflow-hidden transition-all ${
            isDraggingOver ? "ring-2 ring-indigo-400/60 ring-inset rounded-2xl" : ""
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drag overlay */}
          {isDraggingOver && (
            <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-400/70 bg-indigo-500/10 backdrop-blur-sm">
              <ImageIcon size={36} className="text-indigo-300" />
              <p className="mt-3 text-sm font-semibold text-indigo-200">Drop file to attach to AI</p>
              <p className="mt-1 text-xs text-indigo-300/60">Images, PDFs, code, docs accepted</p>
            </div>
          )}
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.sender === "assistant" && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/15 text-indigo-300 shadow-lg">
                      <Bot size={17} />
                    </div>
                  )}

                  <div
                    className={`max-w-2xl rounded-2xl p-4 shadow-xl backdrop-blur-xl ${
                      message.sender === "user"
                        ? "border border-indigo-400/30 bg-gradient-to-r from-indigo-600/80 to-purple-600/80 text-white"
                        : "border border-white/[0.08] bg-white/[0.04] text-white/90"
                    }`}
                  >
                    {message.sender === "assistant" && message.modelUsed && (
                      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold text-indigo-300">
                        <Cpu size={12} />
                        <span>{message.modelUsed}</span>
                      </div>
                    )}

                    {message.attachment && (
                      <div className="mb-3">
                        {message.attachment.isImage && message.attachment.previewUrl ? (
                          <img
                            src={message.attachment.previewUrl}
                            alt={message.attachment.name}
                            className="max-h-48 max-w-full rounded-xl object-cover border border-white/20 shadow-md"
                          />
                        ) : (
                          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-medium text-indigo-200">
                            <Paperclip size={14} className="text-indigo-300" />
                            <span className="truncate">{message.attachment.name}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-sm leading-6 whitespace-pre-line">{message.text}</p>

                    {message.suggestedAction && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => navigate(message.suggestedAction!.path)}
                          className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 hover:scale-[1.02]"
                        >
                          <span>{message.suggestedAction.label}</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    )}

                    <p className="mt-1 text-right text-[10px] text-white/30">{message.timestamp}</p>
                  </div>

                  {message.sender === "user" && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white shadow-lg">
                      <User size={17} />
                    </div>
                  )}
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/15 text-indigo-300">
                    <Bot size={17} />
                  </div>
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-xs text-white/40 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-indigo-400" />
                    <span>Analyzing workspace telemetry...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              "Generate Daily Standup report",
              "Diagnose sprint health & blocker risk",
              "Summarize overdue deliverables",
              "Recommend team workload balance",
            ].map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => handleSend(text)}
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-white/60 transition hover:border-indigo-400/30 hover:bg-indigo-500/10 hover:text-white"
              >
                <Sparkles size={12} className="text-indigo-400" />
                <span>{text}</span>
              </button>
            ))}
          </div>

          {/* Selected Attachment Preview Box */}
          {selectedFile && (
            <div className="flex items-center justify-between rounded-2xl border border-indigo-400/30 bg-indigo-500/10 px-4 py-2 text-xs text-white backdrop-blur-xl">
              <div className="flex items-center gap-2.5 overflow-hidden">
                {selectedFile.isImage && selectedFile.previewUrl ? (
                  <img
                    src={selectedFile.previewUrl}
                    alt={selectedFile.name}
                    className="h-9 w-9 rounded-lg object-cover border border-white/20"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
                    <Paperclip size={16} />
                  </div>
                )}
                <div className="truncate">
                  <p className="font-semibold text-indigo-200 truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-white/50">{selectedFile.isImage ? "Photo ready for AI analysis" : "File attached"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="rounded-lg p-1 text-white/40 hover:bg-white/10 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Chat Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] p-2 shadow-2xl backdrop-blur-2xl focus-within:border-indigo-400/50"
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.txt,.json,.csv,.js,.ts,.py,.md,.doc,.docx,.zip"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload photo or file to AI"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-indigo-300 transition hover:bg-white/10 hover:text-white"
            >
              <Paperclip size={17} />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPaste={handlePaste}
              placeholder={selectedFile ? `Ask AI about ${selectedFile.name}...` : "Ask AI Copilot… or drag & drop / Ctrl+V to paste an image"}
              className="h-10 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-white/30"
            />
            <button
              type="submit"
              disabled={(!input.trim() && !selectedFile) || isTyping}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25 transition hover:scale-105 disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* MODE 2: DAILY STANDUP AGENT */}
      {activeMode === "standup" && (
        <div className="flex-1 overflow-y-auto space-y-6 rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-7 backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Autonomous Daily Standup Agent</h2>
              <p className="text-xs text-white/40">Synthesizes completed tasks, active work, and blockers across all projects.</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={loadStandupReport}
                disabled={loadingStandup}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.08]"
              >
                <RefreshCw size={13} className={loadingStandup ? "animate-spin" : ""} />
                <span>Regenerate</span>
              </button>

              {standup && (
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(standup.summary_markdown);
                    setCopiedStandup(true);
                    setTimeout(() => setCopiedStandup(false), 2000);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-500/20 px-3.5 py-2 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-500/30"
                >
                  <Copy size={13} />
                  <span>{copiedStandup ? "Copied to Clipboard!" : "Copy Report"}</span>
                </button>
              )}
            </div>
          </div>

          {loadingStandup ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center">
              <Loader2 size={28} className="animate-spin text-indigo-300" />
              <p className="mt-3 text-xs text-white/40">Agent is synthesizing sprint deliverables...</p>
            </div>
          ) : standup ? (
            <div className="space-y-6">
              {/* Standup Content Columns */}
              <div className="grid gap-4 md:grid-cols-3">
                {/* Completed */}
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.04] p-5">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 size={16} />
                    <h3 className="text-sm font-semibold">Completed Recently</h3>
                  </div>
                  <ul className="mt-3 space-y-2 text-xs text-white/70">
                    {standup.completed_recent.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* In Progress */}
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.04] p-5">
                  <div className="flex items-center gap-2 text-cyan-300">
                    <Clock size={16} />
                    <h3 className="text-sm font-semibold">In Flight Today</h3>
                  </div>
                  <ul className="mt-3 space-y-2 text-xs text-white/70">
                    {standup.in_progress_today.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-cyan-400">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Blockers */}
                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/[0.04] p-5">
                  <div className="flex items-center gap-2 text-rose-300">
                    <AlertTriangle size={16} />
                    <h3 className="text-sm font-semibold">Blockers & Risks</h3>
                  </div>
                  <ul className="mt-3 space-y-2 text-xs text-white/70">
                    {standup.blockers_and_risks.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-rose-400">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Raw Markdown Card */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5 font-mono text-xs text-white/80 whitespace-pre-wrap">
                {standup.summary_markdown}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-white/40">No standup generated yet. Click Regenerate.</div>
          )}
        </div>
      )}

      {/* MODE 3: SPRINT DIAGNOSTICS & PREDICTOR */}
      {activeMode === "sprint" && (
        <div className="flex-1 overflow-y-auto space-y-6 rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-7 backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">AI Sprint Health Diagnostics</h2>
              <p className="text-xs text-white/40">Predictive risk modeling, blocker detection, and pacing guidance.</p>
            </div>
            <button
              type="button"
              onClick={loadSprintDiagnostics}
              disabled={loadingSprint}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.08]"
            >
              <RefreshCw size={13} className={loadingSprint ? "animate-spin" : ""} />
              <span>Refresh Diagnostics</span>
            </button>
          </div>

          {loadingSprint ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center">
              <Loader2 size={28} className="animate-spin text-indigo-300" />
              <p className="mt-3 text-xs text-white/40">Calculating predictive health score...</p>
            </div>
          ) : sprintAnalysis ? (
            <div className="space-y-6">
              {/* Score & Pacing KPI */}
              <div className="grid gap-5 sm:grid-cols-3">
                <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-5">
                  <p className="text-xs text-white/50">Sprint Health Score</p>
                  <p className="mt-2 text-4xl font-bold text-indigo-300">{sprintAnalysis.health_score}/100</p>
                  <p className="mt-1 text-xs text-white/40">Status: {sprintAnalysis.health_status}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                  <p className="text-xs text-white/50">Deliverable Velocity</p>
                  <p className="mt-2 text-4xl font-bold text-white">
                    {sprintAnalysis.completed_tasks} / {sprintAnalysis.total_tasks}
                  </p>
                  <p className="mt-1 text-xs text-emerald-400">Finished in active sprint</p>
                </div>

                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/[0.05] p-5">
                  <p className="text-xs text-rose-300">Overdue Risk</p>
                  <p className="mt-2 text-4xl font-bold text-rose-300">{sprintAnalysis.overdue_tasks}</p>
                  <p className="mt-1 text-xs text-white/40">Overdue deliverables</p>
                </div>
              </div>

              {/* Predicted Blockers */}
              <div className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.05] p-5">
                <div className="flex items-center gap-2 text-amber-300">
                  <ShieldAlert size={18} />
                  <h3 className="text-sm font-semibold">Predicted Risks & Blockers</h3>
                </div>
                <ul className="mt-3 space-y-2 text-xs text-white/80">
                  {sprintAnalysis.predicted_blockers.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-400">⚠️</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* AI Strategic Recommendations */}
              <div className="rounded-2xl border border-indigo-400/20 bg-white/[0.025] p-5">
                <div className="flex items-center gap-2 text-indigo-300">
                  <Sparkles size={18} />
                  <h3 className="text-sm font-semibold">AI Strategic Recommendations</h3>
                </div>
                <ul className="mt-3 space-y-2 text-xs text-white/80">
                  {sprintAnalysis.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-indigo-400">💡</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-white/40">No sprint data loaded.</div>
          )}
        </div>
      )}

      {/* MODE 4: RAG & KNOWLEDGE BASE SEARCH */}
      {activeMode === "knowledge" && (
        <div className="flex-1 overflow-y-auto space-y-6 rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-7 backdrop-blur-2xl">
          <div>
            <h2 className="text-xl font-bold text-white">Semantic Knowledge Base & Doc Search</h2>
            <p className="text-xs text-white/40">Ask questions across project scopes, deliverable requirements, and architecture specs.</p>
          </div>

          <form onSubmit={handleKnowledgeSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={knowledgeQuery}
                onChange={(e) => setKnowledgeQuery(e.target.value)}
                placeholder="e.g. What is the scope of Project Aurora? What tasks are high priority?"
                className="h-11 w-full rounded-2xl border border-white/10 bg-black/30 pl-11 pr-4 text-xs text-white outline-none focus:border-indigo-400/50"
              />
            </div>
            <button
              type="submit"
              disabled={searchingKnowledge || !knowledgeQuery.trim()}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-5 text-xs font-semibold text-white disabled:opacity-50"
            >
              {searchingKnowledge ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              <span>Search</span>
            </button>
          </form>

          {searchingKnowledge ? (
            <div className="flex min-h-[250px] flex-col items-center justify-center">
              <Loader2 size={24} className="animate-spin text-indigo-300" />
              <p className="mt-3 text-xs text-white/40">Searching workspace knowledge documents...</p>
            </div>
          ) : knowledgeResult ? (
            <div className="space-y-5">
              {/* Answer Synthesis */}
              <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/[0.08] p-5">
                <div className="flex items-center gap-2 text-indigo-300">
                  <Sparkles size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wider">AI Knowledge Synthesis</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-white/90">{knowledgeResult.answer}</p>
              </div>

              {/* Matched Documents */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                  Matched Deliverables & Project Context ({knowledgeResult.results.length})
                </p>
                {knowledgeResult.results.map((res) => (
                  <div key={res.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase text-indigo-300">
                        {res.type}
                      </span>
                      <h4 className="text-sm font-semibold text-white">{res.title}</h4>
                    </div>
                    <p className="mt-1 text-xs text-white/50">{res.snippet}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
              <HelpCircle size={28} className="mx-auto text-white/20" />
              <p className="mt-3 text-xs text-white/40">Enter a query above to search knowledge base records.</p>
            </div>
          )}
        </div>
      )}

      {/* AI PROVIDER & MODEL SETTINGS MODAL */}
      <AnimatePresence>
        {settingsOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
            onClick={() => setSettingsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[#0d0e1a]/95 p-6 shadow-2xl backdrop-blur-3xl"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
                    <Key size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">External AI Provider Settings</h3>
                    <p className="text-xs text-white/40">Configure custom LLMs or OpenAI/Groq keys</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="rounded-xl p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 space-y-4 text-xs">
                <div>
                  <label className="mb-1.5 block font-medium text-white/70">AI Provider</label>
                  <select
                    value={provider}
                    onChange={(e) => {
                      const p = e.target.value;
                      setProvider(p);
                      if (p === "openai") setModel("gpt-4o-mini");
                      else if (p === "groq") setModel("llama-3.3-70b-versatile");
                      else if (p === "openrouter") setModel("anthropic/claude-3.5-sonnet");
                      else if (p === "custom") setModel("custom-model");
                    }}
                    className="h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-white outline-none focus:border-indigo-400"
                  >
                    <option value="openai">OpenAI (GPT-4o, GPT-4o-mini)</option>
                    <option value="groq">Groq (Ultra-fast Llama 3.3 70B, Mixtral)</option>
                    <option value="openrouter">OpenRouter (Claude 3.5, Gemini 1.5, DeepSeek)</option>
                    <option value="custom">Custom Endpoint (e.g. Local Ollama / vLLM)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block font-medium text-white/70">
                    API Key <span className="text-white/30 font-normal">(stored securely in your browser)</span>
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-... or gsk_..."
                    className="h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 font-mono text-xs text-white outline-none placeholder:text-white/20 focus:border-indigo-400"
                  />
                  <p className="mt-1 text-[10px] text-white/30">
                    Leave blank to use the built-in Intelligent Workspace heuristics engine.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block font-medium text-white/70">Model Name</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. gpt-4o-mini, llama-3.3-70b-versatile"
                    className="h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-white outline-none focus:border-indigo-400"
                  />
                </div>

                {provider === "custom" && (
                  <div>
                    <label className="mb-1.5 block font-medium text-white/70">Custom Endpoint URL</label>
                    <input
                      type="text"
                      value={endpoint}
                      onChange={(e) => setEndpoint(e.target.value)}
                      placeholder="http://localhost:11434/v1/chat/completions"
                      className="h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-white outline-none focus:border-indigo-400"
                    />
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-white/[0.08] pt-4">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-white/60 hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveAISettings}
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 hover:scale-[1.02]"
                >
                  Save Configuration
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
