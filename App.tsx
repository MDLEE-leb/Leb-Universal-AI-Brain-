// Fix: Corrected import for React hooks.
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.tsx';
import Header from './components/Header.tsx';
import ChatPanel from './components/ChatPanel.tsx';
import VisionPanel from './components/VisionPanel.tsx';
import AudioPanel from './components/AudioPanel.tsx';
import ImagePanel from './components/ImagePanel.tsx';
import EditPanel from './components/EditPanel.tsx';
import VideoPanel from './components/VideoPanel.tsx';
import DashboardPanel from './components/DashboardPanel.tsx';
import WebPanel from './components/WebPanel.tsx';
import TaskPanel from './components/TaskPanel.tsx';
import QrPanel from './components/QrPanel.tsx';
import LivePanel from './components/LivePanel.tsx';
import { BrainType } from './types.ts';
import { BrainIcon } from './components/icons.tsx';
// Fix: Corrected import for useAuth hook.
import { AuthProvider } from './contexts/AuthContext.tsx';
import { useAuth } from './hooks/useAuth.ts';
import LoginPanel from './components/LoginPanel.tsx';
import PasswordRecoveryPanel from './components/PasswordRecoveryPanel.tsx';
import RegistrationPanel from './components/RegistrationPanel.tsx';

const MainAppLayout: React.FC = () => {
  const [activeBrain, setActiveBrain] = useState<BrainType>(BrainType.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chatSystemInstruction, setChatSystemInstruction] = useState<string>("You are a helpful and versatile AI assistant. Provide clear, concise, and accurate information.");
  const [model, setModel] = useState<string>('gemini-2.5-flash');

  useEffect(() => {
    // To help manage costs, default to the more cost-effective flash model
    // when switching brains. The user can still select the pro model if needed.
    setModel('gemini-2.5-flash');
  }, [activeBrain]);

  const chatModels = ['gemini-2.5-flash', 'gemini-2.5-pro'];
  const codeModels = ['gemini-2.5-pro', 'gemini-2.5-flash'];

  const brainComponents: { [key in BrainType]?: React.ReactNode } = {
    [BrainType.DASHBOARD]: <DashboardPanel setActiveBrain={setActiveBrain} />,
    [BrainType.CHAT]: (
      <ChatPanel
        key="chat-brain"
        modelName={model}
        setModelName={setModel}
        availableModels={chatModels}
        systemInstruction={chatSystemInstruction}
        setSystemInstruction={setChatSystemInstruction}
        showSystemInstructionInput={true}
        title="Chat Brain"
        placeholder="Ask me anything..."
      />
    ),
    [BrainType.CODE]: (
      <ChatPanel
        key="code-brain"
        modelName={model}
        setModelName={setModel}
        availableModels={codeModels}
        systemInstruction="You are an expert programmer and code assistant. Provide clean, efficient, and well-explained code snippets. Use markdown for code blocks. When analyzing an image, describe the code or UI in it and answer any questions."
        title="Code Brain"
        placeholder="Enter a coding prompt or upload an image..."
        allowImageUpload={true}
      />
    ),
    [BrainType.HTML]: <WebPanel />,
    [BrainType.VISION]: <VisionPanel />,
    [BrainType.AUDIO]: <AudioPanel />,
    [BrainType.IMAGE]: <ImagePanel />,
    [BrainType.EDIT]: <EditPanel />,
    [BrainType.VIDEO]: <VideoPanel />,
    [BrainType.LIVE]: <LivePanel />,
    [BrainType.TASK]: <TaskPanel />,
    [BrainType.QR]: <QrPanel />,
  };

  const renderActiveBrain = () => {
    return brainComponents[activeBrain] || (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <BrainIcon className="w-24 h-24 mb-4" />
        <h2 className="text-2xl font-bold">Select a Brain</h2>
        <p>Choose a specialized AI brain from the sidebar to get started.</p>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans overflow-hidden">
      <Sidebar
        activeBrain={activeBrain}
        setActiveBrain={setActiveBrain}
        isSidebarOpen={isSidebarOpen}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          setActiveBrain={setActiveBrain} 
        />
        <main className="flex-1 overflow-y-auto">
          {renderActiveBrain()}
        </main>
      </div>
    </div>
  );
};

const AuthGate: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [view, setView] = useState<'login' | 'recover' | 'register'>('login');
    const [loginMessage, setLoginMessage] = useState('');

    const handleSwitchToLogin = (message = '') => {
        setLoginMessage(message);
        setView('login');
    };

    if (!isAuthenticated) {
        switch (view) {
            case 'login':
                return <LoginPanel onSwitchToRecover={() => setView('recover')} onSwitchToRegister={() => setView('register')} message={loginMessage} />;
            case 'recover':
                return <PasswordRecoveryPanel onSwitchToLogin={handleSwitchToLogin} onSwitchToRegister={() => setView('register')} />;
            case 'register':
                return <RegistrationPanel onSwitchToLogin={handleSwitchToLogin} />;
            default:
                return <LoginPanel onSwitchToRecover={() => setView('recover')} onSwitchToRegister={() => setView('register')} message={loginMessage} />;
        }
    }

    return <MainAppLayout />;
};

const App: React.FC = () => {
  useEffect(() => {
    document.title = 'Leb Universal AI Brain';
  }, []);

  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
};

export default App;
