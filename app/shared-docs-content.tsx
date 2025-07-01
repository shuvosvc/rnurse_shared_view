"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  FileText,
  ImageIcon,
  User,
  Building2,
  TestTube,
  Filter,
  X,
  AlertCircle,
  ExternalLink,
  Images,
} from "lucide-react"
import { format } from "date-fns"

interface PrescriptionImage {
  prescription_id: number
  prescription_img_id: number
  resiged: string
  thumb: string
}

interface ReportImage {
  report_id: number
  report_img_id: number
  resiged: string
  thumb: string
}

interface Report {
  id: number
  title: string | null
  test_name: string
  delivery_date: string
  prescription_id?: number
  created_at: string
  images: ReportImage[]
}

interface Prescription {
  id: number
  title: string | null
  department: string
  doctor_name: string
  visited_date: string
  created_at: string
  images: PrescriptionImage[]
  reports: Report[]
}

interface SharedDocsResponse {
  flag: number
  accessToken: string
  prescriptions: Prescription[]
  standaloneReports: Report[]
  message: string
}

interface Filters {
  title: string
  department: string
  testName: string
  doctorName: string
  dateFrom: string
  dateTo: string
}

export default function SharedDocsContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [data, setData] = useState<SharedDocsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [filters, setFilters] = useState<Filters>({
    title: "",
    department: "",
    testName: "",
    doctorName: "",
    dateFrom: "",
    dateTo: "",
  })
  const [showFilters, setShowFilters] = useState(false)

  // Get API base URL from environment variable
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

  useEffect(() => {
    if (token) {
      fetchSharedDocs()
    }
  }, [token])

  const fetchSharedDocs = async () => {
    try {
      setLoading(true)
      setError(null)
      setDebugInfo(null)

      if (!token) {
        throw new Error("No token provided in URL")
      }

      const apiUrl = `${API_BASE_URL}/getSharedDocs?token=${encodeURIComponent(token)}`
      console.log("Making API call to:", apiUrl)

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "cors",
        credentials: "include",
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      // Store debug info
      setDebugInfo({
        url: apiUrl,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API Error Response:", errorText)

        // Handle specific error cases
        if (response.status === 404) {
          throw new Error(
            `Endpoint not found (404). The API endpoint '/getSharedDocs' might not be configured on your server.`,
          )
        } else if (errorText.includes("Cannot GET")) {
          throw new Error(
            `Route not found: ${errorText}. Check if your Express server has the '/getSharedDocs' route defined.`,
          )
        } else {
          throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`)
        }
      }

      const result: SharedDocsResponse = await response.json()
      console.log("API Response:", result)
      setData(result)
    } catch (err) {
      console.error("Fetch error:", err)

      // Enhanced error handling for CORS and network issues
      if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
        setError(
          `Network Error: Unable to connect to the API server. This is likely a CORS issue. 
        
        Please ensure your backend server has CORS configured to allow requests from ${window.location.origin}.
        
        Backend CORS should include: ${window.location.origin}`,
        )
      } else {
        setError(err instanceof Error ? err.message : "An error occurred")
      }
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setFilters({
      title: "",
      department: "",
      testName: "",
      doctorName: "",
      dateFrom: "",
      dateTo: "",
    })
  }

  // Function to handle authenticated image viewing
  const viewFullImage = async (imagePath: string, accessToken: string) => {
    try {
      const imageUrl = imagePath.startsWith("/") ? `${API_BASE_URL}${imagePath}` : imagePath

      const response = await fetch(imageUrl, {
        headers: {
          Authorization: accessToken,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const imageObjectUrl = URL.createObjectURL(blob)

        // Open in new window
        const newWindow = window.open()
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head>
                <title>Medical Document Image</title>
                <style>
                  body { 
                    margin: 0; 
                    padding: 20px; 
                    background: #f5f5f5; 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    min-height: 100vh; 
                  }
                  img { 
                    max-width: 100%; 
                    max-height: 100vh; 
                    object-fit: contain; 
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    border-radius: 8px;
                    background: white;
                  }
                </style>
              </head>
              <body>
                <img src="${imageObjectUrl}" alt="Medical Document" />
              </body>
            </html>
          `)

          // Clean up the blob URL after a delay
          setTimeout(() => {
            URL.revokeObjectURL(imageObjectUrl)
          }, 10000)
        }
      } else {
        alert("Failed to load image. Please check your access permissions.")
      }
    } catch (error) {
      console.error("Error viewing image:", error)
      alert("Error loading image. Please try again.")
    }
  }

  // Function to view all images in a gallery
  const viewAllImages = async (images: (PrescriptionImage | ReportImage)[], accessToken: string, title: string) => {
    try {
      const imageBlobs = await Promise.all(
        images.map(async (image) => {
          const imagePath = "resiged" in image ? image.resiged : image.resiged
          const imageUrl = imagePath.startsWith("/") ? `${API_BASE_URL}${imagePath}` : imagePath

          const response = await fetch(imageUrl, {
            headers: {
              Authorization: accessToken,
            },
          })

          if (response.ok) {
            const blob = await response.blob()
            return {
              url: URL.createObjectURL(blob),
              blob: blob,
            }
          }
          return null
        }),
      )

      const validImages = imageBlobs.filter((item) => item !== null)

      if (validImages.length === 0) {
        alert("No images could be loaded.")
        return
      }

      // Create gallery window
      const newWindow = window.open("", "_blank", "width=900,height=800")
      if (newWindow) {
        newWindow.document.write(`
        <html>
          <head>
            <title>${title} - Image Gallery</title>
            <style>
              body { 
                margin: 0; 
                padding: 0;
                background: #f5f5f5; 
                font-family: Arial, sans-serif;
              }
              .header {
                position: sticky;
                top: 0;
                background: white;
                padding: 20px;
                text-align: center;
                border-bottom: 2px solid #8876E2;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                z-index: 100;
              }
              .header h2 {
                margin: 0 0 10px 0;
                color: #333;
                font-size: 24px;
              }
              .header p {
                margin: 5px 0;
                color: #6B7280;
              }
              .actions {
                margin-top: 15px;
                display: flex;
                gap: 10px;
                justify-content: center;
                flex-wrap: wrap;
              }
              .btn {
                padding: 8px 16px;
                border: 2px solid #8876E2;
                background: white;
                color: #8876E2;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                gap: 5px;
              }
              .btn:hover {
                background: #8876E2;
                color: white;
              }
              .btn-secondary {
                border-color: #03DAC6;
                color: #03DAC6;
              }
              .btn-secondary:hover {
                background: #03DAC6;
                color: white;
              }
              .gallery {
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
              }
              .image-container {
                background: white;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                text-align: center;
              }
              .image-container img {
                max-width: 100%;
                height: auto;
                border-radius: 4px;
                cursor: pointer;
                transition: transform 0.2s;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              .image-container img:hover {
                transform: scale(1.02);
              }
              .image-number {
                margin-top: 15px;
                color: #8876E2;
                font-weight: bold;
                font-size: 16px;
                padding: 8px 16px;
                background: #EDEAFD;
                border-radius: 20px;
                display: inline-block;
              }
              .modal {
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.9);
                cursor: pointer;
              }
              .modal img {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                max-width: 95%;
                max-height: 95%;
                object-fit: contain;
              }
              .close {
                position: absolute;
                top: 20px;
                right: 35px;
                color: #f1f1f1;
                font-size: 40px;
                font-weight: bold;
                cursor: pointer;
              }
              .close:hover {
                color: #8876E2;
              }
              .scroll-to-top {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #8876E2;
                color: white;
                border: none;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                cursor: pointer;
                font-size: 18px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                transition: all 0.2s;
              }
              .scroll-to-top:hover {
                background: #A192EE;
                transform: translateY(-2px);
              }
              @media (max-width: 768px) {
                .header {
                  padding: 15px;
                }
                .header h2 {
                  font-size: 20px;
                }
                .gallery {
                  padding: 15px;
                }
                .image-container {
                  padding: 15px;
                  margin-bottom: 15px;
                }
                .actions {
                  flex-direction: column;
                  align-items: center;
                }
                .btn {
                  width: 200px;
                  justify-content: center;
                }
              }
            </style>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
          </head>
          <body>
            <div class="header">
              <h2>${title}</h2>
              <p>${validImages.length} image(s) - Click any image to view full size</p>
              <div class="actions">
                <button class="btn" onclick="downloadPDF()">
                  📄 Download as PDF
                </button>
                <button class="btn btn-secondary" onclick="window.print()">
                  🖨️ Print Gallery
                </button>
                <button class="btn" onclick="scrollToTop()">
                  ⬆️ Scroll to Top
                </button>
              </div>
            </div>
            
            <div class="gallery">
              ${validImages
                .map(
                  (imageItem, index) => `
                <div class="image-container">
                  <img src="${imageItem.url}" alt="Image ${index + 1}" onclick="openModal('${imageItem.url}')" />
                  <div class="image-number">Image ${index + 1} of ${validImages.length}</div>
                </div>
              `,
                )
                .join("")}
            </div>
            
            <div id="modal" class="modal" onclick="closeModal()">
              <span class="close" onclick="closeModal()">&times;</span>
              <img id="modalImg" />
            </div>

            <button class="scroll-to-top" onclick="scrollToTop()" title="Scroll to top">
              ↑
            </button>

            <script>
              function openModal(src) {
                document.getElementById('modal').style.display = 'block';
                document.getElementById('modalImg').src = src;
              }
              
              function closeModal() {
                document.getElementById('modal').style.display = 'none';
              }
              
              function scrollToTop() {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
              
              // Close modal with Escape key
              document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                  closeModal();
                }
              });

              // PDF Download function
              async function downloadPDF() {
                try {
                  const { jsPDF } = window.jspdf;
                  const pdf = new jsPDF();
                  
                  // Add title page
                  pdf.setFontSize(20);
                  pdf.text('${title}', 20, 30);
                  pdf.setFontSize(12);
                  pdf.text('Generated on: ' + new Date().toLocaleDateString(), 20, 45);
                  pdf.text('Total Images: ${validImages.length}', 20, 55);
                  
                  const images = document.querySelectorAll('.image-container img');
                  
                  for (let i = 0; i < images.length; i++) {
                    if (i > 0) {
                      pdf.addPage();
                    } else {
                      pdf.addPage();
                    }
                    
                    try {
                      // Create canvas to convert image
                      const canvas = document.createElement('canvas');
                      const ctx = canvas.getContext('2d');
                      const img = images[i];
                      
                      // Wait for image to load
                      await new Promise((resolve) => {
                        if (img.complete) {
                          resolve();
                        } else {
                          img.onload = resolve;
                        }
                      });
                      
                      canvas.width = img.naturalWidth;
                      canvas.height = img.naturalHeight;
                      ctx.drawImage(img, 0, 0);
                      
                      const imgData = canvas.toDataURL('image/jpeg', 0.8);
                      
                      // Calculate dimensions to fit page
                      const pageWidth = pdf.internal.pageSize.getWidth() - 40;
                      const pageHeight = pdf.internal.pageSize.getHeight() - 60;
                      
                      let imgWidth = img.naturalWidth;
                      let imgHeight = img.naturalHeight;
                      
                      // Scale to fit page
                      const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
                      imgWidth *= ratio;
                      imgHeight *= ratio;
                      
                      // Center the image
                      const x = (pdf.internal.pageSize.getWidth() - imgWidth) / 2;
                      const y = 30;
                      
                      pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
                      
                      // Add image number
                      pdf.setFontSize(10);
                      pdf.text(\`Image \${i + 1} of ${validImages.length}\`, 20, pdf.internal.pageSize.getHeight() - 20);
                      
                    } catch (error) {
                      console.error('Error adding image to PDF:', error);
                      pdf.setFontSize(12);
                      pdf.text(\`Error loading image \${i + 1}\`, 20, 100);
                    }
                  }
                  
                  // Save the PDF
                  const fileName = '${title}'.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf';
                  pdf.save(fileName);
                  
                } catch (error) {
                  console.error('Error generating PDF:', error);
                  alert('Error generating PDF. Please try again.');
                }
              }

              // Show scroll to top button when scrolling
              window.addEventListener('scroll', function() {
                const scrollBtn = document.querySelector('.scroll-to-top');
                if (window.pageYOffset > 300) {
                  scrollBtn.style.display = 'block';
                } else {
                  scrollBtn.style.display = 'none';
                }
              });
            </script>
          </body>
        </html>
      `)

        // Clean up blob URLs after a delay
        setTimeout(() => {
          validImages.forEach((item) => URL.revokeObjectURL(item.url))
        }, 60000) // Increased timeout for PDF generation
      }
    } catch (error) {
      console.error("Error viewing images:", error)
      alert("Error loading images. Please try again.")
    }
  }

  const filterPrescriptions = (prescriptions: Prescription[]): Prescription[] => {
    return prescriptions
      .filter((prescription) => {
        // Filter by title
        if (filters.title && !prescription.title?.toLowerCase().includes(filters.title.toLowerCase())) {
          return false
        }

        // Filter by department
        if (filters.department && !prescription.department.toLowerCase().includes(filters.department.toLowerCase())) {
          return false
        }

        // Filter by doctor name
        if (filters.doctorName && !prescription.doctor_name.toLowerCase().includes(filters.doctorName.toLowerCase())) {
          return false
        }

        // Filter by date range
        if (filters.dateFrom || filters.dateTo) {
          const visitedDate = new Date(prescription.visited_date)
          if (filters.dateFrom && visitedDate < new Date(filters.dateFrom)) {
            return false
          }
          if (filters.dateTo && visitedDate > new Date(filters.dateTo)) {
            return false
          }
        }

        // Filter by test name (check reports)
        if (filters.testName) {
          const hasMatchingReport = prescription.reports.some((report) =>
            report.test_name.toLowerCase().includes(filters.testName.toLowerCase()),
          )
          if (!hasMatchingReport && prescription.reports.length > 0) {
            return false
          }
        }

        return true
      })
      .map((prescription) => ({
        ...prescription,
        reports: prescription.reports.filter((report) => {
          if (filters.testName && !report.test_name.toLowerCase().includes(filters.testName.toLowerCase())) {
            return false
          }
          return true
        }),
      }))
  }

  const filterStandaloneReports = (reports: Report[]): Report[] => {
    return reports.filter((report) => {
      // Filter by title
      if (filters.title && !report.title?.toLowerCase().includes(filters.title.toLowerCase())) {
        return false
      }

      // Filter by test name
      if (filters.testName && !report.test_name.toLowerCase().includes(filters.testName.toLowerCase())) {
        return false
      }

      // Filter by date range
      if (filters.dateFrom || filters.dateTo) {
        const deliveryDate = new Date(report.delivery_date)
        if (filters.dateFrom && deliveryDate < new Date(filters.dateFrom)) {
          return false
        }
        if (filters.dateTo && deliveryDate > new Date(filters.dateTo)) {
          return false
        }
      }

      return true
    })
  }

  const AuthenticatedImage = ({
    src,
    alt,
    className,
    accessToken,
  }: {
    src: string
    alt: string
    className?: string
    accessToken: string
  }) => {
    const [imageSrc, setImageSrc] = useState<string>("")
    const [imageError, setImageError] = useState(false)

    useEffect(() => {
      const fetchImage = async () => {
        try {
          // Construct full URL for image if it's a relative path
          const imageUrl = src.startsWith("/") ? `${API_BASE_URL}${src}` : src

          const response = await fetch(imageUrl, {
            headers: {
              Authorization: accessToken,
            },
          })

          if (response.ok) {
            const blob = await response.blob()
            const imageObjectUrl = URL.createObjectURL(blob)
            setImageSrc(imageObjectUrl)
          } else {
            setImageError(true)
          }
        } catch (error) {
          setImageError(true)
        }
      }

      if (src && accessToken) {
        fetchImage()
      }

      return () => {
        if (imageSrc) {
          URL.revokeObjectURL(imageSrc)
        }
      }
    }, [src, accessToken])

    if (imageError) {
      return (
        <div className={`bg-background-grey flex items-center justify-center ${className}`}>
          <ImageIcon className="h-8 w-8 text-text-grey" />
        </div>
      )
    }

    return imageSrc ? (
      <img src={imageSrc || "/placeholder.svg"} alt={alt} className={className} />
    ) : (
      <div className={`bg-background-grey animate-pulse ${className}`} />
    )
  }

  // Token validation
  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Missing Token</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-grey mb-4">No access token found in URL. Please use a valid shared link.</p>
            <p className="text-sm text-text-grey">Expected URL format: /sharedpage?token=your_token_here</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-900">Loading shared documents...</p>
          <p className="text-sm text-text-grey mt-2">API: {API_BASE_URL}</p>
          <p className="text-sm text-text-grey">Token: {token.substring(0, 10)}...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              API Connection Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-red-800 font-medium mb-2">Error Details:</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>

              {debugInfo && (
                <div className="bg-background-grey p-4 rounded-lg border">
                  <p className="font-medium mb-2">Debug Information:</p>
                  <div className="text-sm space-y-1 text-text-grey">
                    <p>
                      <strong>URL:</strong> {debugInfo.url}
                    </p>
                    <p>
                      <strong>Status:</strong> {debugInfo.status} {debugInfo.statusText}
                    </p>
                    <p>
                      <strong>Token:</strong> {token.substring(0, 15)}...
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-primary-more-light p-4 rounded-lg border border-primary-light">
                <p className="text-primary font-medium mb-2">Troubleshooting Steps:</p>
                <ul className="text-sm text-primary space-y-1 list-disc list-inside">
                  <li>Make sure your backend server is running on port 5000</li>
                  <li>
                    Verify the <code>/getSharedDocs</code> route exists in your Express app
                  </li>
                  <li>
                    Check if the route is defined as <code>app.get('/getSharedDocs', ...)</code>
                  </li>
                  <li>Ensure CORS is properly configured for your frontend domain</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button onClick={fetchSharedDocs} className="flex-1 bg-primary hover:bg-primary-light">
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-primary text-primary hover:bg-primary-more-light bg-transparent"
                  onClick={() => {
                    const testUrl = `${API_BASE_URL}/getSharedDocs?token=${token}`
                    window.open(testUrl, "_blank")
                  }}
                >
                  Test API in Browser
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-text-grey">No data available</p>
      </div>
    )
  }

  const filteredPrescriptions = filterPrescriptions(data.prescriptions)
  const filteredStandaloneReports = filterStandaloneReports(data.standaloneReports)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl shadow-lg bg-primary-more-light flex items-center justify-center overflow-hidden">
              <img
                src="/ic_launcher.png"
                alt="Med History Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error("Logo failed to load:", e)
                  e.currentTarget.style.display = "none"
                  e.currentTarget.nextElementSibling.style.display = "flex"
                }}
                onLoad={() => console.log("Logo loaded successfully")}
              />
              <div
                className="w-full h-full flex items-center justify-center text-primary font-bold text-xl"
                style={{ display: "none" }}
              >
                MH
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Med History</h1>
              <p className="text-text-grey text-lg">Your shared medical documents</p>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <Card className="mb-8 border-primary-light">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Filter className="h-5 w-5" />
                Advanced Filters
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="border-primary text-primary hover:bg-primary-more-light"
              >
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>
          </CardHeader>
          {showFilters && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label htmlFor="title" className="text-gray-900">
                    Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="Filter by title..."
                    value={filters.title}
                    onChange={(e) => setFilters((prev) => ({ ...prev, title: e.target.value }))}
                    className="border-primary-light focus:border-primary"
                  />
                </div>
                <div>
                  <Label htmlFor="department" className="text-gray-900">
                    Department
                  </Label>
                  <Input
                    id="department"
                    placeholder="Filter by department..."
                    value={filters.department}
                    onChange={(e) => setFilters((prev) => ({ ...prev, department: e.target.value }))}
                    className="border-primary-light focus:border-primary"
                  />
                </div>
                <div>
                  <Label htmlFor="doctorName" className="text-gray-900">
                    Doctor Name
                  </Label>
                  <Input
                    id="doctorName"
                    placeholder="Filter by doctor name..."
                    value={filters.doctorName}
                    onChange={(e) => setFilters((prev) => ({ ...prev, doctorName: e.target.value }))}
                    className="border-primary-light focus:border-primary"
                  />
                </div>
                <div>
                  <Label htmlFor="testName" className="text-gray-900">
                    Test Name
                  </Label>
                  <Input
                    id="testName"
                    placeholder="Filter by test name..."
                    value={filters.testName}
                    onChange={(e) => setFilters((prev) => ({ ...prev, testName: e.target.value }))}
                    className="border-primary-light focus:border-primary"
                  />
                </div>
                <div>
                  <Label htmlFor="dateFrom" className="text-gray-900">
                    Date From
                  </Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                    className="border-primary-light focus:border-primary"
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo" className="text-gray-900">
                    Date To
                  </Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                    className="border-primary-light focus:border-primary"
                  />
                </div>
              </div>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex items-center gap-2 border-secondary text-secondary hover:bg-secondary/10 bg-transparent"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-text-grey">
            Found {filteredPrescriptions.length} prescriptions and {filteredStandaloneReports.length} standalone reports
          </p>
        </div>

        {/* Prescriptions */}
        {filteredPrescriptions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Prescriptions
            </h2>
            <div className="grid gap-6">
              {filteredPrescriptions.map((prescription) => (
                <Card key={prescription.id} className="overflow-hidden border-primary-light">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl text-gray-900">
                          {prescription.title || `Prescription #${prescription.id}`}
                        </CardTitle>
                        <CardDescription className="mt-2 space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            <span>{prescription.doctor_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary" />
                            <span>{prescription.department}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span>Visited: {format(new Date(prescription.visited_date), "PPP")}</span>
                          </div>
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-primary text-white">
                        ID: {prescription.id}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Prescription Images */}
                    {prescription.images.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold flex items-center gap-2 text-gray-900">
                            <ImageIcon className="h-4 w-4 text-secondary" />
                            Prescription Images ({prescription.images.length})
                          </h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              viewAllImages(
                                prescription.images,
                                data.accessToken,
                                `${prescription.title || `Prescription #${prescription.id}`} - All Images`,
                              )
                            }
                            className="border-secondary text-secondary hover:bg-secondary/10 bg-transparent"
                          >
                            <Images className="h-4 w-4 mr-1" />
                            View All ({prescription.images.length})
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {prescription.images.map((image) => (
                            <div key={image.prescription_img_id} className="space-y-2">
                              <AuthenticatedImage
                                src={image.thumb}
                                alt={`Prescription ${prescription.id} image`}
                                className="w-full h-32 object-cover rounded-lg border border-primary-light"
                                accessToken={data.accessToken}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs border-primary text-primary hover:bg-primary-more-light bg-transparent"
                                onClick={() => viewFullImage(image.resiged, data.accessToken)}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View Full Size
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Associated Reports */}
                    {prescription.reports.length > 0 && (
                      <div>
                        <Separator className="mb-4 bg-primary-light" />
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900">
                          <TestTube className="h-4 w-4 text-secondary" />
                          Associated Reports ({prescription.reports.length})
                        </h4>
                        <div className="space-y-4">
                          {prescription.reports.map((report) => (
                            <Card key={report.id} className="bg-primary-more-light border-primary-light">
                              <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <CardTitle className="text-lg text-gray-900">
                                      {report.title || `Report #${report.id}`}
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <TestTube className="h-3 w-3 text-secondary" />
                                        <span>{report.test_name}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Calendar className="h-3 w-3 text-secondary" />
                                        <span>Delivery: {format(new Date(report.delivery_date), "PPP")}</span>
                                      </div>
                                    </CardDescription>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {report.images.length > 0 && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          viewAllImages(
                                            report.images,
                                            data.accessToken,
                                            `${report.title || `Report #${report.id}`} - ${report.test_name}`,
                                          )
                                        }
                                        className="border-secondary text-secondary hover:bg-secondary/10 bg-transparent"
                                      >
                                        <Images className="h-3 w-3 mr-1" />
                                        View All ({report.images.length})
                                      </Button>
                                    )}
                                    <Badge variant="outline" className="border-primary text-primary">
                                      Report #{report.id}
                                    </Badge>
                                  </div>
                                </div>
                              </CardHeader>
                              {report.images.length > 0 && (
                                <CardContent className="pt-0">
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {report.images.map((image) => (
                                      <div key={image.report_img_id} className="space-y-2">
                                        <AuthenticatedImage
                                          src={image.thumb}
                                          alt={`Report ${report.id} image`}
                                          className="w-full h-24 object-cover rounded border border-primary-light"
                                          accessToken={data.accessToken}
                                        />
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="w-full text-xs border-primary text-primary hover:bg-primary-more-light bg-transparent"
                                          onClick={() => viewFullImage(image.resiged, data.accessToken)}
                                        >
                                          <ExternalLink className="h-3 w-3 mr-1" />
                                          View Full
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              )}
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Standalone Reports */}
        {filteredStandaloneReports.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TestTube className="h-6 w-6 text-secondary" />
              Standalone Reports
            </h2>
            <div className="grid gap-4">
              {filteredStandaloneReports.map((report) => (
                <Card key={report.id} className="border-primary-light">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl text-gray-900">
                          {report.title || `Report #${report.id}`}
                        </CardTitle>
                        <CardDescription className="mt-2 space-y-1">
                          <div className="flex items-center gap-2">
                            <TestTube className="h-4 w-4 text-secondary" />
                            <span>{report.test_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-secondary" />
                            <span>Delivery: {format(new Date(report.delivery_date), "PPP")}</span>
                          </div>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {report.images.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              viewAllImages(
                                report.images,
                                data.accessToken,
                                `${report.title || `Report #${report.id}`} - ${report.test_name}`,
                              )
                            }
                            className="border-secondary text-secondary hover:bg-secondary/10 bg-transparent"
                          >
                            <Images className="h-4 w-4 mr-1" />
                            View All ({report.images.length})
                          </Button>
                        )}
                        <Badge variant="secondary" className="bg-secondary text-white">
                          Report #{report.id}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  {report.images.length > 0 && (
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {report.images.map((image) => (
                          <div key={image.report_img_id} className="space-y-2">
                            <AuthenticatedImage
                              src={image.thumb}
                              alt={`Report ${report.id} image`}
                              className="w-full h-32 object-cover rounded-lg border border-primary-light"
                              accessToken={data.accessToken}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs border-primary text-primary hover:bg-primary-more-light bg-transparent"
                              onClick={() => viewFullImage(image.resiged, data.accessToken)}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View Full Size
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {filteredPrescriptions.length === 0 && filteredStandaloneReports.length === 0 && (
          <Card className="border-primary-light">
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-text-grey mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents found</h3>
              <p className="text-text-grey mb-4">No documents match your current filter criteria.</p>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="border-primary text-primary hover:bg-primary-more-light bg-transparent"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
