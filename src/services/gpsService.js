import {
  firestoreGetGpsDashboard,
  firestoreGetGpsRoadmap,
  firestoreGenerateGpsRoadmap,
  firestoreGetGpsTasks,
  firestoreGetGpsDocuments,
  firestoreUploadGpsDocument,
  firestoreDeleteGpsDocument,
  firestoreGetGpsRecommendations,
  firestoreGetGpsDeadlines,
  firestoreGetGpsCalendar,
  firestoreGetApplications,
  firestoreGetNotifications
} from "../firebase/firestore";

// ─── GPS API Services (Firestore Integrated) ───────────────────────────────────

export const getGpsDashboard = async () => {
  const data = await firestoreGetGpsDashboard();
  return data.dashboard;
};

export const getGpsRoadmap = async () => {
  const data = await firestoreGetGpsRoadmap();
  return data.roadmap;
};

export const generateGpsRoadmap = async () => {
  const data = await firestoreGenerateGpsRoadmap();
  return data.roadmap;
};

export const getGpsTasks = async () => {
  const data = await firestoreGetGpsTasks();
  return data.tasks;
};

export const getGpsDocuments = async () => {
  const data = await firestoreGetGpsDocuments();
  return data.documents;
};

export const uploadGpsDocument = async (payload) => {
  const data = await firestoreUploadGpsDocument(payload);
  return data.document;
};

export const updateGpsDocument = async (id, payload) => {
  // Not used in UI or stubbed, but implemented for completeness
  return null;
};

export const deleteGpsDocument = async (id) => {
  return await firestoreDeleteGpsDocument(id);
};

export const getGpsSchemes = async () => {
  // Not used in UI or stubbed, but implemented for completeness
  return [];
};

export const getGpsRecommendations = async () => {
  const data = await firestoreGetGpsRecommendations();
  return data.recommendations;
};

export const getGpsDeadlines = async () => {
  const data = await firestoreGetGpsDeadlines();
  return data.deadlines;
};

export const getGpsCalendar = async () => {
  const data = await firestoreGetGpsCalendar();
  return data.events;
};

export const getGpsApplicationProgress = async () => {
  const data = await firestoreGetApplications();
  return data.applications;
};

export const getGpsNotifications = async () => {
  const data = await firestoreGetNotifications();
  return data.notifications;
};
