import { Card, Badge, Table, Container, Button, Modal, Form, Alert, Row, Col } from "react-bootstrap";
import { useContext, useState, useEffect } from "react";
import { MyContext } from "../../App";
import { usePermissions, PermissionButton } from "../../utils/permissionUtils";
import { databaseService } from "../../services/supabase";
import { useMessages } from "../../contexts/messagecontext";

const Announcements = () => {
  const { userEmail, userRole } = useContext(MyContext);
  const { canView, canUpdate } = usePermissions();
  const { sendMessage, getConversationMessages } = useMessages();

  // State for announcements from backend
  const [announcements, setAnnouncements] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for send announcement modal
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendForm, setSendForm] = useState({
    recipient_email: '',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  // State for user emails dropdown
  const [userEmails, setUserEmails] = useState([]);
  const [loadingEmails, setLoadingEmails] = useState(false);


  // State for chat modal
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatRecipient, setChatRecipient] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatSuccess, setChatSuccess] = useState(false);

  // State for reply functionality
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replySuccess, setReplySuccess] = useState(false);

  // Fetch user emails for dropdown
  const fetchUserEmails = async () => {
    try {
      setLoadingEmails(true);
      const { data, error } = await databaseService.getAllUserLogins();

      if (error) {
        console.error('Error fetching user emails:', error);
        return;
      }

      if (data) {
        // Extract emails and names, exclude current user
        const emails = data
          .filter(user => user.email !== userEmail) // Exclude current user
          .map(user => ({
            email: user.email,
            name: user.name || 'Unknown User',
            role: user.role || 'Employee'
          }))
          .sort((a, b) => a.name.localeCompare(b.name)); // Sort by name

        setUserEmails(emails);
      }
    } catch (error) {
      console.error('Error fetching user emails:', error);
    } finally {
      setLoadingEmails(false);
    }
  };

  // Load announcements from Supabase
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching announcements from Supabase...');

      // Get announcements where user is sender or recipient
      const { data, error } = await databaseService.getAnnouncements();

      if (error) {
        console.error('❌ Supabase error:', error);
        setError(`Database error: ${error.message}`);
        return;
      }

      if (data && data.length > 0) {
        // Filter announcements for current user
        const userAnnouncements = data.filter(announcement =>
          announcement.sender_email === userEmail || announcement.recipient_email === userEmail
        );

        console.log('📝 Found announcements for user:', userAnnouncements.length);

        // Group by conversation (sender-recipient pair) for display
        const groupedAnnouncements = {};
        userAnnouncements.forEach(announcement => {
          // Create a conversation key that includes both sender and recipient
          const conversationKey = announcement.sender_email === userEmail 
            ? announcement.recipient_email 
            : announcement.sender_email;

          if (!groupedAnnouncements[conversationKey]) {
            groupedAnnouncements[conversationKey] = [];
          }

          // Format timestamp
          const timestamp = announcement.timestamp;
          const formattedTime = timestamp ?
            new Date(timestamp).toLocaleString() :
            'Unknown time';

          groupedAnnouncements[conversationKey].push({
            id: announcement.id,
            sender: announcement.sender_email,
            text: announcement.message,
            time: formattedTime,
            status: announcement.status || 'Message'
          });
        });

        setAnnouncements(groupedAnnouncements);
        console.log('📦 Grouped announcements:', groupedAnnouncements);
      } else {
        console.log('📭 No announcements found');
        setAnnouncements({});
      }

    } catch (err) {
      console.error('❌ Error:', err);
      setError(`Error loading announcements: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [userEmail]);

  // Fetch user emails when component mounts
  useEffect(() => {
    fetchUserEmails();
  }, [userEmail]);

  // Fetch emails when modal opens
  useEffect(() => {
    if (showSendModal) {
      fetchUserEmails();
    }
  }, [showSendModal]);

  // Force re-render when messages context updates
  const [, forceUpdate] = useState({});
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate({});
    }, 1000); // Update every second to show real-time changes
    return () => clearInterval(interval);
  }, []);

  // Handle sending announcement
  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    setSending(true);
    setSendError(null);
    setSendSuccess(false);

    try {
      console.log('📤 Sending announcement to Supabase...');

      // Prepare announcement data
      const announcementData = {
        sender_email: userEmail,
        recipient_email: sendForm.recipient_email,
        message: sendForm.message,
        timestamp: new Date().toISOString(),
        status: sendForm.message.startsWith("📌 Task") ? "Pending" : "Message"
      };

      // Send to Supabase
      const { data, error } = await databaseService.createAnnouncement(announcementData);

      if (error) {
        console.error('❌ Supabase error:', error);
        setSendError(`Failed to send announcement: ${error.message}`);
        return;
      }

      console.log('✅ Announcement sent successfully:', data);
      setSendSuccess(true);
      setSendForm({ recipient_email: '', message: '' });

      // Also send to message context for real-time chat
      sendMessage(sendForm.recipient_email, sendForm.message);

      // Refresh announcements
      await fetchAnnouncements();

      setTimeout(() => {
        setShowSendModal(false);
        setSendSuccess(false);
      }, 2000);

    } catch (err) {
      console.error('❌ Error sending announcement:', err);
      setSendError(`Error sending announcement: ${err.message}`);
    } finally {
      setSending(false);
    }
  };
  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;

    try {
      const { error } = await databaseService.deleteAnnouncement(announcementId);
      if (error) {
        console.error("Error deleting announcement:", error);
        alert("Failed to delete announcement!");
        return;
      }
      alert("Announcement deleted successfully!");
      fetchAnnouncements(); // Refresh list
    } catch (err) {
      console.error("Error deleting announcement:", err);
    }
  };

  // Handle opening chat modal
  const handleOpenChat = (recipientEmail) => {
    const recipient = userEmails.find(user => user.email === recipientEmail);
    setChatRecipient(recipient || { email: recipientEmail, name: recipientEmail });
    setShowChatModal(true);
  };

  // Handle sending chat message
  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (chatMessage.trim() && chatRecipient) {
      try {
        // Send to message context for real-time display
        sendMessage(chatRecipient.email, chatMessage);
        
        // Also save to database for persistence
        const announcementData = {
          sender_email: userEmail,
          recipient_email: chatRecipient.email,
          message: chatMessage,
          timestamp: new Date().toISOString(),
          status: chatMessage.startsWith("📌 Task") ? "Pending" : "Message"
        };

        const { error } = await databaseService.createAnnouncement(announcementData);
        if (error) {
          console.error('Error saving chat message to database:', error);
          // Still show the message in chat even if database save fails
        } else {
          console.log('Chat message saved to database successfully');
          // Refresh announcements to show the new message
          await fetchAnnouncements();
          setChatSuccess(true);
          setTimeout(() => setChatSuccess(false), 3000);
        }
        
        setChatMessage('');
      } catch (err) {
        console.error('Error sending chat message:', err);
        // Still send to message context even if database save fails
        sendMessage(chatRecipient.email, chatMessage);
        setChatMessage('');
      }
    }
  };

  // Handle opening reply modal
  const handleOpenReply = (message) => {
    setReplyToMessage(message);
    setShowReplyModal(true);
  };

  // Handle sending reply
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (replyMessage.trim() && replyToMessage && chatRecipient) {
      try {
        // Send to message context for real-time display
        sendMessage(chatRecipient.email, replyMessage);
        
        // Also save to database for persistence
        const announcementData = {
          sender_email: userEmail,
          recipient_email: chatRecipient.email,
          message: replyMessage,
          timestamp: new Date().toISOString(),
          status: replyMessage.startsWith("📌 Task") ? "Pending" : "Message"
        };

        const { error } = await databaseService.createAnnouncement(announcementData);
        if (error) {
          console.error('Error saving reply to database:', error);
        } else {
          console.log('Reply saved to database successfully');
          // Refresh announcements to show the new message
          await fetchAnnouncements();
          setReplySuccess(true);
          setTimeout(() => setReplySuccess(false), 3000);
        }
        
        setReplyMessage('');
        setShowReplyModal(false);
      } catch (err) {
        console.error('Error sending reply:', err);
        // Still send to message context even if database save fails
        sendMessage(chatRecipient.email, replyMessage);
        setReplyMessage('');
        setShowReplyModal(false);
      }
    }
  };


  // Local state to track task statuses
  const [taskStatus, setTaskStatus] = useState({});

  const handleStatusChange = (email, idx, status) => {
    setTaskStatus((prev) => ({
      ...prev,
      [`${email}-${idx}`]: status,
    }));
    // TODO: Optionally, send this update to your backend to persist
  };

  // Filter announcements to show only those where user is sender or recipient
  let visibleMessages = {};

  Object.entries(announcements).forEach(([email, msgs]) => {
    const filteredMsgs = msgs.filter(
      (msg) => msg.sender === userEmail || email === userEmail
    );
    if (filteredMsgs.length > 0) {
      visibleMessages[email] = filteredMsgs;
    }
  });

  if (loading) {
    return (
      <Container fluid className="p-4" style={{ marginTop: "90px" }}>
        <h2 className="fw-bold mb-4 text-primary">  Announcements</h2>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading announcements...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container fluid className="p-4" style={{ marginTop: "90px" }}>
        <h2 className="fw-bold mb-4 text-primary"> Announcements</h2>
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="p-4" style={{ marginTop: "90px" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-black text-primary"> Messages</h2>
        <div className="d-flex gap-2">

          <Button
            variant="primary"
            onClick={() => setShowSendModal(true)}
            className="d-flex align-items-center"
          >
            <span className="me-2">📤</span>
            Send Messages
          </Button>
        </div>
      </div>

      {Object.keys(visibleMessages).length === 0 ? (
        <p className="text-muted">No announcements yet.</p>
      ) : (
        Object.entries(visibleMessages).map(([conversationPartner, msgs]) => {
          // Get the partner's name from userEmails or use email
          const partnerInfo = userEmails.find(user => user.email === conversationPartner) || 
                             { name: conversationPartner, email: conversationPartner };
          
          return (
          <Card key={conversationPartner} className="mb-4 shadow-sm border-0">
            <Card.Header className=" text-white fw-bold " style={{background:" linear-gradient(135deg, #A80C4C, #090939)"}}>
              Conversation with <span className="text-red">"{partnerInfo.email}"</span>
            </Card.Header>
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Message / Task</th>
                    <th>From</th>
                    <th>Time</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {msgs.map((msg, idx) => {
                    const key = `${conversationPartner}-${idx}`;
                    const status = taskStatus[key] || (msg.text.startsWith("📌 Task") ? "Pending" : "Message");
                    
                    // Debug logging
                    console.log('Debug delete button:', {
                      msgSender: msg.sender,
                      userEmail: userEmail,
                      areEqual: msg.sender === userEmail,
                      msgId: msg.id
                    });

                    return (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{msg.text}</td>
                        <td className="small text-muted">
                            {msg.sender}
                         
                        </td>
                        <td className="small text-muted">{msg.time}</td>
                       
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenChat(conversationPartner)}
                              title="Start chat"
                            >
                              💬 Chat
                            </Button>
                            {msg.sender && userEmail && msg.sender.trim().toLowerCase() === userEmail.trim().toLowerCase() && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDeleteAnnouncement(msg.id)}
                                title="Delete announcement"
                              >
                                🗑️ Delete
                              </Button>
                            )}
                          </div>
                        </td>


                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
          );
        })
      )}

      {/* Real-time Chat Messages Section */}
      {userEmails.length > 0 && (
        <Card className="mb-4 shadow-sm border-0">
          <Card.Header className="fw-bold bg-info text-white">
            💬 Real-time Chat Messages
          </Card.Header>
          <Card.Body className="p-0">
            <Table hover responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Chat Partner</th>
                  <th>Latest Message</th>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {userEmails.map((user, idx) => {
                  // Get messages from database for this user
                  const conversationMessages = Object.entries(announcements)
                    .filter(([conversationPartner]) => conversationPartner === user.email)
                    .flatMap(([, msgs]) => msgs)
                    .sort((a, b) => new Date(a.time) - new Date(b.time));
                  
                  const latestMessage = conversationMessages[conversationMessages.length - 1];
                  
                  if (!latestMessage) return null;
                  
                  return (
                    <tr key={idx}>
                      <td>{idx+1}</td>
                      <td>
                       
                        <small className="text-muted">{user.email}</small>
                      </td>
                      <td>
                        <div className="d-flex align-items-start gap-2">
                         
                          <span style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {latestMessage.text}
                          </span>
                        </div>
                      </td>
                      <td className="small text-muted">{latestMessage.time}</td>
                      <td>
                        <Badge bg={latestMessage.text.startsWith("📌 Task") ? "warning" : "secondary"}>
                          {latestMessage.text.startsWith("📌 Task") ? "📌 Task" : "💬 Message"}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenChat(user.email)}
                            title="Open chat"
                          >
                            💬 Chat
                          </Button>
                         
                        </div>
                      </td>
                    </tr>
                  );
                }).filter(Boolean)}
              </tbody>
            </Table>
            {userEmails.every(user => {
              const conversationMessages = Object.entries(announcements)
                .filter(([conversationPartner]) => conversationPartner === user.email)
                .flatMap(([, msgs]) => msgs);
              return conversationMessages.length === 0;
            }) && (
              <div className="text-center text-muted py-3">
                No chat messages yet. Start a conversation!
              </div>
            )}
          </Card.Body>
        </Card>
      )}

     

      {/* Send Announcement Modal */}
      <Modal show={showSendModal} onHide={() => setShowSendModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>📤 Send Announcement & Chat Message</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {sendSuccess && (
            <Alert variant="success" className="mb-3">
              ✅ Announcement sent successfully! (Saved to database and sent to chat)
            </Alert>
          )}
          {sendError && (
            <Alert variant="danger" className="mb-3">
              ❌ {sendError}
            </Alert>
          )}
          <Form onSubmit={handleSendAnnouncement}>
            <Form.Group className="mb-3">
              <Form.Label>Recipient Email</Form.Label>
              <Form.Select
                value={sendForm.recipient_email}
                onChange={(e) => setSendForm({ ...sendForm, recipient_email: e.target.value })}
                required
                disabled={loadingEmails}
              >
                <option value="">
                  {loadingEmails ? 'Loading users...' : 'Select a recipient'}
                </option>
                {userEmails.map((user, index) => (
                  <option key={index} value={user.email}>
                    {user.name} ({user.email}) - {user.role}
                  </option>
                ))}
              </Form.Select>
              {userEmails.length === 0 && !loadingEmails && (
                <Form.Text className="text-muted">
                  No other users found. You can still type an email manually below.
                </Form.Text>
              )}
            </Form.Group>

            {/* Manual email input as fallback */}


            <Form.Group className="mb-3">
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Enter your announcement message..."
                value={sendForm.message}
                onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })}
                required
              />
              <Form.Text className="text-muted">
                💡 Tip: Start with "📌 Task" to create a task announcement. This message will be saved to the database AND sent to the recipient's chat.
              </Form.Text>
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowSendModal(false)}
                disabled={sending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={sending}
              >
                {sending ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Sending...
                  </>
                ) : (
                  'Send Announcement'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Chat Modal */}
      <Modal show={showChatModal} onHide={() => setShowChatModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2">
            💬 Chat with {chatRecipient?.name || chatRecipient?.email}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Chat Messages */}
          <div 
            style={{ 
              maxHeight: '400px', 
              overflowY: 'auto', 
              background: '#f8f9fa', 
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '15px'
            }}
          >
            {chatRecipient && (() => {
              // Get messages for this specific conversation from the database
              const conversationMessages = Object.entries(announcements)
                .filter(([conversationPartner]) => conversationPartner === chatRecipient.email)
                .flatMap(([, msgs]) => msgs)
                .sort((a, b) => new Date(a.time) - new Date(b.time)); // Sort by time
              
              return conversationMessages.length > 0 ? (
                conversationMessages.map((msg, idx) => {
                  const isMine = msg.sender === userEmail;
                  return (
                    <div key={idx} className="d-flex mb-2" style={{ justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                      <div
                        style={{
                          maxWidth: '70%',
                          background: isMine ? '#dcf8c6' : '#ffffff',
                          border: '1px solid rgba(0,0,0,0.075)',
                          borderRadius: '16px',
                          padding: '8px 12px',
                          boxShadow: '0 1px 1px rgba(0,0,0,0.06)'
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          
                          
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                        <div className="text-muted small mt-1" style={{ textAlign: 'right' }}>{msg.time}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-muted py-4">
                  No messages yet. Start the conversation!
                </div>
              );
            })()}
          </div>

          {/* Send Message Form */}
          <Form onSubmit={handleSendChatMessage}>
            {chatSuccess && (
              <Alert variant="success" className="mb-3">
                ✅ Message sent successfully!
              </Alert>
            )}
            <Form.Group className="mb-3">
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Type your message here..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                required
              />
            </Form.Group>
            <div className="d-flex justify-content-between align-items-center">
              <Form.Text className="text-muted">
                💡 This message will be sent to the recipient's chat
              </Form.Text>
              <div className="d-flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowChatModal(false)}
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!chatMessage.trim()}
                >
                  Send Message
                </Button>
              </div>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

     
    </Container>
  );
};

export default Announcements;
