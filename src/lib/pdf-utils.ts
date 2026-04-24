import { format } from 'date-fns'
import logoUrl from '@/assets/design-sem-nome-314e3.png'

declare global {
  interface Window {
    html2canvas: any
    jspdf: any
  }
}

async function getBase64ImageFromUrl(imageUrl: string): Promise<string> {
  try {
    const res = await fetch(imageUrl)
    const blob = await res.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (e) {
    console.error('Failed to load logo', e)
    return ''
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

  const logoBase64 = await getBase64ImageFromUrl(logoUrl)

  const originalWidth = element.style.width
  const originalMaxWidth = element.style.maxWidth
  const originalMargin = element.style.margin

  element.style.width = '1024px'
  element.style.maxWidth = '1024px'
  element.style.margin = '0'

  // Hide elements with 'print-hidden' class
  const printHiddenElements = element.querySelectorAll('.print-hidden')
  const originalDisplays: string[] = []
  printHiddenElements.forEach((el: any, index) => {
    originalDisplays[index] = el.style.display
    el.style.display = 'none'
  })

  await new Promise((resolve) => setTimeout(resolve, 500))

  const canvas = await window.html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  })

  element.style.width = originalWidth
  element.style.maxWidth = originalMaxWidth
  element.style.margin = originalMargin

  // Restore elements
  printHiddenElements.forEach((el: any, index) => {
    el.style.display = originalDisplays[index]
  })

  const imgData = canvas.toDataURL('image/png')
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

  const logoWidth = 40
  const logoHeight = 15

  const addHeader = () => {
    if (logoBase64) {
      pdf.setFillColor(255, 255, 255)
      pdf.rect(5, 5, logoWidth + 4, logoHeight + 4, 'F')
      pdf.addImage(logoBase64, 'PNG', 7, 7, logoWidth, logoHeight)
    }
  }

  pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
  addHeader()
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position = heightLeft - pdfHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
    addHeader()
    heightLeft -= pageHeight
  }

  const fileName = `${filenamePrefix.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`
  pdf.save(fileName)
}
