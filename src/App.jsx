import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    onSnapshot,
    doc,
    deleteDoc,
    updateDoc,
    writeBatch,
    getDocs
} from 'firebase/firestore';

// --- Configuration ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// --- SVG Icons ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
const CopyIcon = ({ copied }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-colors ${copied ? 'text-green-400' : ''}`} viewBox="0 0 20 20" fill="currentColor">
        {copied ? (
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        ) : (
            <>
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2H6zm8 2H6v11h8V5z" />
            </>
        )}
    </svg>
);
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;

// --- Reusable Modal Component ---
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><CloseIcon /></button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- Main App Component ---
function App() {
    const [db, setDb] = useState(null);
    const [projects, setProjects] = useState([]);
    const [allLinks, setAllLinks] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [globalSearchTerm, setGlobalSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [copiedLinkId, setCopiedLinkId] = useState(null);

    // --- Modal States ---
    const [modalState, setModalState] = useState({ type: null, data: null });
    const [formData, setFormData] = useState({});

    const projectsCollectionPath = `projects`;
    const linksCollectionPath = `links`;

    useEffect(() => {
        try {
            const app = initializeApp(firebaseConfig);
            const dbInstance = getFirestore(app);
            setDb(dbInstance);
        } catch (e) {
            console.error("Firebase Initialization Error:", e);
            setError("Failed to initialize Firebase. Check config.");
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (db) {
            setIsLoading(true);
            const projectsQuery = query(collection(db, projectsCollectionPath));
            const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
                const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                projectsData.sort((a, b) => a.name.localeCompare(b.name));
                setProjects(projectsData);
                if (!selectedProject && projectsData.length > 0) {
                    setSelectedProject(projectsData[0]);
                }
            }, (err) => {
                console.error("Error fetching projects:", err);
                setError("Could not fetch projects.");
            });

            const linksQuery = query(collection(db, linksCollectionPath));
            const unsubscribeLinks = onSnapshot(linksQuery, (snapshot) => {
                const linksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                linksData.sort((a, b) => a.title.localeCompare(b.title));
                setAllLinks(linksData);
                setIsLoading(false);
            }, (err) => {
                console.error("Error fetching links:", err);
                setError("Could not fetch links.");
                setIsLoading(false);
            });

            return () => {
                unsubscribeProjects();
                unsubscribeLinks();
            };
        }
    }, [db]);

    const openModal = (type, data = null) => {
        setModalState({ type, data });
        setFormData(data || {});
    };

    const closeModal = () => {
        setModalState({ type: null, data: null });
        setFormData({});
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!db) return;

        try {
            switch (modalState.type) {
                case 'addProject':
                    await addDoc(collection(db, projectsCollectionPath), { name: formData.name, createdAt: new Date() });
                    break;
                case 'editProject':
                    await updateDoc(doc(db, projectsCollectionPath, modalState.data.id), { name: formData.name });
                    break;
                case 'addLink':
                    await addDoc(collection(db, linksCollectionPath), { title: formData.title, url: formData.url, projectId: selectedProject.id, createdAt: new Date() });
                    break;
                case 'editLink':
                    await updateDoc(doc(db, linksCollectionPath, modalState.data.id), { title: formData.title, url: formData.url });
                    break;
                case 'confirmDelete':
                    if (modalState.data.type === 'project') {
                        await handleDeleteProject(modalState.data.id);
                    } else {
                        await handleDeleteLink(modalState.data.id);
                    }
                    break;
                default:
                    break;
            }
            closeModal();
        } catch (err) {
            console.error("Form submission error:", err);
            setError("Failed to save data.");
        }
    };
    
    const handleDeleteProject = async (projectId) => {
        if (!db) return;
        try {
            const linksToDelete = allLinks.filter(link => link.projectId === projectId);
            const batch = writeBatch(db);
            linksToDelete.forEach(link => batch.delete(doc(db, linksCollectionPath, link.id)));
            await batch.commit();
            await deleteDoc(doc(db, projectsCollectionPath, projectId));
            if (selectedProject?.id === projectId) {
                const remainingProjects = projects.filter(p => p.id !== projectId);
                setSelectedProject(remainingProjects.length > 0 ? remainingProjects[0] : null);
            }
        } catch (err) {
            console.error("Error deleting project:", err);
            setError("Failed to delete project.");
        }
    };

    const handleDeleteLink = async (linkId) => {
        if (!db) return;
        try {
            await deleteDoc(doc(db, linksCollectionPath, linkId));
        } catch (err) {
            console.error("Error deleting link:", err);
            setError("Failed to delete link.");
        }
    };
    
    const handleCopyToClipboard = (text, linkId) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedLinkId(linkId);
            setTimeout(() => setCopiedLinkId(null), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    const filteredProjects = useMemo(() => {
        if (!globalSearchTerm) return projects;
        const lowercasedTerm = globalSearchTerm.toLowerCase();
        const projectIdsWithMatchingLinks = new Set(
            allLinks.filter(link => link.title.toLowerCase().includes(lowercasedTerm) || link.url.toLowerCase().includes(lowercasedTerm)).map(link => link.projectId)
        );
        return projects.filter(project => project.name.toLowerCase().includes(lowercasedTerm) || projectIdsWithMatchingLinks.has(project.id));
    }, [globalSearchTerm, projects, allLinks]);

    const filteredLinksForSelectedProject = useMemo(() => {
        if (!selectedProject) return [];
        const linksForProject = allLinks.filter(link => link.projectId === selectedProject.id);
        if (!globalSearchTerm) return linksForProject;
        const lowercasedTerm = globalSearchTerm.toLowerCase();
        return linksForProject.filter(link => link.title.toLowerCase().includes(lowercasedTerm) || link.url.toLowerCase().includes(lowercasedTerm));
    }, [globalSearchTerm, allLinks, selectedProject]);

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen bg-slate-900 text-white"><p>Loading App...</p></div>;
    }

    return (
        <div className="flex h-screen bg-slate-900 text-slate-200 font-sans">
            <aside className={`w-72 bg-slate-800/80 backdrop-blur-sm p-4 flex-col shrink-0 border-r border-slate-700 absolute md:relative z-20 md:flex h-full transition-transform transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-white">Checkout Hub</h1>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white"><CloseIcon /></button>
                </div>
                <p className="text-sm text-slate-400 mb-6 -mt-4">Your central dashboard for project links.</p>
                <button onClick={() => openModal('addProject')} className="w-full mb-4 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition flex items-center justify-center gap-2">
                    <PlusIcon /> Add Project
                </button>
                <nav className="flex-grow overflow-y-auto">
                    <ul className="space-y-2">
                        {filteredProjects.map(project => (
                            <li key={project.id}>
                                <a href="#" onClick={(e) => { e.preventDefault(); setSelectedProject(project); setSidebarOpen(false); }} className={`flex justify-between items-center p-3 rounded-md transition group ${selectedProject?.id === project.id ? 'bg-teal-600 text-white shadow-lg' : 'hover:bg-slate-700'}`}>
                                    <span className="font-semibold truncate">{project.name}</span>
                                    <div className="flex items-center">
                                        <button onClick={(e) => { e.stopPropagation(); openModal('editProject', project); }} className="p-1 text-white hover:cursor-pointer"><EditIcon /></button>
                                        <button onClick={(e) => { e.stopPropagation(); openModal('confirmDelete', { type: 'project', id: project.id, name: project.name }); }} className="p-1 text-white hover:cursor-pointer"><TrashIcon /></button>
                                    </div>
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>

            <main className="flex-1 p-4 md:p-8 overflow-y-auto flex flex-col">
                <div className="flex items-center mb-8">
                    <button onClick={() => setSidebarOpen(true)} className="md:hidden mr-4 text-slate-400 hover:text-white"><MenuIcon /></button>
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><SearchIcon /></div>
                        <input type="text" placeholder="Globally search projects and links..." value={globalSearchTerm} onChange={(e) => setGlobalSearchTerm(e.target.value)} className="w-full bg-slate-800 text-white placeholder-slate-400 rounded-lg pl-12 pr-4 py-3 md:py-4 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 text-base md:text-lg"/>
                    </div>
                </div>

                {globalSearchTerm ? (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-4">Search Results</h2>
                        <div className="space-y-3">
                            {filteredProjects.flatMap(project => 
                                allLinks
                                    .filter(link => link.projectId === project.id && (link.title.toLowerCase().includes(globalSearchTerm.toLowerCase()) || link.url.toLowerCase().includes(globalSearchTerm.toLowerCase())))
                                    .map(link => (
                                        <div key={link.id} className="bg-slate-800/80 p-4 rounded-lg flex items-center justify-between gap-4 border border-slate-700">
                                            <div className="flex-grow overflow-hidden">
                                                <p className="text-xs text-teal-400 font-bold uppercase">{project.name}</p>
                                                <h4 className="font-bold text-lg text-white truncate">{link.title}</h4>
                                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-teal-300 break-all transition truncate block">{link.url}</a>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <button onClick={() => handleCopyToClipboard(link.url, link.id)} className="p-2 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition" title="Copy URL"><CopyIcon copied={copiedLinkId === link.id} /></button>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                ) : selectedProject ? (
                    <div>
                        <header className="mb-8">
                            <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight">{selectedProject.name}</h2>
                            <p className="text-slate-400 mt-1">Manage checkout links for this project.</p>
                        </header>
                        <button onClick={() => openModal('addLink')} className="w-full md:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-5 rounded-md transition-transform transform hover:scale-105 shadow-md flex items-center gap-2 mb-8">
                            <PlusIcon /> Add New Link
                        </button>
                        <div className="space-y-3">
                            {filteredLinksForSelectedProject.map(link => (
                                <div key={link.id} className="bg-slate-800/80 p-4 rounded-lg flex items-center justify-between gap-4 transition-all hover:bg-slate-800 border border-slate-700">
                                    <div className="flex-grow overflow-hidden">
                                        <h4 className="font-bold text-lg text-white truncate">{link.title}</h4>
                                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 break-all transition truncate block">{link.url}</a>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button onClick={() => handleCopyToClipboard(link.url, link.id)} className="p-2 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition" title="Copy URL"><CopyIcon copied={copiedLinkId === link.id} /></button>
                                        <button onClick={() => openModal('editLink', link)} className="p-2 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition" title="Edit Link"><EditIcon /></button>
                                        <button onClick={() => openModal('confirmDelete', { type: 'link', id: link.id, name: link.title })} className="p-2 rounded-md hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition" title="Delete Link"><TrashIcon /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <h2 className="text-3xl font-bold text-white">Welcome to your Link Hub</h2>
                        <p className="text-slate-400 mt-2 max-w-md">Select a project from the sidebar to view its links, or add a new project to get started.</p>
                    </div>
                )}
            </main>

            <Modal isOpen={!!modalState.type} onClose={closeModal} title={
                modalState.type === 'addProject' ? 'Add New Project' :
                modalState.type === 'editProject' ? 'Edit Project' :
                modalState.type === 'addLink' ? 'Add New Link' :
                modalState.type === 'editLink' ? 'Edit Link' : 'Confirm Deletion'
            }>
                {modalState.type === 'confirmDelete' ? (
                    <div>
                        <p className="text-slate-300">Are you sure you want to delete <strong className="text-white">{modalState.data.name}</strong>? This action cannot be undone.</p>
                        <div className="mt-6 flex justify-end">
                            <button type="button" onClick={closeModal} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition mr-2">Cancel</button>
                            <form onSubmit={handleFormSubmit} className="inline">
                                <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition">Delete</button>
                            </form>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleFormSubmit}>
                        {(modalState.type === 'addProject' || modalState.type === 'editProject') && (
                            <div className="space-y-4">
                                <label className="block">
                                    <span className="text-slate-300">Project Name</span>
                                    <input type="text" name="name" value={formData.name || ''} onChange={handleFormChange} required className="mt-1 block w-full bg-slate-700 text-white placeholder-slate-400 rounded-md px-4 py-3 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"/>
                                </label>
                            </div>
                        )}
                        {(modalState.type === 'addLink' || modalState.type === 'editLink') && (
                            <div className="space-y-4">
                                <label className="block">
                                    <span className="text-slate-300">Link Title</span>
                                    <input type="text" name="title" value={formData.title || ''} onChange={handleFormChange} required className="mt-1 block w-full bg-slate-700 text-white placeholder-slate-400 rounded-md px-4 py-3 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"/>
                                </label>
                                <label className="block">
                                    <span className="text-slate-300">URL</span>
                                    <input type="url" name="url" value={formData.url || ''} onChange={handleFormChange} required className="mt-1 block w-full bg-slate-700 text-white placeholder-slate-400 rounded-md px-4 py-3 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"/>
                                </label>
                            </div>
                        )}
                        <div className="mt-6 flex justify-end">
                            <button type="button" onClick={closeModal} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition mr-2">Cancel</button>
                            <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition">Save</button>
                        </div>
                    </form>
                )}
            </Modal>
            {error && <div className="fixed bottom-4 right-4 bg-red-500 text-white py-2 px-4 rounded-lg shadow-lg" onClick={() => setError('')}>{error}</div>}
        </div>
    );
}

export default App;
