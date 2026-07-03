import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import oneLight from "react-syntax-highlighter/dist/esm/styles/prism/one-light";
import vscDarkPlus from "react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useChat } from "../hooks/useChat";
import { useAuth } from "../../auth/hooks/useAuth";
import "../styles/dashboard.scss";
import {
  ArrowUp,
  Ellipsis,
  History,
  Paperclip,
  Plus,
  Search,
  Image,
  Globe,
  Trash2,
  LogOut,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { setCurrentChatId } from "../chat.slice";
const LogoImage = "/assets/AI_Logo.png";
const LogoImageLight = "/assets/AI_Logo_Light.png";

const Dashboard = () => {
  const chat = useChat();
  const { handleLogout } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Local state
  const [chatInput, setChatInput] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLightMode, setIsLightMode] = useState(true);
  const [webSearch, setWebSearch] = useState(false);
  const [isImageMode, setIsImageMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const chatsMap = useSelector((state) => state.chat.chats);
  const chatsList = Object.values(chatsMap);
  const currentChatId = useSelector((state) => state.chat.currentChatId);
  const user = useSelector((state) => state.auth.user);
  const isLoading = useSelector((state) => state.chat.isLoading);

  // Initialize socket connection and load chats
  useEffect(() => {
    chat.initializeSocketConnection();
    chat.handleGetChats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Whenever the currentChatId changes, load messages
  useEffect(() => {
    if (currentChatId && chatsMap[currentChatId]) {
      chat.loadMessages(currentChatId);
    }
  }, [currentChatId, chatsMap]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendMessage = (e) => {
    e?.preventDefault();
    const trimmedMessage = chatInput.trim();
    if (!trimmedMessage) return;

    if (isImageMode) {
      chat.handleGenerateImage(currentChatId, trimmedMessage);
      setIsImageMode(false);
    } else {
      chat.handleSendMessage(currentChatId, trimmedMessage, webSearch);
    }
    setChatInput("");
  };

  // Handles inline formatting inside a single line
  const renderInline = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        const boldText = part.slice(2, -2);
        return <strong key={idx}>{boldText}</strong>;
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  // Handles structure of the whole message (line-by-line)
  const renderMessageContent = (content) => {
    if (typeof content !== "string") return content;
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trimStart();
      if (trimmed.startsWith("### ")) {
        return (
          <div key={idx} className="chatInterface__heading chatInterface__h3">
            {renderInline(trimmed.slice(4))}
          </div>
        );
      }
      if (trimmed.startsWith("## ")) {
        return (
          <div key={idx} className="chatInterface__heading chatInterface__h2">
            {renderInline(trimmed.slice(3))}
          </div>
        );
      }
      if (trimmed.startsWith("# ")) {
        return (
          <div key={idx} className="chatInterface__heading chatInterface__h1">
            {renderInline(trimmed.slice(2))}
          </div>
        );
      }
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        const bulletText = trimmed.slice(2);
        return (
          <div key={idx} className="chatInterface__bullet">
            {"\u2022 "}
            {renderInline(bulletText)}
          </div>
        );
      }
      return (
        <div key={idx} className="chatInterface__paragraph">
          {renderInline(line)}
        </div>
      );
    });
  };

  const markdownComponents = {
    code({ inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const code = String(children).replace(/\n$/, "");

      if (!inline && match) {
        return (
          <SyntaxHighlighter
            style={isLightMode ? oneLight : vscDarkPlus}
            language={match[1]}
            PreTag="div"
            customStyle={{ margin: 0, borderRadius: "0.75rem" }}
            {...props}
          >
            {code}
          </SyntaxHighlighter>
        );
      }

      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };
  // Filter conversations based on local search query
  const filteredChatsList = chatsList.filter((chatItem) =>
    chatItem.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasMessages = currentChatId && chatsMap[currentChatId]?.messages && chatsMap[currentChatId].messages.length > 0;

  // Reusable input form component
  const renderInputForm = (isCentered = false) => {
    return (
      <form
        onSubmit={handleSendMessage}
        className={`chatInterface__inputWrapper ${isCentered ? "chatInterface__inputWrapper--centered" : ""}`}
      >
        <button type="button" className="chatInterface__attachButton" title="Attach file">
          <Paperclip size={18} />
        </button>

        <button
          type="button"
          className={`chatInterface__imageModeButton ${isImageMode ? "chatInterface__imageModeButton--active" : ""}`}
          onClick={() => setIsImageMode((prev) => !prev)}
          title="Toggle Image Generation Mode"
        >
          <Image size={18} />
        </button>

        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder={
            isImageMode
              ? "Describe the image you want to generate..."
              : "Ask anything..."
          }
          className="chatInterface__input"
        />

        {!isImageMode && (
          <div
            className={`chatInterface__toggleContainer ${webSearch ? "chatInterface__toggleContainer--active" : ""}`}
            onClick={() => setWebSearch((prev) => !prev)}
            title="Tavily Web Search"
          >
            <Globe size={14} />
            <span className="chatInterface__toggleLabel">Search</span>
            <div className="chatInterface__toggleSwitch" />
          </div>
        )}

        <button type="submit" className="chatInterface__sendButton" title="Send message">
          <ArrowUp size={18} />
        </button>
      </form>
    );
  };

  return (
    <main
      className={`main-dashboard ${isLightMode ? "theme-light" : "theme-dark"} ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
    >
      {/* Sidebar */}
      <section className={`sidebar ${isSidebarOpen ? "" : "sidebar--collapsed"}`}>
        <div className="sidebar__top">
          <div className="sidebar__logo">
            <img
              src={isLightMode ? LogoImageLight : LogoImage}
              alt="Perplexity Logo"
              className="sidebar__logoImage"
            />
          </div>
          <h1 className="sidebar__appName">Perplexity</h1>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="sidebar__collapseButton"
            title="Hide sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        <div className="sidebar__actions">
          <button
            className="sidebar__card"
            onClick={() => dispatch(setCurrentChatId(null))}
            title="Start a new chat"
          >
            <div className="sidebar__cardIcon">
              <Plus size={16} />
            </div>
            <span className="sidebar__cardText">New Chat</span>
          </button>

          <div className="sidebar__searchWrapper">
            <Search size={15} className="sidebar__searchIcon" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sidebar__searchInput"
            />
          </div>
        </div>

        <div className="sidebar__history">
          <div className="sidebar__historyHeader">
            <button>
              <History size={20} />
            </button>
            <h2 className="sidebar__heading">Chat History</h2>
          </div>

          <div className="sidebar__list">
            {filteredChatsList.length === 0 ? (
              <div className="sidebar__noHistory">
                {searchQuery ? "No matches found" : "No chats yet"}
              </div>
            ) : (
              filteredChatsList.map((chatItem) => {
                const chatItemId = chatItem.id || chatItem._id;
                const isActive = currentChatId === chatItemId;
                return (
                  <div
                    key={chatItemId}
                    className={`sidebar__item ${isActive ? "sidebar__item--active" : ""}`}
                    onClick={() => dispatch(setCurrentChatId(chatItemId))}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        dispatch(setCurrentChatId(chatItemId));
                      }
                    }}
                  >
                    <span className="sidebar__itemTitle">
                      {chatItem.title}
                    </span>
                    <button
                      className="sidebar__itemDelete"
                      onClick={(e) => {
                        e.stopPropagation();
                        chat.handleDeleteChat(chatItemId);
                      }}
                      title="Delete Chat"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="sidebar__themeToggle">
          <button
            className="sidebar__themeButton"
            onClick={() => setIsLightMode((prev) => !prev)}
          >
            {isLightMode ? <Moon size={14} /> : <Sun size={14} />}
            <span>{isLightMode ? "Dark Mode" : "Light Mode"}</span>
          </button>
        </div>

        <div className="sidebar__profile">
          <div className="sidebar__profileRow">
            <div className="sidebar__profileInfo">
              <div className="sidebar__avatar" />
              <div>
                <p className="sidebar__username">{user?.username || "Guest User"}</p>
              </div>
            </div>

            <button
              className="sidebar__menuButton"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label="Profile options"
            >
              <Ellipsis size={18} />
            </button>
          </div>

          {isMenuOpen && (
            <div className="sidebar__menu">
              <button className="sidebar__menuItem">Edit Profile</button>
              <button className="sidebar__menuItem">Settings</button>
              <button className="sidebar__menuItem">Upgrade Plan</button>
              <button className="sidebar__menuItem">Help</button>
              <button
                className="sidebar__menuItem sidebar__menuItem--logout"
                onClick={async () => {
                  await handleLogout();
                  navigate("/login", { replace: true });
                }}
              >
                <LogOut size={12} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Chat Interface */}
      <section className="chatInterface">
        {/* Top Header Bar */}
        <header className="chatInterface__header">
          <div className="chatInterface__headerLeft">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="chatInterface__sidebarToggle"
                title="Show sidebar"
              >
                <PanelLeftOpen size={18} />
              </button>
            )}
            <div className="chatInterface__modelSelector">
              <span>Perplexity</span>
              <span className="chatInterface__modelSelectorChevron">▼</span>
            </div>
          </div>
          <div className="chatInterface__headerRight">
            <button className="chatInterface__headerButton">Share</button>
            <button className="chatInterface__headerButton" onClick={() => setIsMenuOpen((prev) => !prev)}>Options</button>
          </div>
        </header>

        <div className="chatInterface__content">
          <div className="chatInterface__messages">
            {!hasMessages ? (
              <div className="chatInterface__emptyState">
                <h2 className="chatInterface__emptyHeading">Where should we begin?</h2>
                
                {/* Centered input box exactly like ChatGPT home view */}
                <div className="chatInterface__emptyInputContainer">
                  {renderInputForm(true)}
                </div>

                <div className="chatInterface__quickPrompts">
                  <button
                    type="button"
                    className="chatInterface__promptCard"
                    onClick={() => {
                      setChatInput("A futuristic cyberpunk city skyline at sunset");
                      setIsImageMode(true);
                    }}
                  >
                    <span className="chatInterface__promptIcon">🎨</span>
                    <span>Create an image</span>
                  </button>

                  <button
                    type="button"
                    className="chatInterface__promptCard"
                    onClick={() => setChatInput("Write or edit a JavaScript function...")}
                  >
                    <span className="chatInterface__promptIcon">✍️</span>
                    <span>Write or edit</span>
                  </button>

                  <button
                    type="button"
                    className="chatInterface__promptCard"
                    onClick={() => {
                      setChatInput("Look something up about...");
                      setWebSearch(true);
                    }}
                  >
                    <span className="chatInterface__promptIcon">🌐</span>
                    <span>Look something up</span>
                  </button>
                </div>
              </div>
            ) : (
              chatsMap[currentChatId].messages.map((msg, index) => {
                const msgId = msg.id || msg._id;
                return (
                  <div
                    key={msgId || index}
                    className={`chatInterface__message chatInterface__message--${msg.role}`}
                  >
                    {msg.role === "ai" ? (
                      <div className="chatInterface__text">
                        <div className="chatInterface__markdown animate-in fade-in">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                          >
                            {typeof msg.content === "string" ? msg.content : ""}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ) : (
                      <div className="chatInterface__userBubble">
                        {renderMessageContent(msg.content)}
                      </div>
                    )}
                    {msgId && (
                      <button
                        className="chatInterface__messageDelete"
                        onClick={() => chat.handleDeleteMessage(currentChatId, msgId)}
                        title="Delete Message"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                );
              })
            )}

            {isLoading && (
              <div className="chatInterface__message chatInterface__message--ai chatInterface__message--loading">
                <div className="chatInterface__text">
                  <div className="chatInterface__loader" aria-label="Assistant is typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Floating input bar at bottom, visible only when there are messages */}
        {hasMessages && (
          <div className="chatInterface__inputContainer">
            {renderInputForm(false)}
            <div className="chatInterface__disclaimer">
              Perplexity can make mistakes. Check important info.
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default Dashboard;

















