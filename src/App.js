// App.js
import React, { useState, useEffect, createContext } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from './component/header';
import "bootstrap/dist/css/bootstrap.min.css";
import Sidebar from './component/Sidebar';
import Communication from './pages/chatbot/Communication';
import Dashboard from './pages/Dashboard';
import Feedback from './pages/chatbot/feedback';
import ChooseRole from './pages/Role-management/chooserole';
import CreateMail from './pages/Role-management/createmail.js';
import Announcements from './pages/Announcements/index.js';
import ChatbotIcon from './component/ChatbotIcon';
import SignIn from './pages/Signin';
import EmployeeProjectForm from './pages/project/project_info.js';
import ApiManagement from './pages/Api_managment/Api_managment.js';
import Overview from './pages/Overview/Overview.js';
import Setting from './pages/Setting/setting.js';
import ProjectDetailsTable from './pages/project/ProjectDetailsTable';
import ProjectDetails from './pages/project/ProjectDetails';
import WorkChat from './pages/chatbot/WorkChat.js';
import DeveloperChat from './pages/chatbot/DeveloperChat';
import DualChatbot from './pages/chatbot/DualChatbot';
import ProtectedRoute from './component/ProtectedRoute';
import ChatPage from './pages/project/chatpage.js';
import { MessagesProvider } from './contexts/messagecontext.js';

const MyContext = createContext();

// Component to conditionally render ChatbotIcon
const ConditionalChatbotIcon = () => {
  const location = useLocation();
  const shouldHideIcon = location.pathname === '/communication' || 
   location.pathname === '/chatbot/communication' || 
   location.pathname === '/chatbot/dual' || 
   location.pathname === '/chatbot/WorkChat' || 
                        location.pathname === '/signin' || 
                        location.pathname === '/';
  
  return shouldHideIcon ? null : <ChatbotIcon />;
};

function App() {
  const [istoggleSidebar, setIstoggleSidebar] = useState(false);
  const [isSignIn, setIsSignIn] = useState(false);
  const [ishideSidebar, setIshideSidebar] = useState(false);
  const [istheme, setIstheme] = useState(true);
  const [username, setUsername] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const [userRole, setUserRole] = useState('Guest'); // 'Admin'/'Manager'/'Employee'
  const [userPermissions, setUserPermissions] = useState({});

// ✅ Login persistence (reload pachhi user login rahe)
 useEffect(() => {
 const savedUser = sessionStorage.getItem("authUser");
 if (savedUser) {
 const userData = JSON.parse(savedUser);
 setIsSignIn(true);
 setUsername(userData.name);
 setUserEmail(userData.email);
 setUserRole(userData.role);
 setUserPermissions(userData.permissions);
 }

 }, []);
 useEffect(() => {
    if (istheme) {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light');
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  }, [istheme]);

  const values = {
    istoggleSidebar,
    setIstoggleSidebar,
    isSignIn,
    setIsSignIn,
    ishideSidebar,
    setIshideSidebar,
    istheme,
    setIstheme,
    username,
    setUsername,
    userEmail,
    setUserEmail,
    userRole,
    setUserRole,
    userPermissions,
    setUserPermissions,
  };

  return (
    <BrowserRouter>
      <MyContext.Provider value={values}>
        {!ishideSidebar && <Header />}
        <div className="main d-flex">
          {!ishideSidebar && (
            <div className={`sidebarwrapper ${istoggleSidebar ? 'open' : ''}`}>
              <Sidebar />
            </div>
          )}

          <div className={`content ${ishideSidebar ? 'full' : ''} ${istoggleSidebar ? 'open' : ''}`}>
            {/* Wrap all routes with MessagesProvider */}
            <MessagesProvider>
            <Routes>
  <Route path="/" element={<SignIn/>} />
  <Route path="/signin" element={<SignIn/>} />

  {/* Project Form */}
  <Route
    path="/EmployeeProjectForm"
    element={
      <ProtectedRoute requiredPage="Project Form" requiredAction="Insert">
        <EmployeeProjectForm />
      </ProtectedRoute>
    }
  />

  {/* Dashboard */}
  <Route
    path="/dashboard"
    element={
      <ProtectedRoute requiredPage="Dashboard" requiredAction="View">
        <Dashboard />
      </ProtectedRoute>
    }
  />

  {/* Chat with team */}
  <Route
    path="/chat/:email"
    element={
      <ProtectedRoute requiredPage="ChatDual" requiredAction="View">
        <ChatPage />
      </ProtectedRoute>
    }
  />

  {/* Announcements */}
  <Route
    path="/announcements"
    element={
      <ProtectedRoute requiredPage="Announcements" requiredAction="View">
        <Announcements />
      </ProtectedRoute>
    }
  />

  {/* Role management */}
  <Route
    path="/role-management/chooserole"
    element={
      <ProtectedRoute requiredPage="Choose Roles" requiredAction="View">
        <ChooseRole />
      </ProtectedRoute>
    }
  />
  <Route
    path="/role-management/createmail"
    element={
      <ProtectedRoute requiredPage="Create Mails" requiredAction="View">
        <CreateMail />
      </ProtectedRoute>
    }
  />

  {/* Feedback */}
  <Route
    path="/chatbot/feedback"
    element={
      <ProtectedRoute requiredPage="Feedback" requiredAction="View">
        <Feedback />
      </ProtectedRoute>
    }
  />

  {/* API Management */}
  <Route
    path="/api-management"
    element={
      <ProtectedRoute requiredPage="API Management" requiredAction="View">
        <ApiManagement />
      </ProtectedRoute>
    }
  />

  {/* Overview */}
  <Route
    path="/overview"
    element={
      <ProtectedRoute requiredPage="Overview" requiredAction="View">
        <Overview />
      </ProtectedRoute>
    }
  />

  {/* Settings */}
  <Route
    path="/setting"
    element={
      <ProtectedRoute requiredPage="Profile Setting" requiredAction="View">
        <Setting />
      </ProtectedRoute>
    }
  />

  {/* Project Details */}
  <Route
    path="/project/DetailsTable"
    element={
      <ProtectedRoute requiredPage="Project Description" requiredAction="View">
        <ProjectDetailsTable />
      </ProtectedRoute>
    }
  />
  <Route
    path="/project/:id"
    element={
      <ProtectedRoute requiredPage="Project Description" requiredAction="View">
        <ProjectDetails />
      </ProtectedRoute>
    }
  />

  {/* Chatbot pages */}
  <Route
    path="/chatbot"
    element={
      <ProtectedRoute requiredPage="ChatDual" requiredAction="View">
        <WorkChat />
      </ProtectedRoute>
    }
  />
  <Route
    path="/chatbot/WorkChat"
    element={
      <ProtectedRoute requiredPage="ChatDual" requiredAction="View">
        <WorkChat />
      </ProtectedRoute>
    }
  />
  <Route
    path="/chatbot/communication"
    element={
      <ProtectedRoute requiredPage="ChatDual" requiredAction="View">
<Communication />
      </ProtectedRoute>
    }
  />
  <Route
    path="/chatbot/dual"
    element={
      <ProtectedRoute requiredPage="ChatDual" requiredAction="View">
        <DualChatbot />
      </ProtectedRoute>
    }
  />
</Routes>

            </MessagesProvider>
          </div>
        </div>
        <ConditionalChatbotIcon />
      </MyContext.Provider>
    </BrowserRouter>
  );
}

export default App;
export { MyContext };
