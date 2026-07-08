import api from "../api/axiosInstance";

// ─────────────────────────────────────────────────────────────────────────────
// Bill Service
// Placeholder implementations — ready to connect to Node.js + Express backend.
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_BILLS = [
  {
    _id: "bill_001",
    title: "Infrastructure Development Act 2024",
    billNumber: "IDA-2024",
    status: "passed",
    uploadedAt: "2024-03-15T10:00:00Z",
    summary: "Comprehensive infrastructure bill allocating $2.4B to green energy projects.",
    impactScore: 84,
    tags: ["infrastructure", "green energy", "tax"],
  },
  {
    _id: "bill_002",
    title: "Digital Privacy Protection Bill",
    billNumber: "DPP-4290",
    status: "pending",
    uploadedAt: "2024-03-10T14:30:00Z",
    summary: "Strengthens data privacy protections for citizens in digital transactions.",
    impactScore: 62,
    tags: ["privacy", "digital", "technology"],
  },
  {
    _id: "bill_003",
    title: "Carbon Tax Regulation Act",
    billNumber: "CTR-2024",
    status: "under_review",
    uploadedAt: "2024-03-01T09:15:00Z",
    summary: "Introduces carbon emission tax for industries above threshold levels.",
    impactScore: 91,
    tags: ["environment", "tax", "industry"],
  },
];

/**
 * Upload a bill document for AI analysis.
 * @param {FormData} formData - Must include `file` field
 * @returns {{ bill, analysisId }}
 *
 * Backend: POST /api/bills/upload (multipart/form-data)
 */
export const uploadBill = async (formData) => {
  // --- PLACEHOLDER ---
  await new Promise((resolve) => setTimeout(resolve, 2500));
  console.log("[billService.uploadBill] payload:", formData.get("file")?.name);
  return {
    bill: { ...MOCK_BILLS[0], _id: `bill_${Date.now()}`, uploadedAt: new Date().toISOString() },
    analysisId: `analysis_${Date.now()}`,
  };

  // --- REAL BACKEND ---
  // const { data } = await api.post("/bills/upload", formData, {
  //   headers: { "Content-Type": "multipart/form-data" },
  // });
  // return data; // { bill, analysisId }
};

/**
 * Get the user's bill list.
 * @param {{ page, limit, status, search }} params
 * @returns {{ bills, total, page, pages }}
 *
 * Backend: GET /api/bills
 */
export const getBills = async (params = {}) => {
  // --- PLACEHOLDER ---
  await new Promise((resolve) => setTimeout(resolve, 800));
  console.log("[billService.getBills] params:", params);
  return { bills: MOCK_BILLS, total: MOCK_BILLS.length, page: 1, pages: 1 };

  // --- REAL BACKEND ---
  // const { data } = await api.get("/bills", { params });
  // return data; // { bills, total, page, pages }
};

/**
 * Get a single bill with full details.
 * @param {string} billId
 * @returns {{ bill }}
 *
 * Backend: GET /api/bills/:id
 */
export const getBillById = async (billId) => {
  // --- PLACEHOLDER ---
  await new Promise((resolve) => setTimeout(resolve, 600));
  const bill = MOCK_BILLS.find((b) => b._id === billId) || MOCK_BILLS[0];
  return { bill };

  // --- REAL BACKEND ---
  // const { data } = await api.get(`/bills/${billId}`);
  // return data; // { bill }
};

/**
 * Compare two or more bills side by side.
 * @param {string[]} billIds
 * @returns {{ comparison }}
 *
 * Backend: POST /api/bills/compare
 */
export const compareBills = async (billIds) => {
  // --- PLACEHOLDER ---
  await new Promise((resolve) => setTimeout(resolve, 1500));
  console.log("[billService.compareBills] ids:", billIds);
  return {
    comparison: {
      bills: MOCK_BILLS.slice(0, 2),
      differences: ["Different tax brackets", "Different effective dates", "Scope of coverage"],
      similarities: ["Both target infrastructure", "Both require annual reporting"],
    },
  };

  // --- REAL BACKEND ---
  // const { data } = await api.post("/bills/compare", { billIds });
  // return data; // { comparison }
};

/**
 * Delete a bill from the user's history.
 * @param {string} billId
 * Backend: DELETE /api/bills/:id
 */
export const deleteBill = async (billId) => {
  // --- PLACEHOLDER ---
  await new Promise((resolve) => setTimeout(resolve, 400));
  console.log("[billService.deleteBill] id:", billId);
  return { success: true };

  // --- REAL BACKEND ---
  // const { data } = await api.delete(`/bills/${billId}`);
  // return data;
};
