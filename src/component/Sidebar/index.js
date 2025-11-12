import Button from '@mui/material/Button';
import { RiDashboardFill } from "react-icons/ri";
import { IoIosArrowForward, } from "react-icons/io";
import { IoMdSettings } from "react-icons/io";
import { TbMessageChatbot } from "react-icons/tb";
import { VscActivateBreakpoints } from "react-icons/vsc";
import { Link } from 'react-router-dom';
import { RxAccessibility } from "react-icons/rx";
import React,{ useState} from 'react';
import { FaWpforms } from "react-icons/fa6";
import { MdNotifications } from 'react-icons/md';

const Sidebar = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [isToggle, setIsToggle] = useState(false);

    const isOpenSubmenu = (index) => {
        setActiveTab(index);
        setIsToggle(!isToggle);
    }

    return (
        <>
        <div className="sidebar">
            <ul>
                <li>
                    <Link to="/dashboard" >
                    <Button className={`w-100 ${activeTab === 0 && isToggle===true ? 'active' : ' '}`} onClick={() => isOpenSubmenu(0)}>
                        <span className='icon'>
                            <RiDashboardFill />
                        </span>
                        <span className='text'>Dashboard</span>
                        <span className='arrow'>
                            <IoIosArrowForward />
                        </span>
                    </Button>
                    </Link>
                </li>
                <li>
                    
                    <Button className={`w-100 ${activeTab === 1 && isToggle===true ? 'active' : ' '}`} onClick={() => isOpenSubmenu(1)}>
                        <span className='icon'><FaWpforms /></span>
                        <span className='text'>Project</span>
                        <span className='arrow arrow1'><IoIosArrowForward /></span>
                    </Button>
                    <div className={`submenuwrapper ${activeTab === 1 && isToggle===true ? 'colapse' : 'colapsed'}`}>
                    <ul className='sub-menu'>
                        <li><Link to="/EmployeeProjectForm">Project Form</Link>
                        </li>
                        <li><Link to="/project/DetailsTable ">Project Description</Link></li>
                    </ul>
                    </div>
                </li>
                <li>
                    
                    <Button className={`w-100 ${activeTab === 2 && isToggle===true ? 'active' : ' '}`} onClick={() => isOpenSubmenu(2)}>
                        <span className='icon'><TbMessageChatbot /></span>
                        <span className='text'>Chatbot</span>
                        <span className='arrow arrow1'><IoIosArrowForward /></span>
                    </Button>
                    <div className={`submenuwrapper ${activeTab === 2 && isToggle===true ? 'colapse' : 'colapsed'}`}>
                    <ul className='sub-menu'>
                        <li><Link to="/chatbot/feedback">Feedback</Link></li>
                        <li><Link to="/chatbot/dual">ChatDual</Link></li>
                    </ul>
                    </div>
                </li>
                <li>
                        <Button className={`w-100 ${activeTab === 3 && isToggle===true ? 'active' : ' '}`} onClick={() => isOpenSubmenu(3)}>
                            <span className='icon'>
                                <RxAccessibility />
                            </span>
                            <span className='text'>Role Management</span>
                            <span className='arrow arrow1'>
                                <IoIosArrowForward />
                            </span>
                        </Button>
                    <div className={`submenuwrapper ${activeTab === 3 && isToggle===true ? 'colapse' : 'colapsed'}`}>
                        <ul className='sub-menu part2'>
                            <li><Link to="/role-management/createmail">Create Mails</Link></li>
                            <li><Link to="/role-management/chooserole">Choose Roles</Link></li>
                        </ul>
                    </div>
                </li>
                <li>
                    <Link to="/Announcements">
                    <Button className={`w-100 ${activeTab === 4 && isToggle===true ? 'active' : ' '}`} onClick={() => isOpenSubmenu(4)}>
                        <span className='icon'>
                            <MdNotifications />
                        </span>
                        <span className='text'>Announcements</span>
                        <span className='arrow'>
                            <IoIosArrowForward />
                        </span>

                    </Button>
                    </Link>
                </li>

                <li>
                    <Link to="/Overview">
                    <Button className={`w-100 ${activeTab === 5 && isToggle===true ? 'active' : ' '}`} onClick={() => isOpenSubmenu(5)}>
                        <span className='icon'>
                            <VscActivateBreakpoints />
                        </span>
                        <span className='text'>Overview</span>
                        <span className='arrow'>
                            <IoIosArrowForward />
                        </span>
                    </Button>
                    </Link>
                </li>
                <li>
                    <Link to="/Setting">
                    <Button className={`w-100 ${activeTab === 6 && isToggle===true ? 'active' : ' '}`} onClick={() => isOpenSubmenu(6)}>
                        <span className='icon'>
                            <IoMdSettings />
                        </span>
                        <span className='text' >Setting</span>
                        <span className='arrow'>
                        <IoIosArrowForward />
                        </span>

                    </Button>
                    </Link>
                </li>
            </ul>
            </div>
        </>
        
    )
}

export default Sidebar;
