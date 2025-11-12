import React, { useState } from "react";
    import "./project_info.css";
    import { Container, Form, Button, Row, Col } from "react-bootstrap";
    import projectDatabaseSupabase from '../../services/projectDatabaseSupabase';
    import SuccessNotification from './SuccessNotification';
    import { useNavigate } from "react-router-dom";
    import { usePermissions } from '../../utils/permissionUtils';

    const roleOptions = [
        { label: "Frontend", value: "frontend" },
        { label: "Backend", value: "backend" },
        { label: "AI Development", value: "ai" },
        { label: "Metaverse", value: "metaverse" },
    ];

    const statusOptions = [
        "Not Started", "In Progress", "Completed", "On Hold"
    ];
    const techStackOptions = [
        "React-js", "Node-js", "MongoDB", "Python", "TensorFlow", "Unity", "Unreal", "Figma", "Photoshop"
    ];
   
    const teamMembersList = [
    ];

    const EmployeeProjectForm = () => {
        const navigate = useNavigate();
        const { canCreate } = usePermissions();
        
        const [form, setForm] = useState({
            projectName: "",
            projectDescription: "",
            startDate: "",
            endDate: "",
            status: "",
            assignedRole: "",
            assignedTo: [],
            clientName: "",
            uploadDocuments: null,
            projectScope: "",
            techStack: [],
            techStackCustom: "",
            leaderOfProject: "",
            projectResponsibility: "",
            role: [],
            roleAnswers: {},
            customQuestion: "",
            customAnswer: "",
        });
        const [customTeamMember, setCustomTeamMember] = useState("");
        const [customTeamList, setCustomTeamList] = useState([]);
        const [teamAssignments, setTeamAssignments] = useState([]);
        const [selectedRoles, setSelectedRoles] = useState([]);
// Example: [{ email: "abc@gmail.com", roles: ["web", "uiux"] }]

        const [customRole, setCustomRole] = useState("");
        const [customRoleList, setCustomRoleList] = useState([]);
       

        const [customTech, setCustomTech] = useState("");
        const [customTechList, setCustomTechList] = useState([]);
        const [customQuestion, setCustomQuestion] = useState("");
        const [customQuestionsList, setCustomQuestionsList] = useState([]);
        const [customAnswers, setCustomAnswers] = useState({});
        const [showSuccess, setShowSuccess] = useState(false);
       
        const handleAddCustomTech = () => {
            const tech = customTech.trim();
            if (tech && !techStackOptions.concat(customTechList).includes(tech)) {
                setCustomTechList(prev => [...prev, tech]);
                setCustomTech("");
            }
        };
        const allRoleOptions = [...roleOptions, ...customRoleList];
        const allTechOptions = [...techStackOptions, ...customTechList];
        // For file upload
        const handleFileChange = (e) => {
            const files = Array.from(e.target.files);
            const fileReaders = files.map(file => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        resolve({ name: file.name, data: event.target.result });
                    };
                    reader.onerror = (err) => reject(err);
                    reader.readAsDataURL(file);
                });
            });
            Promise.all(fileReaders).then(fileObjs => {
                setForm((prev) => ({ ...prev, uploadDocuments: fileObjs }));
            });
        };

        const handleChange = (e) => {
            const { name, value, type, } = e.target;
            if (type === "checkbox" && name === "assignedTo") {
                setForm((prev) => {
                    const arr = prev.assignedTo.includes(value)
                        ? prev.assignedTo.filter((v) => v !== value)
                        : [...prev.assignedTo, value];
                    return { ...prev, assignedTo: arr };
                });
            } else if (type === "checkbox" && name === "techStack") {
                setForm((prev) => {
                    const arr = prev.techStack.includes(value)
                        ? prev.techStack.filter((v) => v !== value)
                        : [...prev.techStack, value];
                    return { ...prev, techStack: arr };
                });
            } else {
                setForm((prev) => ({ ...prev, [name]: value }));
            }
        };

       

        // const handleCustomAnswer = (value) => {
        //     setForm((prev) => ({ ...prev, customAnswer: value }));
        // };

        const handleSubmit = async (e) => {
            e.preventDefault();
            
            // Check permission before proceeding
            if (!canCreate('Project Form')) {
                alert('You do not have permission to create projects.');
                return;
            }
            
            try {
                console.log('=== FORM SUBMISSION DEBUG ===');
                console.log('Form data:', form);
                console.log('Team Assignments:', teamAssignments);
                console.log('Custom Questions:', customQuestionsList);
                console.log('Custom Answers:', customAnswers);
                
                const submissionData = {
                    ...form,
                    customQuestions: customQuestionsList,
                    customAnswers: customAnswers,
                    teamAssignments, // <-- include team members here
                };
                
                console.log('Complete submission data:', submissionData);
        
                // Save form data to Supabase database
                const result = await projectDatabaseSupabase.saveProject(submissionData);
        
                console.log('Save project result:', result);
        
                if (result.success) {
                    setShowSuccess(true);
                    console.log('Project saved successfully, redirecting to dashboard...');
        
                    // Reset form after successful submission
                    setForm({
                        projectName: "",
                        projectDescription: "",
                        startDate: "",
                        endDate: "",
                        status: "",
                        assignedRole: "",
                        assignedTo: [],
                        clientName: "",
                        uploadDocuments: null,
                        projectScope: "",
                        techStack: [],
                        techStackCustom: "",
                        leaderOfProject: "",
                        projectResponsibility: "",
                        role: [],
                        roleAnswers: {},
                        customQuestion: "",
                        customAnswer: "",
                    });
                    setCustomTeamList([]);
                    setTeamAssignments([]); // <-- reset team members
                    setCustomRoleList([]);
                    setCustomTechList([]);
                    setCustomQuestionsList([]);
                    setCustomAnswers({});
        
                    // Redirect to dashboard after 2 seconds
                    setTimeout(() => {
                        console.log('Navigating to dashboard with refresh flag...');
                        navigate('/dashboard', { state: { refreshProjects: true } });
                    }, 2000);
                } else {
                    console.error('Failed to save project:', result.message);
                    alert('Failed to save project: ' + result.message);
                }
            } catch (error) {
                console.error('Error saving project:', error);
                alert('Failed to save project. Please try again.');
            }
        };
        

      
        // Combine and deduplicate questions for all selected roles


        const handleAddCustomQuestion = () => {
            const question = customQuestion.trim();
            if (question && !customQuestionsList.includes(question)) {
                setCustomQuestionsList(prev => [...prev, question]);
                setCustomQuestion("");
            }
        };

        const handleCustomAnswerChange = (question, value) => {
            setCustomAnswers(prev => ({ ...prev, [question]: value }));
        };

        return (
            <Container className="project-form-container d-flex align-items-center justify-content-center min-vh-99" style={{ flexDirection: 'column' }}>
                <SuccessNotification show={showSuccess} message={`Project "${form.projectName}" has been successfully created! Redirecting to dashboard...`} onClose={() => setShowSuccess(false)} />
                <Form className="project-form-card p-4" onSubmit={handleSubmit}>
                    <h3 className="mb-4 text-center">Employee Project Form</h3>
                    {/* Default Questions */}
                    <Form.Group className="mb-3">
                        <Form.Label>Project Name</Form.Label>
                        <Form.Control
                            type="text"
                            name="projectName"
                            value={form.projectName}
                            onChange={handleChange}
                            required
                            placeholder="Name/title of the project"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Project Description</Form.Label>
                        <Form.Control
                            as="textarea"
                            name="projectDescription"
                            value={form.projectDescription}
                            onChange={handleChange}
                            rows={3}
                            required
                            placeholder="Summary or purpose of the project"
                        />
                    </Form.Group>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Start Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="startDate"
                                    value={form.startDate}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>End Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="endDate"
                                    value={form.endDate}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label>Status</Form.Label>
                        <Form.Select
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select status</option>
                            {statusOptions.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>


                    <Form.Group className="mb-3">
  <Form.Label>Team Members with Roles</Form.Label>
  
  {/* Email Input */}
  <div className="d-flex mb-2">
    <Form.Control
      type="email"
      placeholder="Enter team member email"
      value={customTeamMember}
      onChange={(e) => setCustomTeamMember(e.target.value)}
      className="me-2 ht"
    />

    <Button
    className="ht"
      variant="outline-primary"
      type="button"
      onClick={() => {
        const email = customTeamMember.trim();
        if (!email) return;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          alert("Please enter a valid email address.");
          return;
        }
        if (selectedRoles.length === 0) {
          alert("Please assign at least one role to this team member.");
          return;
        }

        setTeamAssignments((prev) => [
          ...prev,
          { email, roles: [...selectedRoles] }
        ]);
        setCustomTeamMember("");
        setSelectedRoles([]);
      }}
      disabled={!customTeamMember.trim() || selectedRoles.length === 0}
    >
      Add 
    </Button>
  </div>

  {/* Role Checkboxes */}
  <div className="mb-3">
    {allRoleOptions.map((opt) => (
      <Form.Check
        inline
        key={opt.value}
        type="checkbox"
        id={`role-${opt.value}`}
        label={opt.label}
        value={opt.value}
        checked={selectedRoles.includes(opt.value)}
        onChange={(e) => {
          const value = e.target.value;
          setSelectedRoles((prev) =>
            prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]
          );
        }}
      />
    ))}
  </div>

  {/* Add Custom Role */}
  <div className="d-flex mb-3">
    <Form.Control
      type="text"
      placeholder="Add custom Role"
      value={customRole}
      onChange={(e) => setCustomRole(e.target.value)}
      className="me-2 ht"
    />
    <Button
    className="ht"
      variant="outline-success"
      type="button"
      onClick={() => {
        const role = customRole.trim();
        if (
          role &&
          !allRoleOptions.some((opt) => opt.label.toLowerCase() === role.toLowerCase())
        ) {
          setCustomRoleList((prev) => [
            ...prev,
            { label: role, value: role.toLowerCase().replace(/\s+/g, "-") }
          ]);
          setCustomRole("");
        }
      }}
      disabled={!customRole.trim()}
    >
      Add
    </Button>
  </div>

  {/* Show Team Assignments */}
  {teamAssignments.length > 0 && (
    <ul className="email-list mt-2">
      {teamAssignments.map((member, idx) => (
        <li key={idx} className="email-item fade-in">
          <span>{member.email}</span>
          <span className="ms-2 badge bg-secondary">
            {member.roles.join(", ")}
          </span>
          <Button
            variant="outline-danger"
            size="sm"
            className="ms-2"
            onClick={() =>
              setTeamAssignments((prev) => prev.filter((_, i) => i !== idx))
            }
          >
            ✕
          </Button>
        </li>
      ))}
    </ul>
  )}
</Form.Group>



                    <Form.Group className="mb-3">
                        <Form.Label>Client Name/Owner Name</Form.Label>
                        <Form.Control
                            type="text"
                            name="clientName"
                            value={form.clientName}
                            onChange={handleChange}
                            placeholder="Add client name if applicable"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Upload Documents</Form.Label>
                        <Form.Control
                            type="file"
                            name="uploadDocuments"
                            onChange={handleFileChange}
                            multiple
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Project Scope</Form.Label>
                        <Form.Control
                            as="textarea"
                            name="projectScope"
                            value={form.projectScope}
                            onChange={handleChange}
                            rows={2}
                            placeholder="Scope of projects"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Technology Stack</Form.Label>
                        <div>
                            {allTechOptions.map((tech) => (
                                <Form.Check
                                    key={tech}
                                    type="checkbox"
                                    id={`techStack-${tech}`}
                                    label={tech}
                                    name="techStack"
                                    value={tech}
                                    checked={form.techStack.includes(tech)}
                                    onChange={handleChange}
                                    className="mb-2"
                                />
                            ))}
                            <div className="d-flex mt-2">
                                <Form.Control
                                    type="text"
                                    value={customTech}
                                    onChange={e => setCustomTech(e.target.value)}
                                    placeholder="Add custom technology"
                                    className="me-2"
                                />
                                <Button variant="outline-primary" type="button" onClick={handleAddCustomTech} disabled={!customTech.trim()}>
                                    Add
                                </Button>
                            </div>
                        </div>
                    </Form.Group>
                    <Form.Group className="mb-3">
  <Form.Label>Leader of Project</Form.Label>
  <Form.Select
    name="leaderOfProject"
    value={form.leaderOfProject}
    onChange={handleChange}
    required={teamAssignments.length > 0} // require if there are team members
    disabled={teamAssignments.length === 0} // disable if no members
  >
    <option value="">Select leader</option>
    {teamAssignments.map((member) => (
      <option key={member.email} value={member.email}>
        {member.email}
      </option>
    ))}
  </Form.Select>
</Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Project Responsibility</Form.Label>
                        <Form.Control
                            type="text"
                            name="projectResponsibility"
                            value={form.projectResponsibility}
                            onChange={handleChange}
                            placeholder="Description of assigned team members"
                        />
                    </Form.Group>
                   
                    {/* Custom Question */}
                    <Form.Group className="mb-3">
                        <Form.Label>Custom Question</Form.Label>
                        <div className="d-flex">
                            <Form.Control
                                type="text"
                                value={customQuestion}
                                onChange={e => setCustomQuestion(e.target.value)}
                                placeholder="Type your custom question"
                                className="me-2"
                            />
                            <Button variant="outline-primary" type="button" onClick={handleAddCustomQuestion} disabled={!customQuestion.trim()}>
                                Add
                            </Button>
                        </div>
                    </Form.Group>
                    {customQuestionsList.map((q, idx) => (
                        <Form.Group as={Row} className="mb-3" key={q}>
                            <Form.Label column sm={8}>{q}</Form.Label>
                            <Col sm={4}>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    value={customAnswers[q] || ""}
                                    onChange={e => handleCustomAnswerChange(q, e.target.value)}
                                    required
                                    placeholder="Type your answer"
                                />
                            </Col>
                        </Form.Group>
                    ))}
                    <Button type="submit" className="w-100 mt-3" variant="primary">
                        Submit
                    </Button>
                </Form>
            </Container>
        );
    };

    export default EmployeeProjectForm;
