from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Image
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from io import BytesIO
import markdown
from datetime import datetime
import os

def add_logo_header(canvas, doc):
    """Add CiphersLab logo to every page"""
    canvas.saveState()
    
    # Add logo if file exists
    logo_path = os.path.join(os.path.dirname(__file__), 'cipherslab-logo.png')
    if os.path.exists(logo_path):
        # Logo in top-left corner
        canvas.drawImage(logo_path, 0.5*inch, doc.height + 1.5*inch, 
                        width=0.4*inch, height=0.4*inch, 
                        preserveAspectRatio=True, mask='auto')
        
        # Company name next to logo
        canvas.setFont('Helvetica-Bold', 10)
        canvas.setFillColor(colors.HexColor('#111827'))
        canvas.drawString(1*inch, doc.height + 1.6*inch, 'CiphersLab')
    
    # Page number at bottom
    canvas.setFont('Helvetica', 9)
    canvas.setFillColor(colors.HexColor('#6b7280'))
    page_num = canvas.getPageNumber()
    text = f"Page {page_num}"
    canvas.drawRightString(doc.width + 1*inch, 0.5*inch, text)
    
    canvas.restoreState()

def generate_pdf_report(session_data: dict) -> bytes:
    """
    Generates a professional PDF report from session data.
    Returns PDF as bytes.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )
    
    # Container for PDF elements
    elements = []
    
    # Styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1e3a8a'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=18,
        textColor=colors.HexColor('#3b82f6'),
        spaceAfter=12,
        spaceBefore=12
    )
    
    subheading_style = ParagraphStyle(
        'CustomSubHeading',
        parent=styles['Heading3'],
        fontSize=14,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=8,
        spaceBefore=8
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontSize=11,
        alignment=TA_JUSTIFY,
        spaceAfter=12
    )
    
    # Title Page
    elements.append(Spacer(1, 1*inch))
    elements.append(Paragraph("AI Agent Strategic Report", title_style))
    elements.append(Spacer(1, 0.3*inch))

    # Add logo to title page
    logo_path = os.path.join(os.path.dirname(__file__), 'cipherslab-logo.png')
    if os.path.exists(logo_path):
        logo = Image(logo_path, width=1.5*inch, height=1.5*inch)
        logo.hAlign = 'CENTER'
        elements.append(logo)
    

    # Company name
    company_style = ParagraphStyle(
        'Company',
        parent=styles['Normal'],
        fontSize=20,
        textColor=colors.HexColor('#111827'),
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        spaceAfter=40
    )
    elements.append(Paragraph("CiphersLab", company_style))
    
    
    # Metadata table
    metadata = [
        ['Generated:', datetime.now().strftime('%B %d, %Y')],
        ['Session ID:', session_data.get('session_id', 'N/A')[:16] + '...'],
        ['Lead Score:', str(session_data.get('lead_score', 'N/A'))],
    ]
    
    metadata_table = Table(metadata, colWidths=[2*inch, 4*inch])
    metadata_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#6b7280')),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#111827')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    
    elements.append(metadata_table)
    elements.append(Spacer(1, 0.5*inch))
    
    # Original Idea
    elements.append(Paragraph("Original Idea", heading_style))
    idea_text = session_data.get('idea', 'No idea provided')
    elements.append(Paragraph(idea_text, body_style))
    elements.append(Spacer(1, 0.3*inch))
    
    elements.append(PageBreak())
    
    # Context sections
    context = session_data.get('context', {})
    
    sections = [
        ('requirement_gathering', 'Requirements Analysis', '📋'),
        ('technical_architecture', 'Technical Architecture', '🏗️'),
        ('ux_design', 'UX Design & User Flows', '🎨'),
        ('business_strategy', 'Business Strategy', '💼'),
    ]
    
    for key, title, icon in sections:
        content = context.get(key)
        
        if content:
            # Section title
            elements.append(Paragraph(f"{icon} {title}", heading_style))
            elements.append(Spacer(1, 0.2*inch))
            
            # Convert markdown to plain text and format
            # Simple markdown parsing
            lines = content.split('\n')
            for line in lines:
                line = line.strip()
                if not line:
                    elements.append(Spacer(1, 0.1*inch))
                    continue
                
                # Handle headers
                if line.startswith('###'):
                    clean_line = line.replace('###', '').strip()
                    elements.append(Paragraph(clean_line, subheading_style))
                elif line.startswith('##'):
                    clean_line = line.replace('##', '').strip()
                    elements.append(Paragraph(clean_line, heading_style))
                elif line.startswith('#'):
                    clean_line = line.replace('#', '').strip()
                    elements.append(Paragraph(clean_line, heading_style))
                # Handle bullet points
                elif line.startswith('- ') or line.startswith('* '):
                    clean_line = '• ' + line[2:].strip()
                    elements.append(Paragraph(clean_line, body_style))
                # Handle bold
                elif '**' in line:
                    clean_line = line.replace('**', '<b>', 1).replace('**', '</b>', 1)
                    elements.append(Paragraph(clean_line, body_style))
                # Regular text
                else:
                    elements.append(Paragraph(line, body_style))
            
            elements.append(Spacer(1, 0.3*inch))
            elements.append(PageBreak())
    
    # Footer on last page
    elements.append(Spacer(1, 1*inch))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#6b7280'),
        alignment=TA_CENTER
    )
    elements.append(Paragraph("Generated by CiphersLab AI Consultant", footer_style))
    elements.append(Paragraph("© 2025 CiphersLab. All rights reserved.", footer_style))
    
    # Build PDF
    doc.build(elements)
    
    # Get PDF bytes
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    return pdf_bytes