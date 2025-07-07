from fastapi import APIRouter, HTTPException, File, UploadFile, Depends, Form
from fastapi.responses import FileResponse
from typing import List, Optional
from services.pdf_service import PDFService
from models.pdf_models import (
    PDFDocument, PDFUploadResponse, Annotation, AnnotationCreate, 
    AnnotationResponse, Signature, SignatureCreate, Project, 
    ProjectCreate, ProjectUpdate, ProjectResponse
)
import os
import base64
import json

router = APIRouter()

def get_pdf_service() -> PDFService:
    from server import db
    return PDFService(db)

@router.post("/upload", response_model=PDFUploadResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    user_id: Optional[str] = Form(None),
    pdf_service: PDFService = Depends(get_pdf_service)
):
    """Upload PDF file"""
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    # Read file content
    file_content = await file.read()
    
    # Check file size (100MB limit)
    if len(file_content) > 100 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 100MB limit")
    
    try:
        pdf_doc = await pdf_service.upload_pdf(file_content, file.filename, user_id)
        return PDFUploadResponse(
            id=pdf_doc.id,
            filename=pdf_doc.filename,
            original_filename=pdf_doc.original_filename,
            file_size=pdf_doc.file_size,
            total_pages=pdf_doc.total_pages,
            message="PDF uploaded successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading PDF: {str(e)}")

@router.get("/document/{pdf_id}", response_model=PDFDocument)
async def get_pdf_document(
    pdf_id: str,
    pdf_service: PDFService = Depends(get_pdf_service)
):
    """Get PDF document information"""
    pdf_doc = await pdf_service.get_pdf_document(pdf_id)
    if not pdf_doc:
        raise HTTPException(status_code=404, detail="PDF document not found")
    return pdf_doc

@router.get("/file/{pdf_id}")
async def get_pdf_file(
    pdf_id: str,
    pdf_service: PDFService = Depends(get_pdf_service)
):
    """Get PDF file for viewing"""
    file_path = await pdf_service.get_pdf_file_path(pdf_id)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="PDF file not found")
    
    return FileResponse(file_path, media_type="application/pdf")

@router.delete("/document/{pdf_id}")
async def delete_pdf_document(
    pdf_id: str,
    pdf_service: PDFService = Depends(get_pdf_service)
):
    """Delete PDF document"""
    success = await pdf_service.delete_pdf_document(pdf_id)
    if not success:
        raise HTTPException(status_code=404, detail="PDF document not found")
    return {"message": "PDF document deleted successfully"}

# Annotation routes
@router.post("/annotations", response_model=Annotation)
async def create_annotation(
    annotation: AnnotationCreate,
    pdf_service: PDFService = Depends(get_pdf_service)
):
    """Create new annotation"""
    try:
        new_annotation = await pdf_service.create_annotation(annotation)
        return new_annotation
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating annotation: {str(e)}")

@router.get("/annotations/{pdf_id}", response_model=AnnotationResponse)
async def get_annotations(
    pdf_id: str,
    pdf_service: PDFService = Depends(get_pdf_service)
):
    """Get all annotations for a PDF"""
    annotations = await pdf_service.get_annotations_by_pdf(pdf_id)
    return AnnotationResponse(annotations=annotations, count=len(annotations))

@router.put("/annotations/{annotation_id}", response_model=Annotation)
async def update_annotation(
    annotation_id: str,
    updates: dict,
    pdf_service: PDFService = Depends(get_pdf_service)
):
    """Update annotation"""
    annotation = await pdf_service.update_annotation(annotation_id, updates)
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
    return annotation

@router.delete("/annotations/{annotation_id}")
async def delete_annotation(
    annotation_id: str,
    pdf_service: PDFService = Depends(get_pdf_service)
):
    """Delete annotation"""
    success = await pdf_service.delete_annotation(annotation_id)
    if not success:
        raise HTTPException(status_code=404, detail="Annotation not found")
    return {"message": "Annotation deleted successfully"}

# Signature routes
@router.post("/signatures", response_model=Signature)
async def create_signature(
    name: str = Form(...),
    image_data: str = Form(...),
    file_type: str = Form(...),
    user_id: Optional[str] = Form(None),
    pdf_service: PDFService = Depends(get_pdf_service)
):
    """Create new signature"""
    try:
        signature_data = SignatureCreate(
            name=name,
            image_data=image_data,
            file_type=file_type,
            user_id=user_id
        )
        new_signature = await pdf_service.create_signature(signature_data)
        return new_signature
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating signature: {str(e)}")

@router.get("/signatures", response_model=List[Signature])
async def get_signatures(
    user_id: Optional[str] = None,
    pdf_service: PDFService = Depends(get_pdf_service)
):
    """Get all signatures"""
    signatures = await pdf_service.get_signatures(user_id)
    return signatures

@router.delete("/signatures/{signature_id}")
async def delete_signature(
    signature_id: str,
    pdf_service: PDFService = Depends(get_pdf_service)
):
    """Delete signature"""
    success = await pdf_service.delete_signature(signature_id)
    if not success:
        raise HTTPException(status_code=404, detail="Signature not found")
    return {"message": "Signature deleted successfully"}

# Project routes
@router.post("/projects", response_model=Project)
async def create_project(
    project: ProjectCreate,
    pdf_service: PDFService = Depends(get_pdf_service)
):
    """Create new project"""
    try:
        new_project = await pdf_service.create_project(project)
        return new_project
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating project: {str(e)}")

@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    pdf_service: PDFService = Depends(get_pdf_service)
):
    """Get project with PDF and annotations"""
    project = await pdf_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    pdf_document = await pdf_service.get_pdf_document(project.pdf_id)
    if not pdf_document:
        raise HTTPException(status_code=404, detail="PDF document not found")
    
    annotations = await pdf_service.get_annotations_by_pdf(project.pdf_id)
    
    return ProjectResponse(
        project=project,
        pdf_document=pdf_document,
        annotations=annotations
    )

@router.put("/projects/{project_id}", response_model=Project)
async def update_project(
    project_id: str,
    updates: ProjectUpdate,
    pdf_service: PDFService = Depends(get_pdf_service)
):
    """Update project"""
    project = await pdf_service.update_project(project_id, updates)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.get("/projects", response_model=List[Project])
async def get_projects(
    user_id: Optional[str] = None,
    pdf_service: PDFService = Depends(get_pdf_service)
):
    """Get all projects"""
    projects = await pdf_service.get_projects(user_id)
    return projects

@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: str,
    pdf_service: PDFService = Depends(get_pdf_service)
):
    """Delete project"""
    success = await pdf_service.delete_project(project_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}