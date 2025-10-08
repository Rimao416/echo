import { NextRequest, NextResponse } from 'next/server';
import * as pdfjsLib from 'pdfjs-dist';

// Configuration du worker pour Next.js
if (typeof window === 'undefined') {
  // Serveur : utiliser le worker legacy
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File;

    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Charger le document PDF
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdfDocument = await loadingTask.promise;

    const numPages = pdfDocument.numPages;
    let fullText = '';

    // Extraire le texte de chaque page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
    }

    // Nettoyer le texte
    const cleanedText = fullText
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return NextResponse.json({ 
      text: cleanedText,
      pages: numPages
    });

  } catch (error) {
    console.error('Error extracting PDF:', error);
    return NextResponse.json({ 
      error: 'Failed to extract PDF text',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}