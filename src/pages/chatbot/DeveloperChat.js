import React, { useRef, useEffect, useState } from 'react';
import { Card } from 'react-bootstrap';
import { FaCode, FaPaperclip } from 'react-icons/fa';
import './WorkChat.css';
import { useContext } from 'react';
import { MyContext } from '../../App';
import { generateCustomUUID } from '../../utils/customUUID';

const getInitialMessages = (projectInfo) => {
  if (projectInfo.projectId) {
    return [
      { from: 'bot', text: `Hello! I'm here to help you with your project "${projectInfo.projectName}". You can ask me questions about development, code review, or upload files for analysis.` },
    ];
  }
  return [
    { from: 'bot', text: 'Upload your code file or ask a developer question.' },
  ];
};

const DeveloperChat = ({ projectInfo = {} }) => {
  const [messages, setMessages] = useState(getInitialMessages(projectInfo));
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [sessionActive, setSessionActive] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const context = useContext(MyContext);
  const userEmail = context.userEmail;
  const userName = context.userName || "User";
  
  // Use unified storage key for both DeveloperChat and WorkChat
  const storageKey = userEmail ? `unified_chatHistory_${userEmail}` : 'unified_chatHistory_guest';

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(chatHistory));
    }
  }, [chatHistory, storageKey]);

  // Restore chat history from localStorage when component mounts
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Sort by timestamp (newest first)
          const sortedHistory = parsed.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
          );
          setChatHistory(sortedHistory);
        }
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
  }, [storageKey]);

  // Set session once component mounts
  useEffect(() => {
    const setSession = async () => {
      if (!userEmail) return;
      try {
        await fetch("https://zeelsheta-debugmate_backend.hf.space/set_session", {
          method: "POST",
          headers: { "Content-Type": "application/json","Authorization": "Bearer debugmate123"  },
          credentials: "include",
          body: JSON.stringify({ email: userEmail, name: userName })
        });
      } catch (error) {
        console.error("❌ Failed to set session:", error);
      }
    };
    setSession();
  }, [userEmail, userName]);

  // Send message to Flask backend
  const handleSend = async (text = input) => {
    if (text.trim() === '') return;

    const newMessages = [...messages, { from: 'user', text }];
    setMessages(newMessages);
    setInput('');
    setSessionActive(true);

    // Generate session ID if this is the first message
    if (!currentSessionId) {
      const sessionId = generateCustomUUID();
      setCurrentSessionId(sessionId);
    }

    try {
      const response = await fetch("https://zeelsheta-debugmate_backend.hf.space/chat/dual", {
        method: "POST",
        headers: { "Content-Type": "application/json" ,"Authorization": "Bearer debugmate123" },
        credentials: "include",
        body: JSON.stringify({
          message: text,
          project_id: projectInfo?.projectId || "default"
        }),
      });
      
      const data = await response.json();
      const botReply = { from: 'bot', text: data.reply || "⚠️ No reply from server" };

      const updatedMessages = [...newMessages, botReply];
      setMessages(updatedMessages);

      // Save to unified chat history
      const sessionName = projectInfo.projectName 
        ? `Developer - ${projectInfo.projectName}`
        : `Developer Chat - ${new Date().toLocaleDateString()}`;

      if (!sessionActive) {
        // Start new session
        setChatHistory(prev => [
          ...prev,
          { 
            id: currentSessionId || Date.now(), 
            sessionId: currentSessionId || Date.now(),
            chatType: 'developer',
            projectId: projectInfo?.projectId || 'default',
            projectName: projectInfo?.projectName || 'Default Project',
            summary: text, 
            fullChat: updatedMessages,
            timestamp: new Date().toISOString(),
            sessionName: sessionName
          },
        ]);
      } else {
        // Update existing session
        setChatHistory(prev =>
          prev.map((chat, idx) =>
            chat.sessionId === currentSessionId
              ? { 
                  ...chat, 
                  fullChat: updatedMessages,
                  timestamp: new Date().toISOString()
                } 
              : chat
          )
        );
      }
    } catch (error) {
      console.error("❌ Chat request failed:", error);
      setMessages(prev => [...prev, { from: 'bot', text: "Error connecting to chatbot." }]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleHistoryClick = (chat) => {
    setMessages(chat.fullChat);
    setCurrentSessionId(chat.sessionId);
    setSessionActive(true);
  };

  const handleHistoryDelete = (id) => {
    setChatHistory(prev => prev.filter(chat => chat.id !== id));
  };

  // Clear current chat but keep history
  const clearCurrentChat = () => {
    setMessages(getInitialMessages(projectInfo));
    setSessionActive(false);
    setCurrentSessionId(null);
  };

  // Group chats by date for better organization
  const groupedChats = chatHistory.reduce((groups, chat) => {
    const date = new Date(chat.timestamp).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(chat);
    return groups;
  }, {});

  return (
    <div className="chatbot-layout">
      {/* Main Chat Area */}
      <div className={`chatbot-container developer-chat-card${historyOpen ? ' with-history' : ' full-width'}`}>
        <Card className="chatbot-card developer-chat-card">
          <Card.Header className="d-flex align-items-center">
            <FaCode className="me-2" /> <span>Developer Chatbot</span>
            <button 
              onClick={clearCurrentChat}
              style={{
                marginLeft: 'auto',
                padding: '4px 8px',
                fontSize: '12px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Clear Chat
            </button>
          </Card.Header>

          {projectInfo.projectId && (
            <div className="project-info-banner" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '12px 20px',
              fontSize: '14px',
              borderBottom: '1px solid #e9ecef'
            }}>
              <strong>Project:</strong> {projectInfo.projectName || 'Unknown Project'}
              {projectInfo.projectId && <span style={{ marginLeft: '10px', opacity: 0.8 }}>(ID: {projectInfo.projectId})</span>}
            </div>
          )}

          <Card.Body className="chat-history">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-bubble ${msg.from}`}>{msg.text}</div>
            ))}
            <div ref={chatEndRef} />
          </Card.Body>

          <Card.Footer>
            <div className="chatbot-input-area">
              <div className="input-wrapper">
                <button className="attach-btn"><FaPaperclip /></button>
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button className="send-btn" onClick={() => handleSend()}>Send</button>
              </div>
            </div>
          </Card.Footer>
        </Card>
      </div>

      {/* Unified History Panel (Shows ALL chats - both Developer and Project) */}
      <div className={`history-panel${historyOpen ? '' : ' closed'}`}>
        <div className="panel-header">
          <h3>All Chat History</h3>
          <small style={{color: '#666', fontSize: '12px'}}>Developer & Project Chats</small>
        </div>
        <div className="history-list">
          {chatHistory.length === 0 ? (
            <p style={{ color: '#888', fontStyle: 'italic' }}>No chat history yet</p>
          ) : (
            Object.entries(groupedChats).map(([date, chats]) => (
              <div key={date}>
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: '#f0f0f0',
                  color: '#666',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  borderBottom: '1px solid #ddd'
                }}>
                  {date}
                </div>
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`history-item${messages === chat.fullChat ? ' selected' : ''}`}
                    onClick={() => handleHistoryClick(chat)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px'}}>
                        <span className="history-type-badge" style={{
                          background: chat.chatType === 'project' 
                            ? 'linear-gradient(135deg, #A80C4C, #090939, #421256, #531C9B)'
                            : 'linear-gradient(135deg, #667eea, #764ba2)',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '10px'
                        }}>
                          {chat.chatType === 'project' ? 'Project' : 'Developer'}
                        </span>
                        <button
                          className="history-delete-btn"
                          onClick={e => { e.stopPropagation(); handleHistoryDelete(chat.id); }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#dc3545',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                      <span className="history-summary">{chat.summary}</span>
                      {chat.timestamp && (
                        <small style={{ display: 'block', color: '#666', fontSize: '10px' }}>
                          {new Date(chat.timestamp).toLocaleTimeString()}
                        </small>
                      )}
                      {chat.projectName && chat.projectName !== 'Default Project' && (
                        <small style={{ display: 'block', color: '#888', fontSize: '10px' }}>
                          Project: {chat.projectName}
                        </small>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      {/* History Toggle Button */}
      <button
        className="history-toggle-btn"
        onClick={() => setHistoryOpen(prev => !prev)}
      >
        {historyOpen ? '→' : '←'}
      </button>
    </div>
  );
};

export default DeveloperChat;