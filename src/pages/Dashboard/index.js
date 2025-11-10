import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Alert } from 'react-bootstrap';
import { FiPlus, FiRefreshCw, FiArrowUp } from 'react-icons/fi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import projectDatabaseSupabase from '../../services/projectDatabaseSupabase';
import { databaseService } from '../../services/supabase';
import { usePermissions, PermissionButton } from '../../utils/permissionUtils';
import './Dashboard.css';

const StatCard = ({ value, title, icon }) => (
  <div className="stat-card-custom d-flex flex-column align-items-center justify-content-center">
    {icon && <div className="mb-2">{icon}</div>}
    <div className="stat-value">{value}</div>
    <div className="stat-title">{title}</div>
  </div>
);

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { canView, canCreate } = usePermissions();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [stats, setStats] = useState({
    openProjects: 0,
    completedProjects: 0,
    totalHours: 0
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [darkMode, setDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => setDarkMode(document.body.classList.contains('dark'));
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  const calculateProjectDays = (project) => {
    const start = new Date(project.start_date || project.startDate);
    const end = new Date(project.end_date || project.endDate);
    
    if (isNaN(start) || isNaN(end)) return 0; // fallback for missing dates
  
    const diffTime = Math.abs(end - start); // difference in milliseconds
    const diffDays = diffTime / (1000 * 60 * 60 * 24); // convert ms to days
  
    return Math.ceil(diffDays); // round up to nearest whole day
  };
  
  
  const fetchProjects = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      // Fetch projects and remove duplicates based on UUID
      const projectsData = await projectDatabaseSupabase.getAllProjects();
      
      // Remove duplicates by creating a map with UUID as key
      const uniqueProjectsMap = new Map();
      (projectsData || []).forEach(project => {
        if (project.uuid) {
          uniqueProjectsMap.set(project.uuid, project);
        }
      });
      
      // Convert map values back to array
      const uniqueProjects = Array.from(uniqueProjectsMap.values());
      
      // Update state with unique projects
      setProjects(uniqueProjects);

      // Calculate stats based on unique projects
      const openProjects = uniqueProjects.filter(p => (p.status?.toLowerCase() !== 'completed')).length;
      const completedProjects = uniqueProjects.filter(p => (p.status?.toLowerCase() === 'completed')).length;
      const totalDays = uniqueProjects.reduce((acc, proj) => acc + calculateProjectDays(proj), 0);

      setStats({
        openProjects,
        completedProjects,
        totalHours: totalDays
      });
      
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (location.state?.refreshProjects) {
      // Force a fresh fetch and clear any cached data
      projectDatabaseSupabase.clearCache();
      fetchProjects(true);
      setShowSuccessAlert(true);
      // Clear the location state to prevent duplicate fetches
      window.history.replaceState({}, document.title);
      setTimeout(() => setShowSuccessAlert(false), 5000);
    }
  }, [location.state]);

  useEffect(() => {
    const dashboardContainer = document.querySelector('.dashboard-container');
    const handleScroll = () => {
      if (dashboardContainer) setShowScrollTop(dashboardContainer.scrollTop > 300);
    };
    if (dashboardContainer) {
      dashboardContainer.addEventListener('scroll', handleScroll);
      return () => dashboardContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const scrollToTop = () => {
    const dashboardContainer = document.querySelector('.dashboard-container');
    if (dashboardContainer) dashboardContainer.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateChat = async (proj, e) => {
    if (e) e.stopPropagation(); // Prevent event bubbling if event is provided
    
    try {
      const projectId = proj.uuid;
      if (!projectId) {
        console.error('Project ID is missing');
        return;
      }

      // Show loading state
      const button = e?.currentTarget;
      const originalText = button?.innerHTML;
      if (button) {
        button.disabled = true;
        button.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Creating...';
      }

      const { data: chatData, error } = await databaseService.createChatId(projectId);

      if (error) {
        console.error('Failed to create chat:', error);
        // Restore button state
        if (button) {
          button.disabled = false;
          button.innerHTML = originalText;
        }
        return;
      }

      navigate('/chatbot/WorkChat', {
        state: {
          projectId: projectId,
          projectName: proj?.project_name || proj?.projectName,
          chatId: chatData.chat_id
        }
      });
    } catch (err) {
      console.error('Error creating chat:', err);
      // Restore button state in case of error
      const button = e?.currentTarget;
      if (button) {
        button.disabled = false;
        button.innerHTML = 'Create Chat';
      }
    }
  };

  // Card colors
  const getRandomCardColor = (index) => {
    if (darkMode) {
      return "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460, #533483)";
    } else {
      const colors = ["#fff9c4", "#bbdefb", "#ffcdd2", "#c8e6c9", "#ffe0b2"];
      return colors[index % colors.length];
    }
  };

  // Date formatter
  const formatProjectDate = (project) => {
    const rawDate = project?.createdAt || project?.created_at || project?.start_date || project?.startDate;
    if (!rawDate) return '';
    const d = new Date(rawDate);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  };

  // Project filtering
  const filteredProjects = projects.filter(project => {
    if (statusFilter === 'all') return true;
    return (project.status || 'Not Started').toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <Container fluid className="dashboard-container">
      {showSuccessAlert && (
        <Alert variant="success" onClose={() => setShowSuccessAlert(false)} dismissible className="mb-3">
          <strong>Success!</strong> Your project has been created successfully and is now visible in the dashboard.
        </Alert>
      )}

      {/* Stats Section */}
      <Row className="g-8 mb-4 justify-content-center">
        <Col md={3} sm={6} xs={12}>
          <StatCard value={stats.openProjects.toString()} title="Open Projects" />
        </Col>
        <Col md={3} sm={6} xs={12}>
          <StatCard value={stats.completedProjects.toString()} title="Completed Projects" />
        </Col>
        <Col md={3} sm={6} xs={12}>
          <StatCard value={stats.totalHours.toFixed(2)} title="Total Project Days" />
        </Col>
      </Row>

      {/* Project Cards */}
      <Row>
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-4 text-muted">
            No projects found. Create your first project to get started.
            <div className="d-flex justify-content-center gap-2 mt-3">
              <Button variant="outline-primary" onClick={() => fetchProjects(true)} disabled={refreshing}>
                <FiRefreshCw className={refreshing ? 'spinning me-2' : 'me-2'} />
                {refreshing ? 'Refreshing...' : 'Refresh Projects'}
              </Button>
              <PermissionButton
                page="Project Form"
                action="Insert"
                buttonProps={{
                  as: Link,
                  to: "/project",
                  className: "btn btn-primary"
                }}
              >
                <FiPlus className="me-2" />
                Create New Project
              </PermissionButton>
            </div>
          </div>
        ) : (
          <div className="debug-section-card">
            <div className="debug-header d-flex justify-content-between align-items-center mb-3">
              <h6>All Projects ({filteredProjects.length})</h6>
              <div className="d-flex align-items-center gap-3">
                <select 
                color='white'
                  className="status-dropdown" 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="not started">Not Started</option>
                  <option value="in progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="on hold">On Hold</option>
                </select>
                <Button
                  page="Project Form"
                  action="Insert"
                  as={Link} 
                  to="/EmployeeProjectForm" 
                  className="btn btn-primary d-flex align-items-center"
                  style={{background: "linear-gradient(135deg, #A80C4C, #090939, #421256, #531C9B)",  color: "white"}}
                >
                  <FiPlus className="me-2" />
                  New Project
                </Button>
              </div>
            </div>

            <div className="debug-projects-grid">
              {filteredProjects.map((proj, index) => (
                <Card 
                  key={proj.uuid || index} 
                  className="project-card-custom mb-3"
                  style={{background: getRandomCardColor(index), borderRadius: '12px'}}
                >
                  <Card.Body>
                    <div className="date-tag mb-2">{formatProjectDate(proj)}</div>

                    {/* ✅ Fixed Project Title */}
                    <Card.Title className="project-title">
                      {proj?.project_name || proj?.projectName || "No Project Name"}
                    </Card.Title>

                    {/* ✅ Fixed Project Description */}
                    <Card.Text className="project-desc">
                      {proj?.project_description || proj?.projectDescription || "No description available"}
                    </Card.Text>

                    <div className="btn-container">
                      <Button 
                        as={Link} 
                        to={`/project/${proj.uuid}`} 
                        variant="outline-secondary" 
                        size="sm" 
                        className="view-details-pill"
                      >
                        View Details
                      </Button>
                      <Button 
                        onClick={(e) => handleCreateChat(proj, e)}
                        variant="primary" 
                        size="sm" 
                        className="create-chat-btn"
                      >
                        <FiPlus className="me-1" stroke="" /> Create Chat
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Row>

      {/* Scroll To Top */}
      {showScrollTop && (
        <Button onClick={scrollToTop} className="scroll-to-top-btn" variant="primary" size="sm" title="Scroll to top">
          <FiArrowUp />
        </Button>
      )}
    </Container>
  );
};

export default Dashboard;
