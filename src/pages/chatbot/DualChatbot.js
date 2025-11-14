import React, { useRef, useEffect, useState, useContext, useMemo } from 'react';
import { Card } from 'react-bootstrap';
import { FaComments, FaPaperclip, FaPaperPlane } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import './WorkChat.css';
import { MyContext } from '../../App';
import { generateCustomUUID } from '../../utils/customUUID';

const DualChatbot = () => {
  const [generalMessages, setGeneralMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your Dual Chat Assistant. I can help you with both general development questions and project-specific guidance. How can I assist you today?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [currentSession, setCurrentSession] = useState({
    id: null,
    projectId: null,
    projectName: null
  });
  const chatEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);

  const context = useContext(MyContext);
  const userEmail = context.userEmail;
  const userName = context.userName || "User";
  
  // Get project chats from both WorkChat and current chat history
  const projectChats = useMemo(() => {
    // Create a map to store the most recent chat for each project
    const projectMap = new Map();
    
    // 1. Get project chats from WorkChat component
    const allKeys = Object.keys(localStorage);
    const projectChatKeys = allKeys.filter(key => 
      key.startsWith('chatHistory_project_') || 
      (userEmail && key.startsWith(`chatHistory_project_${userEmail}_`))
    );
    
    // Process WorkChat project chats
    projectChatKeys.forEach(key => {
      try {
        const chats = JSON.parse(localStorage.getItem(key) || '[]');
        chats.forEach(chat => {
          if (chat?.projectId && chat.projectId !== 'Default' && chat.projectId !== 'default') {
            const existingChat = projectMap.get(chat.projectId);
            if (!existingChat || new Date(chat.timestamp) > new Date(existingChat.timestamp)) {
              projectMap.set(chat.projectId, {
                ...chat,
                // Ensure we have all required fields
                id: chat.id || `workchat_${chat.projectId}_${chat.timestamp}`,
                sessionId: chat.sessionId || chat.id,
                chatType: 'project',
                projectName: chat.projectName || chat.sessionName || 'Unnamed Project'
              });
            }
          }
        });
      } catch (e) {
        console.error(`Error parsing chat from ${key}:`, e);
      }
    });
    
    // 2. Process current chat history
    chatHistory.forEach(chat => {
      if (chat?.projectId && chat.projectId !== 'Default' && chat.projectId !== 'default') {
        const existingChat = projectMap.get(chat.projectId);
        if (!existingChat || new Date(chat.timestamp) > new Date(existingChat.timestamp)) {
          projectMap.set(chat.projectId, chat);
        }
      }
    });
    
    // Convert map values to array and sort by timestamp (newest first)
    return Array.from(projectMap.values()).sort((a, b) => 
      new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
    );
  }, [chatHistory, userEmail]);
// Responsive design: detect mobile screen
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

  // Responsive design: detect mobile screen
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Use unified localStorage key for chat history shared with WorkChat
  const storageKey = userEmail ? `unified_chatHistory_${userEmail}` : 'unified_chatHistory_guest';

  // Load all chat histories (unified + project-specific)
  useEffect(() => {
    const loadAllChatHistories = () => {
      try {
        // Get all project chat history keys
        const allKeys = Object.keys(localStorage);
        const projectChatKeys = allKeys.filter(key => 
          key.startsWith(userEmail ? `unified_chatHistory_${userEmail}_` : 'unified_chatHistory_guest_')
        );
        
        // Add the main unified storage key
        const allStorageKeys = [...projectChatKeys, storageKey];
        
        // Collect all unique chat sessions
        const allChats = [];
        const seenIds = new Set();
        
        allStorageKeys.forEach(key => {
          try {
            const saved = localStorage.getItem(key);
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) {
                parsed.forEach(chat => {
                  if (chat?.id && !seenIds.has(chat.id)) {
                    seenIds.add(chat.id);
                    allChats.push(chat);
                  }
                });
              }
            }
          } catch (e) {
            console.error(`Error loading chat from ${key}:`, e);
          }
        });
        
        // Sort by timestamp (newest first)
        allChats.sort((a, b) => 
          new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
        );
        
        setChatHistory(allChats);
        
        // Auto-open the most recent chat if available
        if (allChats.length > 0) {
          const mostRecentChat = allChats[0];
          if (mostRecentChat.fullChat) {
            setGeneralMessages(mostRecentChat.fullChat);
            setCurrentSession(prev => ({
              ...prev,
              id: mostRecentChat.id,
              projectId: mostRecentChat.projectId || null,
              projectName: mostRecentChat.projectName || null
            }));
            setSessionActive(true);
          }
        }
        
        console.log('🔄 Loaded chat history from all projects:', allChats.length, 'sessions');
        
      } catch (e) {
        console.error('Failed to load chat histories:', e);
      }
    };
    
    loadAllChatHistories();
    
    // Listen for storage changes to update the list
    const handleStorageChange = (e) => {
      if (e.key && (e.key.startsWith('unified_chatHistory_') || e.key === storageKey)) {
        loadAllChatHistories();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKey, userEmail]);

  // Save chat history to localStorage on changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      // Save to dual chat storage
      const dualChatKey = userEmail ? `chatHistory_dual_${userEmail}` : 'chatHistory_dual_guest';
      localStorage.setItem(dualChatKey, JSON.stringify(chatHistory));
      
      // Also save to unified storage
      localStorage.setItem(storageKey, JSON.stringify(chatHistory));
      
      // Trigger storage event for other tabs/windows
      window.dispatchEvent(new StorageEvent('storage', {
        key: dualChatKey,
        newValue: JSON.stringify(chatHistory),
        storageArea: localStorage,
        url: window.location.href
      }));
      
      console.log('💾 Dual chat history saved and synced:', storageKey, chatHistory.length, 'items');
    }
  }, [chatHistory, storageKey, userEmail]);

  // Listen for history updates from other components/tabs and refresh
  useEffect(() => {
    const refreshAllHistories = () => {
      // This will trigger the main effect to reload all histories
      const event = new Event('storage');
      window.dispatchEvent(event);
    };

    window.addEventListener('unifiedChatHistoryUpdated', refreshAllHistories);
    window.addEventListener('projectChatUpdated', refreshAllHistories);

    return () => {
      window.removeEventListener('unifiedChatHistoryUpdated', refreshAllHistories);
      window.removeEventListener('projectChatUpdated', refreshAllHistories);
    };
  }, []);

  // Set session on mount
  useEffect(() => {
    const setSession = async () => {
      if (!userEmail) return;
      try {
        await fetch('http://localhost:8000/set_session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' ,"Authorization": "Bearer debugmate123" },
          credentials: 'include',
          body: JSON.stringify({ email: userEmail, name: userName }),
        });
        console.log('✅ Session set for Dual Chatbot');
      } catch (error) {
        console.error('❌ Failed to set session:', error);
      }
    };
    setSession();
  }, [userEmail, userName]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    const chatBox = document.getElementById("chatBox");
    if (chatBox) {
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }, [generalMessages]);

  // Send message logic
  const sendMessage = async () => {
    if (inputText.trim() === '') return;
  
    const newMessage = { role: 'user', content: inputText };
    setInputText('');
  
    // Append user message immediately
    const updatedMessages = [...generalMessages, newMessage];
    setGeneralMessages(updatedMessages);
  
    // Generate session ID if this is the first message
    const sessionId = currentSession.id || `chat_${Date.now()}`;
    setCurrentSession(prev => ({
      ...prev,
      id: sessionId
    }));
    setSessionActive(true);
    setIsTyping(true);
  
    try {
      
      const chatId = `${userEmail}_${currentSession.projectId || 'general'}`;
      const response = await fetch('http://localhost:8000/chat/dual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',"Authorization": "Bearer debugmate123"   },
        credentials: 'include',
            body: JSON.stringify({
    message: newMessage.content,
    chat_type: currentSession.projectId ? 'project' : 'general',
    project_id: currentSession.projectId || 'general',
    chat_id: chatId }),
      });
  
      const data = await response.json();
      const botReply = { role: 'assistant', content: data.reply || ' No reply from server' };
  
      // Add bot reply to messages
      const messagesWithBot = [...updatedMessages, botReply];
      setGeneralMessages(messagesWithBot);
      setIsTyping(false);
  
      // Save chat to history
      const sessionName = `Session ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
      setChatHistory(prev => {
        const existing = prev.find(chat => chat.id === sessionId);
        if (existing) {
          return prev.map(chat =>
            chat.id === sessionId
              ? { ...chat, fullChat: messagesWithBot, timestamp: new Date().toISOString(), messageCount: messagesWithBot.length }
              : chat
          );
        } else {
          return [
            ...prev,
            {
              id: sessionId,
              sessionId: sessionId,
              chatType: 'dual',
              summary: newMessage.content,
              fullChat: messagesWithBot,
              timestamp: new Date().toISOString(),
              sessionName: sessionName,
              messageCount: messagesWithBot.length,
            },
          ];
        }
      });
  
    } catch (error) {
      console.error(' Chat request failed:', error);
      setIsTyping(false);
      const errorMessage = { role: 'assistant', content: 'Error connecting to chatbot.' };
      setGeneralMessages(prev => [...prev, errorMessage]);
    }
  };
  

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  const clearChat = () => {
    setGeneralMessages([
      { role: 'assistant', content: 'Hello! I\'m your Dual Chat Assistant. How can I help you today?' }
    ]);
    setSessionActive(false);
    setCurrentSession({
      id: null,
      projectId: null,
      projectName: null
    });
  };

  const handleNewChat = () => {
    clearChat();
  };

  const handleHistoryClick = (chat) => {
    setGeneralMessages(chat.fullChat);
    setCurrentSession({
      id: chat.sessionId,
      projectId: chat.projectId || chat.projectID || 'N/A',
      projectName: chat.projectName || 'Dual Chat Assistant'
    });
    setSessionActive(true);
  };

  const handleHistoryDelete = (id) => {
    setChatHistory(prev => prev.filter(chat => chat.id !== id));
  };

  return (
    <div className={`work-layout`}>
      {/* Main Chat Area */}
      <div className={`work-container${historyOpen ? ' with-history' : ' full-width'}`}>
        <Card className="work-card">
          <Card.Header 
            className="d-flex align-items-center" 
            style={{ 
              backgroundColor: 'transparent',
              borderBottom: 'none',
              padding: '1rem 1.25rem 0'
            }}
          >
            <FaComments className="me-2" />
            <span>Dual Chat Assistant</span>
          </Card.Header>

          <div className="work-banner" style={{
            background: 'linear-gradient(135deg, #A80C4C, #090939, #421256, #531C9B)',
            color: 'white',
            padding: '12px 20px',
            fontSize: '14px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            <span style={{ 
              fontWeight: 'bold',
              marginRight: '10px'
            }}>
              {currentSession?.projectName || 'Dual Chat Assistant'}
            </span>
            <span style={{ opacity: 0.9 }}>
              Project ID: {currentSession?.projectId || 'N/A'}
            </span>
          </div>

          <Card.Body className="work-history" id="chatBox">
            {generalMessages.map((msg, idx) => (
              <div key={idx} className={`work-bubble ${msg.role}`}>
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
                  placeholder="Ask development questions..."
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
          <h3>Project Chats</h3>
        </div>
        <div className="work-history-list">
          {projectChats.length === 0 ? (
            <p style={{ color: '#888', fontStyle: 'italic'}}>No project chats found</p>
          ) : (
            projectChats.map(chat => (
              <div
                key={chat.id}
                className={`work-history-item${generalMessages === chat.fullChat ? ' selected' : ''}`}
                onClick={() => handleHistoryClick(chat)}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div className="d-flex align-items-center" style={{ flex: 1, minWidth: 0, marginTop: '-2px' }}>
                      <div 
                        className="work-history-type-badge" 
                        style={{ 
                          color: 'rgb(51, 51, 51)',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          flex: '1 1 0%',
                          lineHeight: '1.2',
                          fontSize: '11px',
                          letterSpacing: '0.2px'
                        }}
                      >
                        {chat.projectName || 'Unnamed Project'}
                      </div>
                      <button
                        className="work-history-delete-btn"
                        onClick={e => { e.stopPropagation(); handleHistoryDelete(chat.id); }}
                        style={{ 
                          marginLeft: '8px', 
                          flexShrink: 0, 
                          position: 'relative',
                          top: '-2px'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  {chat.projectId && chat.projectId !== 'Default' && (
                    <div style={{ marginTop: '2px' }}>
                      <small style={{ color: '#666', fontSize: '10px' }}>
                        ID: {chat.projectId}
                      </small>
                    </div>
                  )}
                  {chat.summary && (
                    <div className="work-history-summary" style={{ margin: '8px 0', color: '#444' }}>
                      {chat.summary.length > 80 ? `${chat.summary.substring(0, 80)}...` : chat.summary}
                    </div>
                  )}
                  <div className="work-history-meta">
                    {chat.messageCount && (
                      <small style={{ 
                        display: 'inline-block', 
                        color: '#666', 
                        fontSize: '10px', 
                        marginRight: '10px' 
                      }}>
                        {chat.messageCount} messages
                      </small>
                    )}
                    <small style={{ color: '#666', fontSize: '10px' }}>
                      {new Date(chat.timestamp).toLocaleString()}
                    </small>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* History Toggle Button */}
      <button
        className="work-history-toggle-btn"
        onClick={() => setHistoryOpen(prev => !prev)}
      >
        {historyOpen ? '→' : '←'}
      </button>
    </div>
  );
};

export default DualChatbot;
