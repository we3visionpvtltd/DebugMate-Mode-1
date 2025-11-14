
import React, { useRef, useEffect, useState, useContext } from 'react';
import { Card } from 'react-bootstrap';
import { FaComments, FaPaperclip, FaPaperPlane } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import './WorkChat.css';
import { MyContext } from '../../App';

const WorkChat = () => {
  const [workMessages, setWorkMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your Project Chat Assistant. I can help you with project-related questions, development guidance, team collaboration, and project management. How can I assist you today?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [projectId, setProjectId] = useState('Default');
  const [projectName, setProjectName] = useState('Default Project');
  const [projectInfo, setProjectInfo] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const context = useContext(MyContext);
  const userEmail = context.userEmail;
  const userName = context.userName || "User";

  const location = useLocation();
  

  // ✅ Always set session on mount (fixes "login first" issue)
  useEffect(() => {
    const setSession = async () => {
      if (!userEmail) return;
      try {
        // await fetch("https://krishnathummae17-debug-chatbot.hf.space/set_session"
          await fetch("http://localhost:8000/set_session", {
          method: "POST",
          headers: { "Content-Type": "application/json" ,"Authorization": "Bearer debugmate123" },
          credentials: "include",
          body: JSON.stringify({ email: userEmail, name: userName })
        });
      } catch (error) {
        console.error("❌ Failed to set session:", error);
      }
    };
    setSession();
  }, [userEmail, userName]);

  // ✅ Pick project info from router state (Dashboard -> WorkChat)
  useEffect(() => {
    if (location.state?.projectId) {
      setProjectId(location.state.projectId);
      setProjectName(location.state.projectName || 'Unnamed Project');
      setWorkMessages([
        { role: 'assistant', content: `Hello! I'm your Project Chat Assistant for ${location.state.projectName}.` }
      ]);
    }
  }, [location.state]);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setHistoryOpen(false); // 👈 start closed on mobile
      } else {
        setHistoryOpen(true); // 👈 keep open on desktop
      }
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  // ✅ Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // ✅ Dark mode detection
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.body.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // ✅ Auto-scroll to bottom on message update
  useEffect(() => {
    if (chatContainerRef.current) {
      const chatContainer = chatContainerRef.current;
      const scrollHeight = chatContainer.scrollHeight;
      const clientHeight = chatContainer.clientHeight;
      if (scrollHeight > clientHeight) {
        setTimeout(() => {
          chatContainer.scrollTo({ top: scrollHeight, behavior: 'smooth' });
        }, 100);
      }
    }
  }, [workMessages]);

  // Storage keys for both project and unified chat history
  const storageKey = `chatHistory_project_${projectId}`;
  const unifiedStorageKey = userEmail 
    ? `unified_chatHistory_${userEmail}` 
    : 'unified_chatHistory_guest';
  const dualChatKey = userEmail 
    ? `chatHistory_dual_${userEmail}` 
    : 'chatHistory_dual_guest';

  // Load and sync DualChat messages
  useEffect(() => {
    const loadDualChatMessages = () => {
      try {
        const dualChatData = localStorage.getItem(dualChatKey);
        if (dualChatData) {
          const dualChats = JSON.parse(dualChatData);
          if (Array.isArray(dualChats) && dualChats.length > 0) {
            // Merge with existing chat history, avoiding duplicates
            setChatHistory(prev => {
              const existingIds = new Set(prev.map(chat => chat.id));
              const newChats = dualChats.filter(chat => !existingIds.has(chat.id));
              return [...newChats, ...prev];
            });
          }
        }
      } catch (error) {
        console.error('Failed to load DualChat messages:', error);
      }
    };

    // Initial load
    loadDualChatMessages();

    // Listen for storage events from DualChat
    const handleStorageChange = (e) => {
      if (e.key === dualChatKey) {
        loadDualChatMessages();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [dualChatKey]);

  // Save project-specific chat history
  useEffect(() => {
    if (chatHistory.length > 0) {
      try {
        // Only save project-specific chats to project storage
        const projectChats = chatHistory.filter(chat => chat?.chatType === 'project');
        if (projectChats.length > 0) {
          localStorage.setItem(storageKey, JSON.stringify(projectChats));
        }
        // Save all chats to unified storage
        localStorage.setItem(unifiedStorageKey, JSON.stringify(chatHistory));
      } catch (error) {
        console.error('Failed to save chat history:', error);
      }
    }
  }, [chatHistory, storageKey, unifiedStorageKey, projectId]);

  // ✅ Sync unified history to localStorage
  useEffect(() => {
    try {
      const existingUnifiedRaw = localStorage.getItem(unifiedStorageKey);
      const existingUnified = existingUnifiedRaw ? JSON.parse(existingUnifiedRaw) : [];
      const mapById = new Map();
      if (Array.isArray(existingUnified)) {
        for (const item of existingUnified) if (item?.id != null) mapById.set(item.id, item);
      }
      if (Array.isArray(chatHistory)) {
        for (const item of chatHistory) if (item?.id != null) mapById.set(item.id, item);
      }
      const merged = Array.from(mapById.values());
      localStorage.setItem(unifiedStorageKey, JSON.stringify(merged));
      if (chatHistory.length > 0) window.dispatchEvent(new Event('unifiedChatHistoryUpdated'));
    } catch (e) {
      console.error('Failed to sync unified chat history:', e);
    }
  }, [chatHistory, unifiedStorageKey]);

  // ✅ Restore project-specific history from localStorage
  useEffect(() => {
    // First try to load from project-specific storage
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter to only include chats for current project
          const projectChats = parsed.filter(chat => chat?.projectId === projectId);
          setChatHistory(projectChats);
          return;
        }
      } catch (e) {
        console.error("Failed to parse project chat history", e);
      }
    }
    
    // Fallback to unified storage for this project
    const unifiedSaved = localStorage.getItem(unifiedStorageKey);
    if (unifiedSaved) {
      try {
        const unifiedParsed = JSON.parse(unifiedSaved);
        if (Array.isArray(unifiedParsed)) {
          setChatHistory(unifiedParsed);
        }
      } catch (e) {
        console.error("Failed to parse unified chat history", e);
      }
    } else {
      // Initialize with empty array if no history exists
      setChatHistory([]);
    }
  }, [storageKey, unifiedStorageKey, projectId]);

  // ✅ Restore unified history after login
  useEffect(() => {
    if (userEmail) {
      const unifiedRaw = localStorage.getItem(unifiedStorageKey);
      if (unifiedRaw) {
        try {
          const unifiedParsed = JSON.parse(unifiedRaw);
          if (Array.isArray(unifiedParsed)) setChatHistory(unifiedParsed);
        } catch (e) {
          console.error("Failed to restore unified chat history", e);
        }
      }
    }
  }, [userEmail, unifiedStorageKey]);

  // ✅ Backend project fetch (only if no project is passed from dashboard)
  useEffect(() => {
    if (location.state?.projectId) return; // ✅ skip if project came from Dashboard
    const fetchProject = async () => {
      if (!userEmail) return;
      try {
        const projectResponse = await fetch("http://localhost:8000/get_user_project", {
          method: "POST",
          headers: { "Content-Type": "application/json" ,"Authorization": "Bearer debugmate123" },
          credentials: "include",
          body: JSON.stringify({ email: userEmail })
        });
        if (projectResponse.ok) {
          const projectData = await projectResponse.json();
          if (projectData.project_id) {
            const newProjectId = projectData.project_id;
            const newProjectName = projectData.project_name || 'Unknown Project';
            setProjectId(newProjectId);
            setProjectName(newProjectName);
            setProjectInfo(projectData.full_project_info || null);
            setWorkMessages([{ role: 'assistant', content: `Hello! I'm your Project Chat Assistant for ${newProjectName}.` }]);
            setSessionActive(false);
            setCurrentSessionId(null);
          }
        }
      } catch (error) {
        console.error("❌ Failed to fetch project:", error);
      }
    };
    fetchProject();
  }, [userEmail, userName, location.state]);

  // ✅ Send message & save session with project info
//  const sendMessage = async () => {
//   if (inputText.trim() === '') return;

//   const newMessage = { role: 'user', content: inputText };
//   setInputText('');
//   setIsTyping(true);

//   let sessionId = currentSessionId;
//   if (!sessionId) {
//     sessionId = Date.now();
//     setCurrentSessionId(sessionId);
//   }

//   try {
//     const response = await fetch("http://localhost:8000/chat/work", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       credentials: "include",
//       body: JSON.stringify({
//         message: newMessage.content,
//         chat_type: 'project',
//         project_id: projectId
//       }),
//     });

//     const data = await response.json();
//     const botReply = { role: 'assistant', content: data.reply || "⚠ No reply from server" };

//     // ✅ Use updated messages array
//     const updatedMessages = [...workMessages, newMessage, botReply];
//     setWorkMessages(updatedMessages);
//     setIsTyping(false);
//     setSessionActive(true);

//     // ✅ Save to chatHistory
//     setChatHistory(prev => {
//       const existing = prev.find(chat => chat.sessionId === sessionId);
//       if (existing) {
//         // update existing session
//         return prev.map(chat =>
//           chat.sessionId === sessionId
//             ? { 
//                 ...chat,
//                 fullChat: updatedMessages,
//                 timestamp: new Date().toISOString(),
//                 messageCount: updatedMessages.length
//               }
//             : chat
//         );
//       } else {
//         // create new session
//         return [
//           ...prev,
//           {
//             id: sessionId,
//             sessionId: sessionId,
//             chatType: 'project',
//             projectId: projectId,
//             projectName: projectName,
//             summary: newMessage.content,
//             fullChat: updatedMessages,
//             timestamp: new Date().toISOString(),
//             sessionName: `${projectName} - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
//             messageCount: updatedMessages.length
//           }
//         ];
//       }
//     });

//   } catch (error) {
//     console.error("❌ Chat request failed:", error);
//     setWorkMessages(prev => [...prev, { role: 'assistant', content: 'Error connecting to chatbot.' }]);
//     setIsTyping(false);
//   }
// };
const sendMessage = async () => {
  if (!inputText.trim()) return;

  const newMessage = { role: 'user', content: inputText };
  setInputText('');

  // Append user message immediately
  const updatedMessages = [...workMessages, newMessage];
  setWorkMessages(updatedMessages);

  // Save to chatHistory immediately
  let sessionId = currentSessionId;
  if (!sessionId) {
    sessionId = Date.now();
    setCurrentSessionId(sessionId);
  }
  setSessionActive(true);

  setChatHistory(prev => {
    const existing = prev.find(chat => chat.sessionId === sessionId);
    if (existing) {
      return prev.map(chat =>
        chat.sessionId === sessionId
          ? { 
              ...chat,
              fullChat: updatedMessages,
              timestamp: new Date().toISOString(),
              messageCount: updatedMessages.length
            }
          : chat
      );
    } else {
      return [
        ...prev,
        {
          id: sessionId,
          sessionId: sessionId,
          chatType: 'project',
          projectId: projectId,
          projectName: projectName,
          summary: newMessage.content,
          fullChat: updatedMessages,
          timestamp: new Date().toISOString(),
          sessionName: `${projectName} - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
          messageCount: updatedMessages.length
        }
      ];
    }
  });

  setIsTyping(true);

  try {
    const response = await fetch("http://localhost:8000/chat/work", {
      method: "POST",
      headers: { "Content-Type": "application/json" ,
        "Authorization": "Bearer debugmate123" },
      credentials: "include",
      body: JSON.stringify({ message: newMessage.content, chat_type: 'project', project_id: projectId })
    });
    const data = await response.json();
    const botReply = { role: 'assistant', content: data.reply || "⚠ No reply from server" };

    const newUpdatedMessages = [...updatedMessages, botReply];
    setWorkMessages(newUpdatedMessages);

    // Update chatHistory with bot reply
    setChatHistory(prev =>
      prev.map(chat =>
        chat.sessionId === sessionId
          ? { 
              ...chat,
              fullChat: newUpdatedMessages,
              timestamp: new Date().toISOString(),
              messageCount: newUpdatedMessages.length
            }
          : chat
      )
    );

    setIsTyping(false);

  } catch (error) {
    console.error("❌ Chat request failed:", error);
    setWorkMessages(prev => [...prev, { role: 'assistant', content: 'Error connecting to chatbot.' }]);
    setIsTyping(false);
  }
};




  const handleKeyDown = (e) => { if (e.key === 'Enter') sendMessage(); };

  const handleHistoryClick = (chat) => { 
    setWorkMessages(chat.fullChat); 
    setCurrentSessionId(chat.sessionId); 
    setSessionActive(true);
    setProjectId(chat.projectId || 'Default');
    setProjectName(chat.projectName || 'Default Project');
  };

  const handleHistoryDelete = (id) => {
    setChatHistory(prev => prev.filter(chat => chat.id !== id));
    try {
      const existingUnifiedRaw = localStorage.getItem(unifiedStorageKey);
      const existingUnified = existingUnifiedRaw ? JSON.parse(existingUnifiedRaw) : [];
      if (Array.isArray(existingUnified)) {
        const updatedUnified = existingUnified.filter(chat => chat && chat.id !== id);
        localStorage.setItem(unifiedStorageKey, JSON.stringify(updatedUnified));
      }
      const existingProjectRaw = localStorage.getItem(storageKey);
      const existingProject = existingProjectRaw ? JSON.parse(existingProjectRaw) : [];
      if (Array.isArray(existingProject)) {
        const updatedProject = existingProject.filter(chat => chat && chat.id !== id);
        localStorage.setItem(storageKey, JSON.stringify(updatedProject));
      }
    } catch (e) {
      console.error('Failed to remove from unified chat history:', e);
    }
  };

  return (
    <div className="work-layout">
      {/* Main Chat Area */}
      <div className={`work-container${historyOpen ? ' with-history' : ' full-width'}`}>
        <Card className="work-card">
          <Card.Header className="d-flex align-items-center">
            <FaComments className="me-2" /> 
            <span>Project Chat</span>
          </Card.Header>

          <div className="work-banner">
            <strong>{projectName}</strong>
            <span style={{ marginLeft: '10px', opacity: 0.8 }}>
              Project ID: {projectId}
            </span>
          </div>

          <Card.Body className="work-history" ref={chatContainerRef}>
            {workMessages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`work-bubble ${msg.role}`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            ))}
            {isTyping && (
              <div className="typing-indicator">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            )}
            <div ref={chatEndRef} />
          </Card.Body>

          <Card.Footer>
            <div className="work-input-area">
              <div className="input-wrapper">
                <button className="attach-btn"><FaPaperclip /></button>
                <input
                  type="text"
                  placeholder="Ask project-related questions..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button className="send-btn" onClick={sendMessage} aria-label="Send message" title="Send">
                  <FaPaperPlane />
                </button>
              </div>
            </div>
          </Card.Footer>
        </Card>
      </div>

      {/* History Panel */}
      <div className={`work-history-panel${historyOpen ? '' : ' closed'}`}>
        <div className="work-panel-header">
          <h3>Project Chat History</h3>
        </div>
        <div className="work-history-list">
          {chatHistory.length === 0 ? (
            <p className="empty-history">No previous sessions</p>
          ) : (
            chatHistory.map((chat) => (
              <div
                key={chat.id}
                className={`work-history-item${workMessages === chat.fullChat ? ' selected' : ''}`}
                onClick={() => handleHistoryClick(chat)}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div className="work-history-type-badge">{chat.projectName || 'Project'}</div>
                    <button
                      className="work-history-delete-btn"
                      onClick={e => { e.stopPropagation(); handleHistoryDelete(chat.id); }}
                    >
                      ✕
                    </button>
                  </div>
                  {chat.projectId && chat.projectId !== 'Default' && (
                    <small style={{ color: '#666', fontSize: '10px' }}>ID: {chat.projectId}</small>
                  )}
                  <div className="work-history-summary" style={{ margin: '8px 0', color: '#444' }}>
                    {chat.summary && chat.summary.length > 80 ? `${chat.summary.substring(0, 80)}...` : chat.summary}
                  </div>
                  <div className="work-history-meta">
                    {chat.messageCount && (
                      <small style={{ display: 'inline-block', color: '#666', fontSize: '10px', marginRight: '10px' }}>
                        {chat.messageCount} messages
                      </small>
                    )}
                    {chat.timestamp && (
                      <small style={{ color: '#666', fontSize: '10px' }}>
                        {new Date(chat.timestamp).toLocaleString()}
                      </small>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* History Toggle Button */}
      <button className="work-history-toggle-btn" onClick={() => setHistoryOpen(prev => !prev)}>
        {historyOpen ? '→' : '←'}
      </button>
    </div>
  );
};

export default WorkChat;
