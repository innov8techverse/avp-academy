import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import DashboardOverview from "@/containers/admin/DashboardOverviewNew";
import StudentManagement from "@/containers/admin/StudentManagement";
import ContentManagement from "@/containers/admin/ContentManagement";
import TestManagement from "@/containers/admin/TestManagement";
import Analytics from "@/containers/admin/Analytics";
import CourseManagement from "@/containers/admin/CourseManagement";
import QuestionBank from "@/containers/admin/QuestionBank";
import QuestionPapers from "@/containers/admin/QuestionPapers";
import QPCodeManagement from "@/containers/admin/QPCodeManagement";
import NotificationCenter from "@/containers/admin/NotificationCenter";
import StaffManagement from "@/containers/admin/StaffManagement";
import AdminSettings from "@/containers/admin/AdminSettings";
import TestReports from "@/containers/admin/TestReports";
import ProfileSection from "@/components/common/ProfileSection";
import AdminProfile from "@/components/common/AdminProfile";
import StudentLayout from "./pages/student/StudentLayout";
import TestInterface from "./pages/student/TestInterface";
import TestAnalysis from "./pages/student/TestAnalysis";
import SubjectManagement from '@/containers/admin/SubjectManagement';
import BatchManagement from '@/containers/admin/BatchManagement';
import ContentViewer from "./pages/admin/ContentViewer";
import TestDetails from "./pages/admin/TestDetails";
import StudentTestDetails from "./pages/student/StudentTestDetails";
import VideoPlayer from "./containers/video/VideoPlayer";
import LeaderboardManagement from "./containers/admin/LeaderboardManagement";
import Sessions from "./pages/admin/Sessions";
import HealthStats from "./pages/developer/HealthStats";
import { SessionProvider } from "@/contexts/SessionContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/forgot-password" element={<Index />} />
            <Route path="/verify-otp" element={<Index />} />
            <Route path="/reset-password" element={<Index />} />
            <Route path="/admin" element={<AdminDashboard />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardOverview />} />
              <Route path="students" element={<StudentManagement />} />
              <Route path="staff" element={<StaffManagement />} />
              <Route path="courses" element={<CourseManagement />} />
              <Route path="subjects" element={<SubjectManagement />} />
              <Route path="batches" element={<BatchManagement />} />
              <Route path="content" element={<ContentManagement />} />
              <Route path="content-viewer/:id" element={<ContentViewer />} />
              <Route path="tests" element={<TestManagement />} />
              <Route path="tests/:testId" element={<TestDetails />} />
              <Route path="questions" element={<QuestionBank />} />
               <Route path="qp-codes" element={<QPCodeManagement />} />
            <Route path="questions" element={<QuestionBank />} />
            <Route path="question-papers" element={<QuestionPapers />} />
            <Route path="reports" element={<TestReports />} />
            <Route path="leaderboard" element={<LeaderboardManagement />} />
              <Route path="sessions" element={<Sessions />} />
              <Route path="notifications" element={<NotificationCenter />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="video-viewer/:id" element={<VideoPlayer />} />
            </Route>
            <Route path="/dev/health" element={<HealthStats />} />
            <Route path="/student" element={<Index />} />
            <Route path="/student/home" element={<StudentLayout activeTab="home" />} />
            <Route path="/student/practice" element={<StudentLayout activeTab="practice" />} />
            <Route path="/student/tests" element={<StudentLayout activeTab="tests" />} />
            <Route path="/student/test/:testId" element={<TestInterface />} />
            <Route path="/student/test-analysis/:attemptId" element={<TestAnalysis />} />
            <Route path="/student/test-details/:testId" element={<StudentTestDetails />} />
            <Route path="/student/hub" element={<StudentLayout activeTab="hub" />} />
            <Route path="/student/profile" element={<StudentLayout activeTab="profile" />} />
            <Route path="/student/settings" element={<StudentLayout activeTab="settings" />} />
            <Route path="/student/video-viewer/:id" element={<VideoPlayer />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;