import os
import PyPDF2
import base64
from pathlib import Path
from typing import Optional, List
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.pdf_models import PDFDocument, PDFDocumentCreate, Annotation, AnnotationCreate, Project, ProjectCreate, ProjectUpdate, Signature, SignatureCreate
from datetime import datetime
import uuid

class PDFService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.upload_dir = Path("/app/backend/uploads")
        self.upload_dir.mkdir(exist_ok=True)

    async def upload_pdf(self, file_content: bytes, original_filename: str, user_id: Optional[str] = None) -> PDFDocument:
        """Upload and store PDF file"""
        # Generate unique filename
        file_id = str(uuid.uuid4())
        filename = f"{file_id}_{original_filename}"
        file_path = self.upload_dir / filename
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        # Get PDF info
        total_pages = await self._get_pdf_page_count(file_path)
        
        # Create PDF document record
        pdf_doc = PDFDocument(
            id=file_id,
            filename=filename,
            original_filename=original_filename,
            file_size=len(file_content),
            file_path=str(file_path),
            total_pages=total_pages,
            user_id=user_id
        )
        
        # Save to database
        await self.db.pdf_documents.insert_one(pdf_doc.dict())
        
        return pdf_doc

    async def get_pdf_document(self, pdf_id: str) -> Optional[PDFDocument]:
        """Get PDF document by ID"""
        doc = await self.db.pdf_documents.find_one({"id": pdf_id})
        return PDFDocument(**doc) if doc else None

    async def get_pdf_file_path(self, pdf_id: str) -> Optional[str]:
        """Get PDF file path by ID"""
        doc = await self.get_pdf_document(pdf_id)
        return doc.file_path if doc else None

    async def delete_pdf_document(self, pdf_id: str) -> bool:
        """Delete PDF document and file"""
        doc = await self.get_pdf_document(pdf_id)
        if not doc:
            return False
        
        # Delete file
        try:
            os.remove(doc.file_path)
        except OSError:
            pass
        
        # Delete from database
        await self.db.pdf_documents.delete_one({"id": pdf_id})
        await self.db.annotations.delete_many({"pdf_id": pdf_id})
        await self.db.projects.delete_many({"pdf_id": pdf_id})
        
        return True

    async def _get_pdf_page_count(self, file_path: Path) -> int:
        """Get number of pages in PDF"""
        try:
            with open(file_path, "rb") as file:
                pdf_reader = PyPDF2.PdfReader(file)
                return len(pdf_reader.pages)
        except Exception:
            return 1  # Default to 1 page if error

    # Annotation methods
    async def create_annotation(self, annotation_data: AnnotationCreate) -> Annotation:
        """Create new annotation"""
        annotation = Annotation(**annotation_data.dict())
        await self.db.annotations.insert_one(annotation.dict())
        return annotation

    async def get_annotations_by_pdf(self, pdf_id: str) -> List[Annotation]:
        """Get all annotations for a PDF"""
        cursor = self.db.annotations.find({"pdf_id": pdf_id})
        annotations = []
        async for doc in cursor:
            annotations.append(Annotation(**doc))
        return annotations

    async def update_annotation(self, annotation_id: str, updates: dict) -> Optional[Annotation]:
        """Update annotation"""
        result = await self.db.annotations.update_one(
            {"id": annotation_id},
            {"$set": updates}
        )
        if result.modified_count > 0:
            doc = await self.db.annotations.find_one({"id": annotation_id})
            return Annotation(**doc)
        return None

    async def delete_annotation(self, annotation_id: str) -> bool:
        """Delete annotation"""
        result = await self.db.annotations.delete_one({"id": annotation_id})
        return result.deleted_count > 0

    # Signature methods
    async def create_signature(self, signature_data: SignatureCreate) -> Signature:
        """Create new signature"""
        signature = Signature(**signature_data.dict())
        await self.db.signatures.insert_one(signature.dict())
        return signature

    async def get_signatures(self, user_id: Optional[str] = None) -> List[Signature]:
        """Get all signatures for a user"""
        query = {"user_id": user_id} if user_id else {}
        cursor = self.db.signatures.find(query)
        signatures = []
        async for doc in cursor:
            signatures.append(Signature(**doc))
        return signatures

    async def delete_signature(self, signature_id: str) -> bool:
        """Delete signature"""
        result = await self.db.signatures.delete_one({"id": signature_id})
        return result.deleted_count > 0

    # Project methods
    async def create_project(self, project_data: ProjectCreate) -> Project:
        """Create new project"""
        project = Project(**project_data.dict())
        await self.db.projects.insert_one(project.dict())
        return project

    async def get_project(self, project_id: str) -> Optional[Project]:
        """Get project by ID"""
        doc = await self.db.projects.find_one({"id": project_id})
        return Project(**doc) if doc else None

    async def update_project(self, project_id: str, updates: ProjectUpdate) -> Optional[Project]:
        """Update project"""
        update_data = updates.dict(exclude_unset=True)
        update_data["last_modified"] = datetime.utcnow()
        
        result = await self.db.projects.update_one(
            {"id": project_id},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            doc = await self.db.projects.find_one({"id": project_id})
            return Project(**doc)
        return None

    async def get_projects(self, user_id: Optional[str] = None) -> List[Project]:
        """Get all projects for a user"""
        query = {"user_id": user_id} if user_id else {}
        cursor = self.db.projects.find(query)
        projects = []
        async for doc in cursor:
            projects.append(Project(**doc))
        return projects

    async def delete_project(self, project_id: str) -> bool:
        """Delete project"""
        result = await self.db.projects.delete_one({"id": project_id})
        return result.deleted_count > 0