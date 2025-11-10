import React from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { FiUsers, FiSettings, FiMessageSquare, FiDatabase } from "react-icons/fi";

const Overview=()=>{
    return (
        <Container fluid className="py-5 bg-light mt-5">
          <Row className="mb-4 text-center">
            <Col>
              <h1 className="fw-bold">Debugmate – Intelligent Project Assistant</h1>
              <p className="text-muted fs-5">
                A centralized platform with AI-powered chatbots to manage projects, 
                roles, and real-time support for employees.
              </p>
            </Col>
          </Row>
    
          <Row className="g-4">
            <Col md={6} lg={3}>
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <FiMessageSquare size={32} className="text-primary mb-3" />
                  <Card.Title>Dual Chatbots</Card.Title>
                  <Card.Text>
                    Get real-time help with a <b>General Chatbot</b> for coding & queries, 
                    and a <b>Project Chatbot</b> for role-based project details.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
    
            <Col md={6} lg={3}>
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <FiUsers size={32} className="text-success mb-3" />
                  <Card.Title>Role-Based Access</Card.Title>
                  <Card.Text>
                    Admins & HR can manage projects and tasks, while employees 
                    view only their assigned work securely.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
    
            <Col md={6} lg={3}>
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <FiDatabase size={32} className="text-warning mb-3" />
                  <Card.Title>Project Management</Card.Title>
                  <Card.Text>
                    Submit new projects, track deadlines, and view data in 
                    <b> table or card view</b> for better decisions.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
    
            <Col md={6} lg={3}>
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <FiSettings size={32} className="text-danger mb-3" />
                  <Card.Title>Personalization</Card.Title>
                  <Card.Text>
                    Customize your profile, switch between <b>light & dark themes</b>, 
                    and get a tailored workspace experience.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
    
          <Row className="mt-5 text-center">
            <Col>
              <h3 className="fw-bold">How Debugmate Works</h3>
              <p className="text-muted fs-5">
                Login securely → Explore projects in dashboard → Get instant chatbot help → 
                Submit forms & feedback → Collaborate efficiently.
              </p>
              <Button variant="primary" size="lg" className="mt-3">
                Get Started
              </Button>
            </Col>
          </Row>
        </Container>
      );
    };
    
export default Overview;