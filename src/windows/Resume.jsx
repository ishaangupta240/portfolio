import WindowControls from '#components/WindowControls'
import WindowWrapper from '#hoc/WindowWrapper'
import { Download } from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'
import React, { useEffect, useRef, useState } from 'react'

import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

const Resume = () => {
  const [numPages, setNumPages] = useState(null)
  const [pageWidth, setPageWidth] = useState(760)
  const viewerRef = useRef(null)

  useEffect(() => {
    const element = viewerRef.current
    if (!element) return

    const updateWidth = () => {
      const available = Math.max(320, Math.floor(element.clientWidth - 40))
      setPageWidth(Math.min(780, available))
    }

    updateWidth()

    const resizeObserver = new ResizeObserver(updateWidth)
    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  const onLoadSuccess = ({ numPages }) => {
    setNumPages(numPages)
  }

  return (
    <>
      <div className="window-header">
        <WindowControls target="resume" />
        <h2>Resume.pdf</h2>

        <a
          href="/files/resume.pdf"
          download
          className="cursor-pointer"
          title="Download Resume"
        >
          <Download className="icon" />
        </a>
      </div>

      <div ref={viewerRef} style={{ overflow: 'auto', flex: 1, minHeight: 0, padding: '20px' }}>
        <Document
          file="/files/resume.pdf"
          onLoadSuccess={onLoadSuccess}
          loading="Loading PDF..."
          error="Failed to load PDF"
        >
          {Array.from(new Array(numPages), (_, index) => (
            <Page
              key={index}
              pageNumber={index + 1}
              width={pageWidth}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          ))}
        </Document>
      </div>
    </>
  )
}

const ResumeWindow = WindowWrapper(Resume, 'resume')
export default ResumeWindow