import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ExplorePage from './pages/projects/ExplorePage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import CreateProjectPage from './pages/projects/CreateProjectPage';
import EditProjectPage from './pages/projects/EditProjectPage';
import CommunitiesPage from './pages/communities/CommunitiesPage';
import CommunityDetailPage from './pages/communities/CommunityDetailPage';
import CreateCommunityPage from './pages/communities/CreateCommunityPage';
import DiscussionDetailPage from './pages/communities/DiscussionDetailPage';
import CodexPage from './pages/codex/CodexPage';
import CodexDetailPage from './pages/codex/CodexDetailPage';
import CreateCodexPage from './pages/codex/CreateCodexPage';
import EditCodexPage from './pages/codex/EditCodexPage';
import PortfolioPage from './pages/portfolio/PortfolioPage';
import PublicPortfolioPage from './pages/portfolio/PublicPortfolioPage';
import HackathonsPage from './pages/hackathons/HackathonsPage';
import HackathonDetailPage from './pages/hackathons/HackathonDetailPage';
import CreateHackathonPage from './pages/hackathons/CreateHackathonPage';
import SquadsPage from './pages/squads/SquadsPage';
import MessagesPage from './pages/messages/MessagesPage';
import ConversationPage from './pages/messages/ConversationPage';
import LeaderboardPage from './pages/leaderboard/LeaderboardPage';
import ProfilePage from './pages/profile/ProfilePage';
import SettingsPage from './pages/settings/SettingsPage';
import BookmarksPage from './pages/bookmarks/BookmarksPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes (Explore & Discover) */}
      <Route path="/" element={<AppLayout><LandingPage /></AppLayout>} />
      <Route path="/explore" element={<AppLayout><ExplorePage /></AppLayout>} />
      <Route path="/projects/:slug" element={<AppLayout><ProjectDetailPage /></AppLayout>} />
      <Route path="/communities" element={<AppLayout><CommunitiesPage /></AppLayout>} />
      <Route path="/communities/:slug" element={<AppLayout><CommunityDetailPage /></AppLayout>} />
      <Route path="/discussions/:id" element={<AppLayout><DiscussionDetailPage /></AppLayout>} />
      <Route path="/codex" element={<AppLayout><CodexPage /></AppLayout>} />
      <Route path="/codex/:slug" element={<AppLayout><CodexDetailPage /></AppLayout>} />
      <Route path="/hackathons" element={<AppLayout><HackathonsPage /></AppLayout>} />
      <Route path="/hackathons/:slug" element={<AppLayout><HackathonDetailPage /></AppLayout>} />
      <Route path="/leaderboard" element={<AppLayout><LeaderboardPage /></AppLayout>} />
      <Route path="/profile/:username" element={<AppLayout><ProfilePage /></AppLayout>} />
      <Route path="/portfolio/:username" element={<AppLayout><PublicPortfolioPage /></AppLayout>} />

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes (Creation, Matchmaking & Personal Management) */}
      <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
      <Route path="/projects/new" element={<ProtectedRoute><AppLayout><CreateProjectPage /></AppLayout></ProtectedRoute>} />
      <Route path="/projects/:slug/edit" element={<ProtectedRoute><AppLayout><EditProjectPage /></AppLayout></ProtectedRoute>} />
      <Route path="/communities/new" element={<ProtectedRoute><AppLayout><CreateCommunityPage /></AppLayout></ProtectedRoute>} />
      <Route path="/codex/new" element={<ProtectedRoute><AppLayout><CreateCodexPage /></AppLayout></ProtectedRoute>} />
      <Route path="/codex/:slug/edit" element={<ProtectedRoute><AppLayout><EditCodexPage /></AppLayout></ProtectedRoute>} />
      <Route path="/portfolio" element={<ProtectedRoute><AppLayout><PortfolioPage /></AppLayout></ProtectedRoute>} />
      <Route path="/hackathons/new" element={<ProtectedRoute><AppLayout><CreateHackathonPage /></AppLayout></ProtectedRoute>} />
      <Route path="/squads" element={<ProtectedRoute><AppLayout><SquadsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><AppLayout><MessagesPage /></AppLayout></ProtectedRoute>} />
      <Route path="/messages/:id" element={<ProtectedRoute><AppLayout><ConversationPage /></AppLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/bookmarks" element={<ProtectedRoute><AppLayout><BookmarksPage /></AppLayout></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={<AppLayout><NotFoundPage /></AppLayout>} />
    </Routes>
  );
}
