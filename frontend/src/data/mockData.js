// Mock data for PDF Editor development
export const mockPDFData = "data:application/pdf;base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVGl0bGUgKE1vY2sgUERGIERvY3VtZW50KQovQ3JlYXRvciAoUERGIEVkaXRvciBNb2NrKQovUHJvZHVjZXIgKE1vY2sgUERGIEdlbmVyYXRvcikKL0NyZWF0aW9uRGF0ZSAoRDoyMDI1MDEyMTAwMDAwMCkKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDMgMCBSCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbNCAwIFIgNSAwIFIgNiAwIFJdCi9Db3VudCAzCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMyAwIFIKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNyAwIFIKPj4KPj4KL0NvbnRlbnRzIDggMCBSCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMyAwIFIKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNyAwIFIKPj4KPj4KL0NvbnRlbnRzIDkgMCBSCj4+CmVuZG9iago2IDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMyAwIFIKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNyAwIFIKPj4KPj4KL0NvbnRlbnRzIDEwIDAgUgo+PgplbmRvYmoKNyAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEKL0Jhc2VGb250IC9IZWx2ZXRpY2EKPj4KZW5kb2JqCjggMCBvYmoKPDwKL0xlbmd0aCA1NDQKL0ZpbHRlciAvRmxhdGVEZWNvZGUKPj4Kc3RyZWFtCngBjVRLj9s2EL3nV8x2tJlIlEjr3wBOJe2h3QN/wJQGPmChpMFgShKmA2Q+SuQdJhGgvBM=";

export const mockSignatures = [
  {
    id: 1,
    name: "John Doe Signature",
    imageData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    dateAdded: "2025-01-21T10:00:00Z"
  },
  {
    id: 2,
    name: "Jane Smith Signature",
    imageData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    dateAdded: "2025-01-21T11:00:00Z"
  }
];

export const mockAnnotations = [
  {
    id: 1,
    type: "text",
    x: 100,
    y: 200,
    text: "Sample text annotation",
    fontSize: 14,
    color: "#000000",
    page: 1,
    layer: 0
  },
  {
    id: 2,
    type: "rectangle",
    x: 150,
    y: 250,
    width: 200,
    height: 100,
    color: "#ff0000",
    page: 1,
    layer: 1
  },
  {
    id: 3,
    type: "highlight",
    x: 80,
    y: 300,
    width: 250,
    height: 20,
    color: "rgba(255, 255, 0, 0.3)",
    page: 1,
    layer: 2
  }
];

export const mockLayers = [
  {
    id: 0,
    name: "Text Layer",
    visible: true,
    annotations: [1]
  },
  {
    id: 1,
    name: "Shapes Layer",
    visible: true,
    annotations: [2]
  },
  {
    id: 2,
    name: "Highlights Layer",
    visible: true,
    annotations: [3]
  }
];

export const mockProject = {
  id: "project-1",
  name: "Sample Contract",
  lastModified: "2025-01-21T12:00:00Z",
  annotations: mockAnnotations,
  layers: mockLayers,
  currentPage: 1,
  totalPages: 3
};