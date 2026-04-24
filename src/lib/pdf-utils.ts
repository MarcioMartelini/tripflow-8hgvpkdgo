import { format } from 'date-fns'
import logoUrl from '@/assets/design-sem-nome-314e3.png'

declare global {
  interface Window {
    html2canvas: any
    jspdf: any
  }
}

async function getBase64ImageFromUrl(
  imageUrl: string,
): Promise<{ base64: string; width: number; height: number }> {
  try {
    const res = await fetch(imageUrl)
    const blob = await res.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        const img = new Image()
        img.onload = () => resolve({ base64, width: img.width, height: img.height })
        img.onerror = reject
        img.src = base64
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (e) {
    console.error('Failed to load logo', e)
    return { base64: '', width: 0, height: 0 }
  }
}

export async function generatePDF(elementId: string, filenamePrefix: string) {
  if (!window.html2canvas) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  if (!window.jspdf) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  const element = document.getElementById(elementId)
  if (!element) throw new Error('Element not found')

  const logoData = await getBase64ImageFromUrl(logoUrl)

  const style = document.createElement('style')
  style.id = 'pdf-export-style'
  style.innerHTML = `
    .pdf-export-mode { width: 1024px !important; max-width: 1024px !important; margin: 0 auto !important; padding: 20px !important; background: white !important; }
    .pdf-export-mode .print-hidden { display: none !important; }
    .pdf-export-mode .print-only { display: block !important; }
    .pdf-export-mode .overflow-x-auto, 
    .pdf-export-mode .overflow-y-auto, 
    .pdf-export-mode .overflow-hidden { overflow: visible !important; max-height: none !important; }
    .pdf-export-mode .shadow-sm, .pdf-export-mode .shadow-md { box-shadow: none !important; border: 1px solid #e2e8f0 !important; }
    .pdf-export-mode .truncate { white-space: normal !important; overflow: visible !important; text-overflow: clip !important; }
  `
  document.head.appendChild(style)
  element.classList.add('pdf-export-mode')

  const spacer = document.createElement('div')
  spacer.style.height = '60px'
  spacer.id = 'pdf-spacer'
  element.insertBefore(spacer, element.firstChild)

  const originalScrollY = window.scrollY
  window.scrollTo(0, 0)

  // Wait for layout recalculation and re-rendering of visible components
  await new Promise((resolve) => setTimeout(resolve, 800))

  const canvas = await window.html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    scrollY: 0,
    windowWidth: 1024,
  })

  window.scrollTo(0, originalScrollY)

  element.classList.remove('pdf-export-mode')
  const styleEl = document.getElementById('pdf-export-style')
  if (styleEl) styleEl.remove()

  if (spacer.parentNode) {
    spacer.parentNode.removeChild(spacer)
  }

  const imgData = canvas.toDataURL('image/jpeg', 1.0)
  const { jsPDF } = window.jspdf

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width

  let heightLeft = pdfHeight
  let position = 0

  const logoWidth = 35
  const logoHeight = logoData.height ? (logoData.height / logoData.width) * logoWidth : 15

  const addHeader = () => {
    if (logoData.base64) {
      pdf.setFillColor(255, 255, 255)
      pdf.rect(4, 4, logoWidth + 2, logoHeight + 2, 'F')
      pdf.addImage(logoData.base64, 'PNG', 5, 5, logoWidth, logoHeight)
    }
  }

  pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight)
  addHeader()
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position -= pageHeight
    pdf.addPage()
    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight)
    addHeader()
    heightLeft -= pageHeight
  }

  const fileName = `${filenamePrefix.replace(/\s+/g, '_')}.pdf`
  pdf.save(fileName)
}
