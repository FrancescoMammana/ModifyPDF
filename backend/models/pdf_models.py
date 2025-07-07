from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

class PDFDocument(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    original_filename: str
    file_size: int
    file_path: str
    upload_date: datetime = Field(default_factory=datetime.utcnow)
    total_pages: int
    current_page: int = 1
    user_id: Optional[str] = None

class PDFDocumentCreate(BaseModel):
    filename: str
    original_filename: str
    file_size: int
    file_path: str
    total_pages: int
    user_id: Optional[str] = None

class Signature(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    image_data: str  # base64 encoded image
    file_type: str
    date_added: datetime = Field(default_factory=datetime.utcnow)
    user_id: Optional[str] = None

class SignatureCreate(BaseModel):
    name: str
    image_data: str
    file_type: str
    user_id: Optional[str] = None

class Annotation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    pdf_id: str
    type: str  # text, rectangle, circle, arrow, highlight, signature, image
    x: float
    y: float
    width: Optional[float] = None
    height: Optional[float] = None
    text: Optional[str] = None
    font_size: Optional[int] = None
    color: Optional[str] = None
    image_data: Optional[str] = None
    page: int
    layer: int = 0
    created_date: datetime = Field(default_factory=datetime.utcnow)
    user_id: Optional[str] = None

class AnnotationCreate(BaseModel):
    pdf_id: str
    type: str
    x: float
    y: float
    width: Optional[float] = None
    height: Optional[float] = None
    text: Optional[str] = None
    font_size: Optional[int] = None
    color: Optional[str] = None
    image_data: Optional[str] = None
    page: int
    layer: int = 0
    user_id: Optional[str] = None

class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    pdf_id: str
    annotations: List[str] = []  # List of annotation IDs
    current_page: int = 1
    zoom_level: float = 1.0
    created_date: datetime = Field(default_factory=datetime.utcnow)
    last_modified: datetime = Field(default_factory=datetime.utcnow)
    user_id: Optional[str] = None

class ProjectCreate(BaseModel):
    name: str
    pdf_id: str
    current_page: int = 1
    zoom_level: float = 1.0
    user_id: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    current_page: Optional[int] = None
    zoom_level: Optional[float] = None
    last_modified: datetime = Field(default_factory=datetime.utcnow)

# Response models
class PDFUploadResponse(BaseModel):
    id: str
    filename: str
    original_filename: str
    file_size: int
    total_pages: int
    message: str

class AnnotationResponse(BaseModel):
    annotations: List[Annotation]
    count: int

class ProjectResponse(BaseModel):
    project: Project
    pdf_document: PDFDocument
    annotations: List[Annotation]