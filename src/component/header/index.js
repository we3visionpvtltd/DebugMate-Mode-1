import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import Button from '@mui/material/Button';
import { MdMenuOpen } from "react-icons/md";
import { MdOutlineMenu } from "react-icons/md";
import 'bootstrap/dist/css/bootstrap.min.css';
import { MdOutlineLightMode } from "react-icons/md";
import { FaUserCircle } from "react-icons/fa";
import { IoMdNotificationsOutline } from "react-icons/io";
import { MyContext } from "../../App";
import { databaseService } from '../../services/supabase';

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import PersonAdd from '@mui/icons-material/PersonAdd';
import Settings from '@mui/icons-material/Settings';
import Logout from '@mui/icons-material/Logout';
import Avatar from '@mui/material/Avatar';

const Header = ({ onToggleSidebar }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const open = Boolean(anchorEl);
  const notificationOpen = Boolean(notificationAnchorEl);
  const context = useContext(MyContext);
  const navigate = useNavigate();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!context.userEmail) return;
    
    try {
      const { data, error } = await databaseService.getAnnouncements();
      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }
      
      if (data) {
        // Filter notifications for the current user that are NOT read
        const userNotifications = data.filter(announcement => 
          announcement.recipient_email === context.userEmail && !announcement.is_read
        );
        
        // Sort by timestamp (newest first)
        const sortedNotifications = userNotifications.sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        setNotifications(sortedNotifications);
        setUnreadCount(sortedNotifications.length); // unread only
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };
  

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      // Update notification as read in database
      // This would require a new API endpoint
      console.log('Marking notification as read:', notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Fetch notifications on component mount and when user changes
  useEffect(() => {
    if (context.userEmail) {
      fetchNotifications();
      
      // Set up polling for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [context.userEmail]);

  const handleLogout = async () => {
    if (context.setIsSignIn) context.setIsSignIn(false);
    if (context.setUsername) context.setUsername('');
    if (context.setUserEmail) context.setUserEmail('');
    if (context.setUserRole) context.setUserRole('Guest');
    if (context.setUserPermissions) context.setUserPermissions({});
    try { sessionStorage.removeItem('authUser'); } catch (_) {}
    try { localStorage.removeItem('authUser'); } catch (_) {}
    // Log employee logout event
    if (context.username && context.username !== '' && context.userEmail) {
      await databaseService.logEmployeeLogout({ email: context.userEmail });
    }
    setAnchorEl(null);
    navigate('/');
  };
  return (
    <header className="d-flex align-items-center">
      <div className="container-fluid w-100">
        <div className="row d-flex align-items-center w-100">
          {/* logo wrapper*/}
          <div className="col-2 part1">
            <Link to={"/"} className="d-flex align-items-center logo">
              <img src={logo} alt="logo" style={{ background: 'transparent' }} />
              <span className="ml-2">DebugMate </span>
            </Link>
          </div>
          <div className="col-2 d-flex part2">
            {/* <Button className="rounded-circle menu-btn" onClick={onToggleSidebar}><MdMenuOpen /></Button> */}
            <Button className="rounded-circle menu-btn" onClick={() => context.setIstoggleSidebar(!context.istoggleSidebar)}>
              {
                context.istoggleSidebar === false ? <MdMenuOpen /> : <MdOutlineMenu />}</Button>
          </div>
          <div className="col-8 d-flex align-items-center justify-content-end space-between part3">
            <div className="d-flex align-items-center">
            <Button className="rounded-circle" onClick={() => context.setIstheme(!context.istheme)}><MdOutlineLightMode /></Button>
            <div className="notification-button-container">
              <Button 
                className="rounded-circle notification-button" 
                onClick={handleNotificationClick}
              >
                <IoMdNotificationsOutline />
                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>
            </div>
            </div>
          {
            context.isSignIn !== true ?
             <Link to={`/signin`}><Button className="signin-btn btn-rounded">Sign In</Button></Link>
              : 
              <div className="myacc-wrapper">
              <div className="d-flex align-items-center myacc">
                <div className="userImg">
                  <Button className="rounded-circle  profile" onClick={handleClick}><FaUserCircle /></Button>
                  <Menu
                    anchorEl={anchorEl}
                    id="account-menu"
                    open={open}
                    onClose={handleClose}
                    onClick={handleClose}
                    slotProps={{
                      paper: {
                        elevation: 0,
                        sx: {
                          overflow: 'visible',
                          filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                          mt: 1.5,
                          '& .MuiAvatar-root': {
                            width: 32,
                            height: 32,
                            ml: -0.5,
                            mr: 1,
                          },
                          '&::before': {
                            content: '""',
                            display: 'block',
                            position: 'absolute',
                            top: 0,
                            right: 14,
                            width: 10,
                            height: 10,
                            bgcolor: 'background.paper',
                            transform: 'translateY(-50%) rotate(45deg)',
                            zIndex: 0,
                          },
                        },
                      },
                    }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  >
                    <MenuItem onClick={handleClose}>
                      <Avatar /> My account
                    </MenuItem>
                    <Divider />
                    
                    <MenuItem onClick={() => {
                      handleClose();
                      navigate('/setting');
                    }}>
                      <ListItemIcon>
                        <Settings fontSize="small" />
                      </ListItemIcon>
                      Settings
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                      <ListItemIcon>
                        <Logout fontSize="small" />
                      </ListItemIcon>
                      Logout
                    </MenuItem>
                  </Menu>
                </div>
                <div className="userInfo">
                  <h4>{context.username || 'User'}</h4>
                </div>
              </div>
            </div>
          }

         {/* Notification Dropdown */}
<Menu
  anchorEl={notificationAnchorEl}
  id="notification-menu"
  open={notificationOpen}
  onClose={handleNotificationClose}
  slotProps={{
    paper: {
      elevation: 0,
      sx: {
        overflow: 'visible',
        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
        mt: 1.5,
        minWidth: 350,
        maxHeight: 400,
        '&::before': {
          content: '""',
          display: 'block',
          position: 'absolute',
          top: 0,
          right: 14,
          width: 10,
          height: 10,
          bgcolor: 'background.paper',
          transform: 'translateY(-50%) rotate(45deg)',
          zIndex: 0,
        },
      },
    },
  }}
  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
>
  {/* Header */}
  <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
    <h6 style={{ margin: 0, fontWeight: 'bold' }}>Notifications</h6>
    {unreadCount > 0 && (
      <small style={{ color: '#666' }}>{unreadCount} unread</small>
    )}
  </div>

  {/* Notification List */}
  {notifications.length === 0 ? (
    <MenuItem disabled>
      <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
        No notifications yet
      </div>
    </MenuItem>
  ) : (
    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
      {notifications.map((notification, index) => (
        <MenuItem
          key={notification.id || index}
          onClick={() => {
            // 1️⃣ Mark as read in DB
            markAsRead(notification.id);

            // 2️⃣ Remove it from UI immediately
            setNotifications((prev) =>
              prev.filter((n) => n.id !== notification.id)
            );

            // 3️⃣ Decrease unread count
            setUnreadCount((prev) => Math.max(prev - 1, 0));

            // 4️⃣ Close menu and go to announcements
            handleNotificationClose();
            navigate('/announcements');
          }}
          style={{
            backgroundColor: notification.is_read ? 'transparent' : '#f0f8ff',
            borderLeft: notification.is_read ? 'none' : '3px solid #1976d2',
            padding: '12px 16px',
            whiteSpace: 'normal',
            wordWrap: 'break-word',
          }}
        >
          <div style={{ width: '100%' }}>
            <div
              style={{
                fontWeight: notification.is_read ? 'normal' : 'bold',
                fontSize: '14px',
                marginBottom: '4px',
                color: '#000', // ensure visible
              }}
            >
              {notification.sender_email || 'System'}
            </div>
            <div
              style={{
                fontSize: '13px',
                color: '#666',
                marginBottom: '4px',
              }}
            >
              {notification.message ||
                notification.title ||
                'New announcement'}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: '#999',
              }}
            >
              {new Date(notification.timestamp).toLocaleString()}
            </div>
          </div>
        </MenuItem>
      ))}
    </div>
  )}

  {/* Footer */}
  {notifications.length > 0 && (
    <div
      style={{
        padding: '8px',
        borderTop: '1px solid #e0e0e0',
        textAlign: 'center',
      }}
    >
      <Button
        size="small"
        onClick={() => {
          handleNotificationClose();
          navigate('/announcements');
        }}
      >
        View All Notifications
      </Button>
    </div>
  )}
</Menu>

</div>
        </div>
      </div>
    </header>
  )
}

export default Header;
