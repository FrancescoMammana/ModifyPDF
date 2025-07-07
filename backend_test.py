#!/usr/bin/env python3
import requests
import os
import base64
import json
import time
import unittest
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

# Get backend URL from frontend .env file
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BACKEND_URL = line.strip().split('=')[1].strip('"\'')
            break

API_URL = f"{BACKEND_URL}/api"
PDF_API_URL = f"{API_URL}/pdf"

class PDFEditorBackendTest(unittest.TestCase):
    """Test suite for PDF Editor Backend API"""
    
    @classmethod
    def setUpClass(cls):
        """Create test resources that will be used across tests"""
        cls.test_pdf_path = cls.create_test_pdf()
        cls.test_signature_image = cls.create_test_signature()
        cls.uploaded_pdf_id = None
        cls.annotation_id = None
        cls.signature_id = None
        cls.project_id = None
        
    @classmethod
    def tearDownClass(cls):
        """Clean up test resources"""
        if os.path.exists(cls.test_pdf_path):
            os.remove(cls.test_pdf_path)
    
    @classmethod
    def create_test_pdf(cls):
        """Create a test PDF file"""
        pdf_path = "/tmp/test_document.pdf"
        c = canvas.Canvas(pdf_path, pagesize=letter)
        c.drawString(100, 750, "Test PDF Document")
        c.drawString(100, 700, "Page 1")
        c.showPage()
        c.drawString(100, 750, "Test PDF Document")
        c.drawString(100, 700, "Page 2")
        c.showPage()
        c.save()
        return pdf_path
    
    @classmethod
    def create_test_signature(cls):
        """Create a test signature image in base64"""
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=(200, 100))
        c.drawString(50, 50, "Test Signature")
        c.save()
        buffer.seek(0)
        return base64.b64encode(buffer.read()).decode('utf-8')
    
    def test_01_pdf_upload(self):
        """Test PDF upload functionality"""
        print("\n=== Testing PDF Upload ===")
        
        with open(self.test_pdf_path, 'rb') as f:
            files = {'file': ('test_document.pdf', f, 'application/pdf')}
            data = {'user_id': 'test_user_123'}
            
            response = requests.post(f"{PDF_API_URL}/upload", files=files, data=data)
            
            self.assertEqual(response.status_code, 200, f"PDF upload failed: {response.text}")
            result = response.json()
            
            # Save PDF ID for later tests
            self.__class__.uploaded_pdf_id = result['id']
            
            print(f"PDF uploaded successfully with ID: {self.__class__.uploaded_pdf_id}")
            self.assertIn('id', result)
            self.assertIn('filename', result)
            self.assertIn('original_filename', result)
            self.assertIn('file_size', result)
            self.assertIn('total_pages', result)
            self.assertEqual(result['total_pages'], 2)
            self.assertEqual(result['original_filename'], 'test_document.pdf')
    
    def test_02_get_pdf_document(self):
        """Test getting PDF document info"""
        print("\n=== Testing Get PDF Document ===")
        
        if not self.__class__.uploaded_pdf_id:
            self.skipTest("PDF upload test failed, skipping this test")
        
        response = requests.get(f"{PDF_API_URL}/document/{self.__class__.uploaded_pdf_id}")
        
        self.assertEqual(response.status_code, 200, f"Get PDF document failed: {response.text}")
        result = response.json()
        
        print(f"Retrieved PDF document: {result['original_filename']}")
        self.assertEqual(result['id'], self.__class__.uploaded_pdf_id)
        self.assertEqual(result['total_pages'], 2)
    
    def test_03_get_pdf_file(self):
        """Test getting PDF file for viewing"""
        print("\n=== Testing Get PDF File ===")
        
        if not self.__class__.uploaded_pdf_id:
            self.skipTest("PDF upload test failed, skipping this test")
        
        response = requests.get(f"{PDF_API_URL}/file/{self.__class__.uploaded_pdf_id}")
        
        self.assertEqual(response.status_code, 200, f"Get PDF file failed: {response.status_code}")
        self.assertEqual(response.headers['Content-Type'], 'application/pdf')
        
        # Check if we got actual PDF content
        self.assertTrue(response.content.startswith(b'%PDF-'), "Response is not a valid PDF")
        print(f"Retrieved PDF file successfully, size: {len(response.content)} bytes")
    
    def test_04_create_annotation(self):
        """Test creating an annotation"""
        print("\n=== Testing Create Annotation ===")
        
        if not self.__class__.uploaded_pdf_id:
            self.skipTest("PDF upload test failed, skipping this test")
        
        # Test different annotation types
        annotation_types = [
            # Text annotation
            {
                "pdf_id": self.__class__.uploaded_pdf_id,
                "type": "text",
                "x": 100,
                "y": 200,
                "width": 200,
                "height": 50,
                "text": "This is a test annotation",
                "font_size": 12,
                "color": "#000000",
                "page": 1,
                "layer": 1,
                "user_id": "test_user_123"
            },
            # Rectangle annotation
            {
                "pdf_id": self.__class__.uploaded_pdf_id,
                "type": "rectangle",
                "x": 150,
                "y": 300,
                "width": 100,
                "height": 80,
                "color": "#FF0000",
                "page": 1,
                "layer": 1,
                "user_id": "test_user_123"
            },
            # Circle annotation
            {
                "pdf_id": self.__class__.uploaded_pdf_id,
                "type": "circle",
                "x": 300,
                "y": 400,
                "width": 75,
                "height": 75,
                "color": "#0000FF",
                "page": 1,
                "layer": 1,
                "user_id": "test_user_123"
            },
            # Highlight annotation
            {
                "pdf_id": self.__class__.uploaded_pdf_id,
                "type": "highlight",
                "x": 100,
                "y": 500,
                "width": 300,
                "height": 20,
                "color": "#FFFF00",
                "page": 1,
                "layer": 1,
                "user_id": "test_user_123"
            }
        ]
        
        for annotation_data in annotation_types:
            response = requests.post(f"{PDF_API_URL}/annotations", json=annotation_data)
            
            self.assertEqual(response.status_code, 200, f"Create annotation failed: {response.text}")
            result = response.json()
            
            # Save the first annotation ID for later tests
            if annotation_data["type"] == "text" and not self.__class__.annotation_id:
                self.__class__.annotation_id = result['id']
            
            print(f"Created {annotation_data['type']} annotation with ID: {result['id']}")
            self.assertIn('id', result)
            self.assertEqual(result['pdf_id'], self.__class__.uploaded_pdf_id)
            self.assertEqual(result['type'], annotation_data['type'])
    
    def test_05_get_annotations(self):
        """Test getting annotations for a PDF"""
        print("\n=== Testing Get Annotations ===")
        
        if not self.__class__.uploaded_pdf_id:
            self.skipTest("PDF upload test failed, skipping this test")
        
        response = requests.get(f"{PDF_API_URL}/annotations/{self.__class__.uploaded_pdf_id}")
        
        self.assertEqual(response.status_code, 200, f"Get annotations failed: {response.text}")
        result = response.json()
        
        print(f"Retrieved {result['count']} annotations")
        self.assertIn('annotations', result)
        self.assertIn('count', result)
        self.assertEqual(result['count'], 4)  # We created 4 annotations in the previous test
    
    def test_06_update_annotation(self):
        """Test updating an annotation"""
        print("\n=== Testing Update Annotation ===")
        
        if not self.__class__.annotation_id:
            self.skipTest("Create annotation test failed, skipping this test")
        
        update_data = {
            "text": "Updated annotation text",
            "color": "#00FF00"
        }
        
        response = requests.put(f"{PDF_API_URL}/annotations/{self.__class__.annotation_id}", json=update_data)
        
        self.assertEqual(response.status_code, 200, f"Update annotation failed: {response.text}")
        result = response.json()
        
        print(f"Updated annotation: {result['id']}")
        self.assertEqual(result['id'], self.__class__.annotation_id)
        self.assertEqual(result['text'], update_data['text'])
        self.assertEqual(result['color'], update_data['color'])
    
    def test_07_create_signature(self):
        """Test creating a signature"""
        print("\n=== Testing Create Signature ===")
        
        # Test with different image formats
        signature_data = {
            'name': 'Test Signature',
            'image_data': self.test_signature_image,
            'file_type': 'png',
            'user_id': 'test_user_123'
        }
        
        response = requests.post(
            f"{PDF_API_URL}/signatures", 
            data=signature_data
        )
        
        self.assertEqual(response.status_code, 200, f"Create signature failed: {response.text}")
        result = response.json()
        
        # Save signature ID for later tests
        self.__class__.signature_id = result['id']
        
        print(f"Created signature with ID: {self.__class__.signature_id}")
        self.assertIn('id', result)
        self.assertEqual(result['name'], signature_data['name'])
        self.assertEqual(result['file_type'], signature_data['file_type'])
    
    def test_08_get_signatures(self):
        """Test getting all signatures"""
        print("\n=== Testing Get Signatures ===")
        
        response = requests.get(f"{PDF_API_URL}/signatures")
        
        self.assertEqual(response.status_code, 200, f"Get signatures failed: {response.text}")
        result = response.json()
        
        print(f"Retrieved {len(result)} signatures")
        self.assertIsInstance(result, list)
        self.assertGreaterEqual(len(result), 1)
        
        # Test with user_id filter
        response = requests.get(f"{PDF_API_URL}/signatures?user_id=test_user_123")
        
        self.assertEqual(response.status_code, 200, f"Get signatures with user_id failed: {response.text}")
        result = response.json()
        
        print(f"Retrieved {len(result)} signatures for user_id=test_user_123")
        self.assertIsInstance(result, list)
        self.assertGreaterEqual(len(result), 1)
    
    def test_09_create_project(self):
        """Test creating a project"""
        print("\n=== Testing Create Project ===")
        
        if not self.__class__.uploaded_pdf_id:
            self.skipTest("PDF upload test failed, skipping this test")
        
        project_data = {
            "name": "Test Project",
            "pdf_id": self.__class__.uploaded_pdf_id,
            "current_page": 1,
            "zoom_level": 1.2,
            "user_id": "test_user_123"
        }
        
        response = requests.post(f"{PDF_API_URL}/projects", json=project_data)
        
        self.assertEqual(response.status_code, 200, f"Create project failed: {response.text}")
        result = response.json()
        
        # Save project ID for later tests
        self.__class__.project_id = result['id']
        
        print(f"Created project with ID: {self.__class__.project_id}")
        self.assertIn('id', result)
        self.assertEqual(result['name'], project_data['name'])
        self.assertEqual(result['pdf_id'], self.__class__.uploaded_pdf_id)
        self.assertEqual(result['zoom_level'], project_data['zoom_level'])
    
    def test_10_get_project(self):
        """Test getting a project with PDF and annotations"""
        print("\n=== Testing Get Project ===")
        
        if not self.__class__.project_id:
            self.skipTest("Create project test failed, skipping this test")
        
        response = requests.get(f"{PDF_API_URL}/projects/{self.__class__.project_id}")
        
        self.assertEqual(response.status_code, 200, f"Get project failed: {response.text}")
        result = response.json()
        
        print(f"Retrieved project: {result['project']['name']}")
        self.assertIn('project', result)
        self.assertIn('pdf_document', result)
        self.assertIn('annotations', result)
        self.assertEqual(result['project']['id'], self.__class__.project_id)
        self.assertEqual(result['pdf_document']['id'], self.__class__.uploaded_pdf_id)
    
    def test_11_update_project(self):
        """Test updating a project"""
        print("\n=== Testing Update Project ===")
        
        if not self.__class__.project_id:
            self.skipTest("Create project test failed, skipping this test")
        
        update_data = {
            "name": "Updated Project Name",
            "current_page": 2,
            "zoom_level": 1.5
        }
        
        response = requests.put(f"{PDF_API_URL}/projects/{self.__class__.project_id}", json=update_data)
        
        self.assertEqual(response.status_code, 200, f"Update project failed: {response.text}")
        result = response.json()
        
        print(f"Updated project: {result['name']}")
        self.assertEqual(result['id'], self.__class__.project_id)
        self.assertEqual(result['name'], update_data['name'])
        self.assertEqual(result['current_page'], update_data['current_page'])
        self.assertEqual(result['zoom_level'], update_data['zoom_level'])
    
    def test_12_get_projects(self):
        """Test getting all projects"""
        print("\n=== Testing Get Projects ===")
        
        response = requests.get(f"{PDF_API_URL}/projects")
        
        self.assertEqual(response.status_code, 200, f"Get projects failed: {response.text}")
        result = response.json()
        
        print(f"Retrieved {len(result)} projects")
        self.assertIsInstance(result, list)
        self.assertGreaterEqual(len(result), 1)
        
        # Test with user_id filter
        response = requests.get(f"{PDF_API_URL}/projects?user_id=test_user_123")
        
        self.assertEqual(response.status_code, 200, f"Get projects with user_id failed: {response.text}")
        result = response.json()
        
        print(f"Retrieved {len(result)} projects for user_id=test_user_123")
        self.assertIsInstance(result, list)
        self.assertGreaterEqual(len(result), 1)
    
    def test_13_error_handling(self):
        """Test error handling for invalid requests"""
        print("\n=== Testing Error Handling ===")
        
        # Test invalid PDF ID
        response = requests.get(f"{PDF_API_URL}/document/invalid_id")
        self.assertEqual(response.status_code, 404, "Expected 404 for invalid PDF ID")
        print("Correctly received 404 for invalid PDF ID")
        
        # Test invalid annotation ID
        response = requests.put(f"{PDF_API_URL}/annotations/invalid_id", json={"text": "test"})
        self.assertEqual(response.status_code, 404, "Expected 404 for invalid annotation ID")
        print("Correctly received 404 for invalid annotation ID")
        
        # Test invalid project ID
        response = requests.get(f"{PDF_API_URL}/projects/invalid_id")
        self.assertEqual(response.status_code, 404, "Expected 404 for invalid project ID")
        print("Correctly received 404 for invalid project ID")
    
    def test_14_delete_annotation(self):
        """Test deleting an annotation"""
        print("\n=== Testing Delete Annotation ===")
        
        if not self.__class__.annotation_id:
            self.skipTest("Create annotation test failed, skipping this test")
        
        response = requests.delete(f"{PDF_API_URL}/annotations/{self.__class__.annotation_id}")
        
        self.assertEqual(response.status_code, 200, f"Delete annotation failed: {response.text}")
        result = response.json()
        
        print(f"Deleted annotation: {self.__class__.annotation_id}")
        self.assertIn('message', result)
        self.assertIn('deleted successfully', result['message'])
    
    def test_15_delete_signature(self):
        """Test deleting a signature"""
        print("\n=== Testing Delete Signature ===")
        
        if not self.__class__.signature_id:
            self.skipTest("Create signature test failed, skipping this test")
        
        response = requests.delete(f"{PDF_API_URL}/signatures/{self.__class__.signature_id}")
        
        self.assertEqual(response.status_code, 200, f"Delete signature failed: {response.text}")
        result = response.json()
        
        print(f"Deleted signature: {self.__class__.signature_id}")
        self.assertIn('message', result)
        self.assertIn('deleted successfully', result['message'])
    
    def test_16_delete_project(self):
        """Test deleting a project"""
        print("\n=== Testing Delete Project ===")
        
        if not self.__class__.project_id:
            self.skipTest("Create project test failed, skipping this test")
        
        response = requests.delete(f"{PDF_API_URL}/projects/{self.__class__.project_id}")
        
        self.assertEqual(response.status_code, 200, f"Delete project failed: {response.text}")
        result = response.json()
        
        print(f"Deleted project: {self.__class__.project_id}")
        self.assertIn('message', result)
        self.assertIn('deleted successfully', result['message'])
    
    def test_17_delete_pdf_document(self):
        """Test deleting a PDF document"""
        print("\n=== Testing Delete PDF Document ===")
        
        if not self.__class__.uploaded_pdf_id:
            self.skipTest("PDF upload test failed, skipping this test")
        
        response = requests.delete(f"{PDF_API_URL}/document/{self.__class__.uploaded_pdf_id}")
        
        self.assertEqual(response.status_code, 200, f"Delete PDF document failed: {response.text}")
        result = response.json()
        
        print(f"Deleted PDF document: {self.__class__.uploaded_pdf_id}")
        self.assertIn('message', result)
        self.assertIn('deleted successfully', result['message'])

if __name__ == "__main__":
    # Run tests in order
    unittest.main(verbosity=2)