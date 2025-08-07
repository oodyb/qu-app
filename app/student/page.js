"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import LearningPathModal from "./modals/learning_path";
import "../styles/student_dashboard.css";

export default function StudentDashboard() {
    const [classes, setClasses] = useState([]);
    const [searchName, setSearchName] = useState("");
    const [searchCategory, setSearchCategory] = useState("");
    const [selectedClasses, setSelectedClasses] = useState({});
    const [categories, setCategories] = useState([]);
    const [currentStudentId, setCurrentStudentId] = useState(null);
    const [enrolledClasses, setEnrolledClasses] = useState([]);
    const [isLearningPathOpen, setIsLearningPathOpen] = useState(false);
    const [enrolledCoursesList, setEnrolledCoursesList] = useState([]);
    const [completedCoursesList, setCompletedCoursesList] = useState([]);
    const { data: session, status } = useSession();
    const router = useRouter();

    const handleClassChange = (courseId, classId) => { setSelectedClasses(prev => ({ ...prev, [courseId]: classId })) };

    const filteredClasses = classes.filter(cls => {
        const matchesName = cls.courseName.toLowerCase().includes(searchName.toLowerCase());
        const matchesCategory = searchCategory === "" || cls.category.includes(searchCategory);
        return matchesName && matchesCategory;
    });

    function openLearningPath() {
        setIsLearningPathOpen(true);
    }

    function closeLearningPath() {
        setIsLearningPathOpen(false);
    }

    const filteredEnrolledCourses = enrolledCoursesList.filter(course => {
        const matchesName = course.name.toLowerCase().includes(searchName.toLowerCase());
        const matchesCategory = searchCategory === "" || course.category.includes(searchCategory);
        return matchesName && matchesCategory;
    });

    const filteredCompletedCourses = completedCoursesList.filter(course => {
        const matchesName = course.name.toLowerCase().includes(searchName.toLowerCase());
        const matchesCategory = searchCategory === "" || course.category.includes(searchCategory);
        return matchesName && matchesCategory;
    });

    async function fetchClasses() {
        try {
            const res = await fetch("/api/student/classes");
            const data = await res.json();

            const grouped = {};
            const foundCategories = new Set();

            data.forEach(cls => {
                if (!grouped[cls.courseId]) {
                    grouped[cls.courseId] = { courseId: cls.courseId, courseName: cls.courseName, category: cls.category, classes: [] };
                }
                grouped[cls.courseId].classes.push({ ...cls, currentStudents: cls.currentStudents ?? 0 });

                if (Array.isArray(cls.category)) {
                    cls.category.forEach(cat => foundCategories.add(cat));
                } else {
                    foundCategories.add(cls.category);
                }
            });

            setClasses(Object.values(grouped));
            setCategories(Array.from(foundCategories));
        } catch (err) {
            toast.error("Failed to load classes", err);
        }
    }; useEffect(() => { fetchClasses(); }, []);

    async function fetchEnrolledClasses(studentId) {
        try {
            const res = await fetch("/api/student/enrollments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId }),
            });

            const data = await res.json();
            setEnrolledClasses(data.map(e => e.classId));
        } catch (err) {
            toast.error("Failed to load enrolled classes", err);
        }
    }

    async function fetchLearningPath(studentId) {
        try {
            const res = await fetch("/api/student/learning-path", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId }),
            });

            const data = await res.json();
            setEnrolledCoursesList(data.enrolled || []);
            setCompletedCoursesList(data.completed || []);
        } catch (err) {
            toast.error("Failed to load learning path");
        }
    }

    async function handleRegister(studentId, classId, courseId) {

        try {
            const res = await fetch("/api/student/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId, classId, courseId }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Registration failed");
            }

            fetchClasses();
            fetchEnrolledClasses(studentId);
            toast.success(`Class ${courseId}${classId} registered!`);
        } catch (err) {
            toast.error("Error: " + err.message);
        }
    }


    useEffect(() => {
        if (status === "loading") return;

        if (!session || session.user.role !== "STUDENT") {
            toast.error("Access denied. Please log in");
            router.push("/login");
        } else {
            console.log("Session user:", session.user);
            setCurrentStudentId(session.user.id);
            fetchEnrolledClasses(session.user.id);
            fetchLearningPath(session.user.id);
        }
    }, [session, status, router]);


    if (status === "loading") {
        return <div className="loading-container">Loading...</div>;
    }

    if (!session || session.user.role !== "STUDENT") {
        return null;
    }

    return (
        <div className="stu-container">
            <header className="stu-header">
                <div className="stu-header-content">
                    <div className="stu-logo-container">
                        <div className="stu-logo-img">
                            <img src="/images/qu-logo.png" alt="Qatar University logo" width="100%" />
                        </div>
                        <h1 className="stu-title">
                            QU <span className="stu-subtitle">Student</span>
                        </h1>
                    </div>
                    <nav className="stu-nav">
                        {session && (
                            <li className="stu-username-badge">
                                Welcome, {session.user.name || session.user.username}
                            </li>
                        )}
                        <ul className="stu-nav-links">
                            <li><a href="#" className="stu-nav-link" onClick={openLearningPath}>My Learning Path</a></li>
                            <li> <a className="stu-logout" onClick={async () => { await signOut({ callbackUrl: "/login" }); }}>Logout</a></li>
                        </ul>
                    </nav>
                </div>
            </header>
            <main className="stu-main">
                <section className="stu-courses-section">
                    <div className="stu-bar">
                        <h2>Courses</h2>
                        <div className="stu-search-bar">
                            <input
                                type="text" placeholder="Search by name" value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                            />
                            <select
                                value={searchCategory}
                                onChange={(e) => setSearchCategory(e.target.value)}
                            >
                                <option value="">Categories</option>
                                {categories.map((cat) => (<option key={cat} value={cat}> {cat} </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="stu-courses-container">
                        <table className="stu-table" id="coursesTable">
                            <thead>
                                <tr>
                                    <th>Course ID</th>
                                    <th>Course Name</th>
                                    <th>Category</th>
                                    <th>Class</th>
                                    <th>Instructor</th>
                                    <th>Available Seats</th>
                                    <th>Time</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredClasses.length === 0 ? (
                                    <tr><td colSpan="8">No courses found.</td></tr>) : (
                                    filteredClasses.map(course => {
                                        const selectedClassId = selectedClasses[course.courseId] || course.classes[0].classId;
                                        const selectedClass = course.classes.find(cls => cls.classId === selectedClassId);
                                        return (
                                            <tr key={course.courseId}>
                                                <td>{course.courseId}</td>
                                                <td>{course.courseName}</td>
                                                <td>{Array.isArray(course.category) ? course.category.join(", ") : course.category}</td>
                                                <td>
                                                    {selectedClass ? (
                                                        enrolledClasses.includes(selectedClass.classId) ? (
                                                            <div className="stu-class-label">{selectedClass.classId}</div>
                                                        ) : (
                                                            <select
                                                                value={selectedClassId}
                                                                className="stu-class-dropdown"
                                                                onChange={(e) => handleClassChange(course.courseId, e.target.value)}
                                                            >
                                                                {course.classes.map(cls => (
                                                                    <option key={`${course.courseId}-${cls.classId}`} value={cls.classId}>
                                                                        {cls.classId}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        )
                                                    ) : "N/A"}
                                                </td>
                                                <td>{selectedClass?.instructorName || "N/A"}</td>
                                                <td>
                                                    {selectedClass ? `${selectedClass.capacity - (selectedClass.currentStudents || 0)} left` : "N/A"}
                                                </td>
                                                <td>
                                                    {selectedClass?.schedule?.day?.map(
                                                        d => d[0] + d[1] + d[2]).join(" - ") || "N/A"} <br /> ({selectedClass?.schedule?.time || ""})
                                                </td>
                                                <td>
                                                    {selectedClass ? (
                                                        enrolledClasses.includes(selectedClass.classId) ? (
                                                            <span className="registered-label">Registered</span>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    if (!currentStudentId || !selectedClass?.classId || !course.courseId) {
                                                                        toast.error("Missing required data. Please try again.");
                                                                        return;
                                                                    }

                                                                    handleRegister(currentStudentId, selectedClass.classId, course.courseId);
                                                                }}
                                                                className="stu-btn-register"
                                                            >
                                                                Register
                                                            </button>
                                                        )
                                                    ) : "N/A"}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
                {isLearningPathOpen && (
                    <LearningPathModal
                        onClose={closeLearningPath}
                        enrolledCourses={filteredEnrolledCourses}
                        completedCourses={filteredCompletedCourses}
                    />
                )}
            </main>
            <footer className="stu-footer">
                <p>&copy; 2025 CSE Department - Qatar University</p>
            </footer>
        </div>
    );
}