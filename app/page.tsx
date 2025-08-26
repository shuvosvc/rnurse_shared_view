"use client"

import { useEffect, useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Calendar,
  User,
  Phone,
  Mail,
  Droplets,
  Weight,
  Heart,
  Activity,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  FileText,
  FolderOpen,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  AlertTriangle,
} from "lucide-react"
import Image from "next/image"
import { jsPDF } from "jspdf"

interface MedicalData {
  flag: number
  accessToken: string
  userInfo: {
    user_id: number
    first_name: string
    last_name: string
    phone: string
    email: string
    gender: string
    blood_group: string
    birthday: string
    profile_image_url: string
    address: string
    chronic_disease: string
    pinned: boolean
  }
  overview: {
    weight: { id: number; weight: string; created_at: string }
    blood_pressure: { id: number; systolic: number; diastolic: number; created_at: string }
    sugar_level: { id: number; sugar_level: string; created_at: string }
    o2_level: { id: number; o2_level: string; created_at: string }
  }
  prescriptions: Array<{
    id: number
    title: string | null
    department: string | null
    doctor_name: string
    visited_date: string
    created_at: string
    images: Array<{
      prescription_id: number
      prescription_img_id: number
      resiged: string
      thumb: string
    }>
    reports: Array<{
      id: number
      title: string | null
      test_name: string
      delivery_date: string
      normal_or_not: string
      prescription_id: number
      created_at: string
      images: Array<{
        report_id: number
        report_img_id: number
        resiged: string
        thumb: string
      }>
    }>
  }>
  standaloneReports: Array<{
    id: number
    title: string | null
    test_name: string
    delivery_date: string
    normal_or_not: string
    created_at: string
    images: Array<{
      report_id: number
      report_img_id: number
      resiged: string
      thumb: string
    }>
  }>
  message: string
}

export default function MedicalHistory() {
  const searchParams = useSearchParams()
  const [data, setData] = useState<MedicalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"separated" | "combined">("separated")
  const [selectedItems, setSelectedItems] = useState<{
    prescriptions: Set<number>
    reports: Set<number>
  }>({
    prescriptions: new Set(),
    reports: new Set(),
  })

  const token = searchParams.get("token")

  const [imageGallery, setImageGallery] = useState<{
    isOpen: boolean
    images: Array<{ src: string; alt: string; type: "prescription" | "report" }>
    currentIndex: number
  }>({
    isOpen: false,
    images: [],
    currentIndex: 0,
  })

  const [activeTab, setActiveTab] = useState<"prescriptions" | "reports">("prescriptions")

  useEffect(() => {
    if (!token) {
      setError("No token provided in URL")
      setLoading(false)
      return
    }

    fetchMedicalData(token)
  }, [token])

  const fetchMedicalData = async (token: string) => {
    try {
      setLoading(true)
      const response = await fetch(`https://gemini-classifier.onrender.com/getSharedDocs?token=${token}`)

      if (!response.ok) {
        throw new Error("Failed to fetch data")
      }

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const getImageUrl = (imagePath: string) => {
    return `https://gemini-classifier.onrender.com${imagePath}`
  }

  const AuthorizedImage = ({
    src,
    alt,
    className,
    onClick,
  }: { src: string; alt: string; className?: string; onClick?: () => void }) => {
    const [imageSrc, setImageSrc] = useState<string>("")
    const [imageError, setImageError] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
      if (!data?.accessToken || !src) {
        console.log("[v0] AuthorizedImage - Missing data:", { hasToken: !!data?.accessToken, src })
        return
      }

      const fetchImage = async () => {
        try {
          setIsLoading(true)
          setImageError(false)
          const imageUrl = getImageUrl(src)
          console.log("[v0] AuthorizedImage - Fetching image:", {
            src,
            imageUrl,
            token: data.accessToken?.substring(0, 20) + "...",
          })

          const response = await fetch(imageUrl, {
            headers: {
              authorization: data.accessToken,
            },
          })

          if (response.ok) {
            const blob = await response.blob()
            const objectUrl = URL.createObjectURL(blob)
            setImageSrc(objectUrl)
            console.log("[v0] AuthorizedImage - Successfully loaded image:", src)
          } else {
            console.error("[v0] AuthorizedImage - Failed to load image:", response.status, response.statusText, src)
            setImageError(true)
          }
        } catch (error) {
          console.error("[v0] AuthorizedImage - Error loading image:", error, src)
          setImageError(true)
        } finally {
          setIsLoading(false)
        }
      }

      fetchImage()

      return () => {
        if (imageSrc) {
          URL.revokeObjectURL(imageSrc)
        }
      }
    }, [src, data?.accessToken])

    if (imageError) {
      return (
        <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
          <FileText className="h-8 w-8 text-gray-400" />
          <span className="text-xs text-gray-500 ml-2">Failed to load</span>
        </div>
      )
    }

    if (isLoading) {
      return <div className={`bg-gray-100 animate-pulse ${className}`} />
    }

    return (
      <img
        src={imageSrc || "/placeholder.svg"}
        alt={alt}
        className={`${className} cursor-pointer`}
        onClick={onClick}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
        onError={() => {
          console.error("[v0] AuthorizedImage - Image onError triggered:", src)
          setImageError(true)
        }}
      />
    )
  }

  // Get unique departments for filter
  const departments = useMemo(() => {
    if (!data) return []
    const depts = new Set<string>()
    data.prescriptions.forEach((p) => {
      if (p.department) depts.add(p.department)
    })
    return Array.from(depts)
  }, [data])

  // Filter prescriptions and reports
  const filteredPrescriptions = useMemo(() => {
    if (!data) return []

    return data.prescriptions.filter((prescription) => {
      // Search filter
      const searchMatch =
        searchTerm === "" ||
        prescription.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (prescription.department && prescription.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (prescription.title && prescription.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        prescription.reports.some(
          (report) =>
            report.test_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (report.title && report.title.toLowerCase().includes(searchTerm.toLowerCase())),
        )

      // Department filter
      const departmentMatch = departmentFilter === "all" || prescription.department === departmentFilter

      const prescriptionDate = new Date(prescription.visited_date)
      let dateMatch = true

      if (startDate) {
        const start = new Date(startDate)
        dateMatch = dateMatch && prescriptionDate >= start
      }

      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999) // Include the entire end date
        dateMatch = dateMatch && prescriptionDate <= end
      }

      return searchMatch && departmentMatch && dateMatch
    })
  }, [data, searchTerm, departmentFilter, startDate, endDate])

  const filteredReports = useMemo(() => {
    if (!data) return []

    const allReports = [...data.standaloneReports, ...data.prescriptions.flatMap((p) => p.reports)]

    return allReports.filter((report) => {
      // Search filter
      const searchMatch =
        searchTerm === "" ||
        report.test_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (report.title && report.title.toLowerCase().includes(searchTerm.toLowerCase()))

      // Status filter
      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "normal" && report.normal_or_not === "Normal") ||
        (statusFilter === "abnormal" && report.normal_or_not === "Abnormal")

      const reportDate = new Date(report.delivery_date)
      let dateMatch = true

      if (startDate) {
        const start = new Date(startDate)
        dateMatch = dateMatch && reportDate >= start
      }

      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        dateMatch = dateMatch && reportDate <= end
      }

      return searchMatch && statusMatch && dateMatch
    })
  }, [data, searchTerm, statusFilter, startDate, endDate])

  const openImageGallery = (
    images: Array<{
      src?: string
      alt: string
      type: "prescription" | "report"
      prescription_img_id?: number
      report_img_id?: number
      thumb?: string
      resiged?: string
    }>,
    index = 0,
  ) => {
    const validImages = images
      .filter((img) => img.thumb || img.resiged)
      .map((img) => ({
        src: img.src || img.resiged || img.thumb || "",
        alt: img.alt,
        type: img.type,
      }))

    console.log("[v0] Opening image gallery with images:", validImages)
    setImageGallery({
      isOpen: true,
      images: validImages,
      currentIndex: Math.min(index, validImages.length - 1),
    })
  }

  const exportToPDF = async () => {
    const pdf = new jsPDF()
    let yPos = 20

    pdf.setFillColor(116, 90, 242) // Purple header background
    pdf.rect(0, 0, 210, 35, "F")

    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(24)
    pdf.setFont("helvetica", "bold")
    pdf.text("MEDICAL HISTORY REPORT", 20, 20)

    pdf.setFontSize(12)
    pdf.setFont("helvetica", "normal")
    pdf.text(
      `Generated on: ${new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`,
      20,
      30,
    )

    yPos = 50
    pdf.setTextColor(0, 0, 0) // Reset to black text

    pdf.setFillColor(248, 250, 252) // Light gray background
    pdf.rect(15, yPos - 5, 180, 85, "F")

    pdf.setFontSize(18)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(30, 41, 59)
    pdf.text("PATIENT INFORMATION", 20, yPos + 5)
    yPos += 15

    pdf.setFontSize(11)
    pdf.setFont("helvetica", "normal")
    pdf.setTextColor(51, 65, 85)

    // Two column layout for patient info
    const leftCol = 20
    const rightCol = 110
    let leftY = yPos
    let rightY = yPos

    pdf.setFont("helvetica", "bold")
    pdf.text("Name:", leftCol, leftY)
    pdf.setFont("helvetica", "normal")
    pdf.text(`${data.userInfo.first_name} ${data.userInfo.last_name}`, leftCol + 25, leftY)
    leftY += 10

    pdf.setFont("helvetica", "bold")
    pdf.text("Email:", leftCol, leftY)
    pdf.setFont("helvetica", "normal")
    pdf.text(data.userInfo.email, leftCol + 25, leftY)
    leftY += 10

    pdf.setFont("helvetica", "bold")
    pdf.text("Phone:", leftCol, leftY)
    pdf.setFont("helvetica", "normal")
    pdf.text(data.userInfo.phone, leftCol + 25, leftY)
    leftY += 10

    pdf.setFont("helvetica", "bold")
    pdf.text("Blood Group:", rightCol, rightY)
    pdf.setFont("helvetica", "normal")
    pdf.text(data.userInfo.blood_group, rightCol + 35, rightY)
    rightY += 10

    pdf.setFont("helvetica", "bold")
    pdf.text("Date of Birth:", rightCol, rightY)
    pdf.setFont("helvetica", "normal")
    pdf.text(new Date(data.userInfo.birthday).toLocaleDateString(), rightCol + 35, rightY)
    rightY += 10

    pdf.setFont("helvetica", "bold")
    pdf.text("Gender:", rightCol, rightY)
    pdf.setFont("helvetica", "normal")
    pdf.text(data.userInfo.gender, rightCol + 35, rightY)

    yPos = Math.max(leftY, rightY) + 15

    if (data.userInfo.chronic_disease && data.userInfo.chronic_disease.trim()) {
      pdf.setFillColor(254, 242, 242) // Light red background for chronic diseases
      pdf.rect(15, yPos - 5, 180, 25, "F")

      pdf.setFontSize(16)
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(185, 28, 28)
      pdf.text("CHRONIC DISEASES", 20, yPos + 5)
      yPos += 12

      pdf.setFontSize(11)
      pdf.setFont("helvetica", "normal")
      pdf.setTextColor(51, 65, 85)
      const chronicDiseases = pdf.splitTextToSize(data.userInfo.chronic_disease, 170)
      pdf.text(chronicDiseases, 20, yPos)
      yPos += chronicDiseases.length * 6 + 20
    }

    pdf.setFillColor(240, 253, 244) // Light green background
    pdf.rect(15, yPos - 5, 180, 45, "F")

    pdf.setFontSize(18)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(22, 101, 52)
    pdf.text("MEDICAL OVERVIEW", 20, yPos + 5)
    yPos += 15

    pdf.setFontSize(11)
    pdf.setTextColor(51, 65, 85)

    // Four column layout for vitals
    const col1 = 20,
      col2 = 65,
      col3 = 110,
      col4 = 155

    pdf.setFont("helvetica", "bold")
    pdf.text("Weight", col1, yPos)
    pdf.setFont("helvetica", "normal")
    pdf.text(`${data.overview.weight.weight} kg`, col1, yPos + 8)

    pdf.setFont("helvetica", "bold")
    pdf.text("Blood Pressure", col2, yPos)
    pdf.setFont("helvetica", "normal")
    pdf.text(`${data.overview.blood_pressure.systolic}/${data.overview.blood_pressure.diastolic}`, col2, yPos + 8)

    pdf.setFont("helvetica", "bold")
    pdf.text("Sugar Level", col3, yPos)
    pdf.setFont("helvetica", "normal")
    pdf.text(`${data.overview.sugar_level.sugar_level} mg/dL`, col3, yPos + 8)

    pdf.setFont("helvetica", "bold")
    pdf.text("O2 Level", col4, yPos)
    pdf.setFont("helvetica", "normal")
    pdf.text(`${data.overview.o2_level.o2_level}%`, col4, yPos + 8)

    yPos += 25

    const addImageToPDF = async (imagePath: string, title: string) => {
      try {
        const response = await fetch(`https://gemini-classifier.onrender.com${imagePath}`, {
          headers: {
            authorization: data.accessToken,
          },
        })

        if (response.ok) {
          const blob = await response.blob()
          const reader = new FileReader()

          return new Promise((resolve) => {
            reader.onload = () => {
              try {
                const imgData = reader.result as string

                // Check if we need a new page
                if (yPos > 180) {
                  pdf.addPage()
                  yPos = 20
                }

                pdf.setFillColor(249, 250, 251)
                pdf.rect(15, yPos - 3, 180, 12, "F")
                pdf.setFontSize(10)
                pdf.setFont("helvetica", "bold")
                pdf.setTextColor(75, 85, 99)
                pdf.text(title, 20, yPos + 5)
                yPos += 15

                const tempImg = new window.Image()
                tempImg.onload = () => {
                  const originalWidth = tempImg.width
                  const originalHeight = tempImg.height

                  // Calculate scale to fit within page margins (max width 180)
                  const maxWidth = 180
                  const scale = Math.min(1, maxWidth / originalWidth)

                  const scaledWidth = originalWidth * scale
                  const scaledHeight = originalHeight * scale

                  // Center the image
                  const xPos = (210 - scaledWidth) / 2

                  pdf.addImage(imgData, "JPEG", xPos, yPos, scaledWidth, scaledHeight, undefined, "SLOW")
                  yPos += scaledHeight + 20

                  resolve(true)
                }
                tempImg.src = imgData
              } catch (error) {
                console.error("Error adding image to PDF:", error)
                resolve(false)
              }
            }
            reader.readAsDataURL(blob)
          })
        }
      } catch (error) {
        console.error("Error fetching image:", error)
        return false
      }
    }

    const selectedPrescriptions = data.prescriptions.filter((p) => selectedItems.prescriptions.has(p.id))
    if (selectedPrescriptions.length > 0) {
      if (yPos > 220) {
        pdf.addPage()
        yPos = 20
      }

      pdf.setFillColor(239, 246, 255) // Light blue background
      pdf.rect(15, yPos - 5, 180, 15, "F")

      pdf.setFontSize(18)
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(29, 78, 216)
      pdf.text("PRESCRIPTIONS", 20, yPos + 5)
      yPos += 20

      for (const prescription of selectedPrescriptions) {
        if (yPos > 220) {
          pdf.addPage()
          yPos = 20
        }

        pdf.setFillColor(255, 255, 255)
        pdf.setDrawColor(229, 231, 235)
        pdf.rect(15, yPos - 5, 180, 25, "FD")

        pdf.setFontSize(14)
        pdf.setFont("helvetica", "bold")
        pdf.setTextColor(17, 24, 39)
        pdf.text(`Dr. ${prescription.doctor_name}`, 20, yPos + 5)

        pdf.setFontSize(11)
        pdf.setFont("helvetica", "normal")
        pdf.setTextColor(107, 114, 128)
        pdf.text(`Department: ${prescription.department || "N/A"}`, 20, yPos + 12)
        pdf.text(`Visited: ${new Date(prescription.visited_date).toLocaleDateString()}`, 110, yPos + 5)
        pdf.text(`Created: ${new Date(prescription.created_at).toLocaleDateString()}`, 110, yPos + 12)

        yPos += 30

        for (let i = 0; i < prescription.images.length; i++) {
          await addImageToPDF(
            prescription.images[i].resiged || prescription.images[i].thumb,
            `Prescription ${i + 1} - Dr. ${prescription.doctor_name}`,
          )
        }

        if (prescription.reports && prescription.reports.length > 0) {
          pdf.setFontSize(12)
          pdf.setFont("helvetica", "bold")
          pdf.setTextColor(75, 85, 99)
          pdf.text("Associated Reports:", 20, yPos)
          yPos += 12

          for (const report of prescription.reports) {
            pdf.setFontSize(11)
            pdf.setFont("helvetica", "bold")
            pdf.setTextColor(17, 24, 39)
            pdf.text(`• ${report.title || report.test_name}`, 25, yPos)
            yPos += 8

            pdf.setFont("helvetica", "normal")
            pdf.setTextColor(107, 114, 128)
            const statusColor = report.normal_or_not === "Normal" ? [34, 197, 94] : [239, 68, 68]
            pdf.setTextColor(...statusColor)
            pdf.text(`Status: ${report.normal_or_not}`, 30, yPos)
            yPos += 6

            pdf.setTextColor(107, 114, 128)
            pdf.text(`Delivery: ${new Date(report.delivery_date).toLocaleDateString()}`, 30, yPos)
            yPos += 10

            for (let i = 0; i < report.images.length; i++) {
              await addImageToPDF(
                report.images[i].resiged || report.images[i].thumb,
                `${report.title || report.test_name} - Report ${i + 1}`,
              )
            }
          }
          yPos += 10
        }
      }
    }

    const allReports = [...(data.standaloneReports || []), ...(data.prescriptions.flatMap((p) => p.reports) || [])]
    const selectedReports = allReports.filter((r) => selectedItems.reports.has(r.id))

    if (selectedReports.length > 0) {
      if (yPos > 220) {
        pdf.addPage()
        yPos = 20
      }

      pdf.setFillColor(254, 243, 199) // Light yellow background
      pdf.rect(15, yPos - 5, 180, 15, "F")

      pdf.setFontSize(18)
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(180, 83, 9)
      pdf.text("MEDICAL REPORTS", 20, yPos + 5)
      yPos += 20

      for (const report of selectedReports) {
        if (yPos > 220) {
          pdf.addPage()
          yPos = 20
        }

        pdf.setFillColor(255, 255, 255)
        pdf.setDrawColor(229, 231, 235)
        pdf.rect(15, yPos - 5, 180, 25, "FD")

        pdf.setFontSize(14)
        pdf.setFont("helvetica", "bold")
        pdf.setTextColor(17, 24, 39)
        pdf.text(`${report.title || report.test_name}`, 20, yPos + 5)

        pdf.setFontSize(11)
        pdf.setFont("helvetica", "normal")
        const statusColor = report.normal_or_not === "Normal" ? [34, 197, 94] : [239, 68, 68]
        pdf.setTextColor(...statusColor)
        pdf.text(`Status: ${report.normal_or_not}`, 20, yPos + 12)

        pdf.setTextColor(107, 114, 128)
        pdf.text(`Delivery: ${new Date(report.delivery_date).toLocaleDateString()}`, 110, yPos + 5)
        pdf.text(`Created: ${new Date(report.created_at).toLocaleDateString()}`, 110, yPos + 12)

        yPos += 30

        for (let i = 0; i < report.images.length; i++) {
          await addImageToPDF(
            report.images[i].resiged || report.images[i].thumb,
            `${report.title || report.test_name} - Report ${i + 1}`,
          )
        }
        yPos += 10
      }
    }

    // Footer
    const pageCount = pdf.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setFontSize(8)
      pdf.setTextColor(107, 114, 128)
      pdf.text(`Page ${i} of ${pageCount}`, 180, 285)
      pdf.text("Med History - Confidential Medical Report", 20, 285)
    }

    pdf.save(`medical-report-${data.userInfo.id}-${new Date().toISOString().split("T")[0]}.pdf`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading medical history...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
              <p className="text-gray-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image src="/logo.png" alt="Med History" width={40} height={40} className="rounded-lg" />
              <h1 className="text-2xl font-bold text-gray-900">Med History</h1>
            </div>
            <div className="text-sm text-gray-500">Patient ID: {data.userInfo.user_id}</div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Patient Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Patient Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-center space-x-4">
                {data.userInfo.profile_image_url && (
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                    <AuthorizedImage src={data.userInfo.profile_image_url} alt="Profile" className="object-cover" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg">
                    {data.userInfo.first_name} {data.userInfo.last_name}
                  </h3>
                  <p className="text-gray-600">Gender: {data.userInfo.gender}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{data.userInfo.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{data.userInfo.email}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Droplets className="h-4 w-4 text-red-500" />
                  <span>Blood Group: {data.userInfo.blood_group}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>DOB: {new Date(data.userInfo.birthday).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {data.userInfo.chronic_disease && data.userInfo.chronic_disease.trim() && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold text-lg mb-3 flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <span>Chronic Diseases</span>
                </h4>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-gray-800">{data.userInfo.chronic_disease}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medical Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Medical Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Weight className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Weight</span>
                </div>
                <p className="text-2xl font-bold text-blue-700">{data.overview.weight.weight} kg</p>
                <p className="text-sm text-gray-500">
                  {new Date(data.overview.weight.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Heart className="h-5 w-5 text-red-600" />
                  <span className="font-medium">Blood Pressure</span>
                </div>
                <p className="text-2xl font-bold text-red-700">
                  {data.overview.blood_pressure.systolic}/{data.overview.blood_pressure.diastolic}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(data.overview.blood_pressure.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Droplets className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Sugar Level</span>
                </div>
                <p className="text-2xl font-bold text-green-700">{data.overview.sugar_level.sugar_level}</p>
                <p className="text-sm text-gray-500">
                  {new Date(data.overview.sugar_level.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  <span className="font-medium">O2 Level</span>
                </div>
                <p className="text-2xl font-bold text-purple-700">{data.overview.o2_level.o2_level}%</p>
                <p className="text-sm text-gray-500">
                  {new Date(data.overview.o2_level.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* First row - Search and main filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative sm:col-span-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by doctor, department, test..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  disabled={viewMode === "separated" && activeTab === "prescriptions"}
                >
                  <SelectTrigger
                    className={viewMode === "separated" && activeTab === "prescriptions" ? "opacity-50" : ""}
                  >
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="abnormal">Abnormal</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={departmentFilter}
                  onValueChange={setDepartmentFilter}
                  disabled={viewMode === "separated" && activeTab === "reports"}
                >
                  <SelectTrigger className={viewMode === "separated" && activeTab === "reports" ? "opacity-50" : ""}>
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Second row - Date filters and view mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">End Date</label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-sm" />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">View Mode</label>
                  <Select value={viewMode} onValueChange={(value: "separated" | "combined") => setViewMode(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="View Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="separated">Separated View</SelectItem>
                      <SelectItem value="combined">Combined View</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setStatusFilter("all")
                      setStartDate("")
                      setEndDate("")
                      setDepartmentFilter("all")
                      setViewMode("separated")
                    }}
                    className="w-full"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Clear
                  </Button>

                  <Button
                    onClick={exportToPDF}
                    disabled={selectedItems.prescriptions.size === 0 && selectedItems.reports.size === 0}
                    className="bg-green-600 hover:bg-green-700 w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {viewMode === "separated" ? (
          <Tabs
            defaultValue="prescriptions"
            className="space-y-6"
            onValueChange={(value) => setActiveTab(value as "prescriptions" | "reports")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="prescriptions">Prescriptions ({filteredPrescriptions.length})</TabsTrigger>
              <TabsTrigger value="reports">Reports ({filteredReports.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="prescriptions" className="space-y-6">
              {filteredPrescriptions.map((prescription) => (
                <Card key={prescription.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedItems.prescriptions.has(prescription.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedItems.prescriptions)
                            if (e.target.checked) {
                              newSelected.add(prescription.id)
                            } else {
                              newSelected.delete(prescription.id)
                            }
                            setSelectedItems((prev) => ({ ...prev, prescriptions: newSelected }))
                          }}
                          className="mr-2"
                        />
                        <FolderOpen className="h-5 w-5 text-blue-600" />
                        <div>
                          <CardTitle className="text-lg">Dr. {prescription.doctor_name}</CardTitle>
                          {prescription.department && (
                            <Badge variant="secondary" className="mt-1">
                              {prescription.department}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>Visited: {new Date(prescription.visited_date).toLocaleDateString()}</p>
                        <p>Added: {new Date(prescription.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {prescription.images.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-3 flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>Images ({prescription.images.length})</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              openImageGallery(prescription.images.map((img) => ({ ...img, type: "prescription" })))
                            }
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View All
                          </Button>
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {prescription.images.map((image) => (
                            <div
                              key={image.prescription_img_id}
                              className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors cursor-pointer"
                            >
                              <AuthorizedImage
                                src={image.thumb}
                                alt="Prescription"
                                className="object-cover hover:scale-105 transition-transform"
                                onClick={() =>
                                  openImageGallery(
                                    prescription.images.map((img) => ({ ...img, type: "prescription" })),
                                    prescription.images.findIndex(
                                      (img) => img.prescription_img_id === image.prescription_img_id,
                                    ),
                                  )
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              {filteredReports.map((report) => (
                <Card key={report.id} className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedItems.reports.has(report.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedItems.reports)
                            if (e.target.checked) {
                              newSelected.add(report.id)
                            } else {
                              newSelected.delete(report.id)
                            }
                            setSelectedItems((prev) => ({ ...prev, reports: newSelected }))
                          }}
                          className="mr-2"
                        />
                        <FileText className="h-5 w-5 text-green-600" />
                        <div>
                          <CardTitle className="text-lg">{report.test_name}</CardTitle>
                          {report.title && <p className="text-sm text-gray-600 mt-1">{report.title}</p>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge variant={report.normal_or_not === "Normal" ? "default" : "destructive"}>
                          {report.normal_or_not === "Normal" ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <AlertCircle className="h-3 w-3 mr-1" />
                          )}
                          {report.normal_or_not}
                        </Badge>
                        <div className="text-sm text-gray-500 text-right">
                          <p>Delivered: {new Date(report.delivery_date).toLocaleDateString()}</p>
                          <p>Created: {new Date(report.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {report.images.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3 flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>Images ({report.images.length})</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openImageGallery(report.images.map((img) => ({ ...img, type: "report" })))}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View All
                          </Button>
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {report.images.map((image) => (
                            <div
                              key={image.report_img_id}
                              className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-green-400 transition-colors cursor-pointer"
                            >
                              <AuthorizedImage
                                src={image.thumb}
                                alt="Report"
                                className="object-cover hover:scale-105 transition-transform"
                                onClick={() =>
                                  openImageGallery(
                                    report.images.map((img) => ({ ...img, type: "report" })),
                                    report.images.findIndex((img) => img.report_img_id === image.report_img_id),
                                  )
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Combined Medical Records</h2>

            {/* Prescriptions with their reports */}
            {filteredPrescriptions.map((prescription) => (
              <Card key={`prescription-${prescription.id}`} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.prescriptions.has(prescription.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedItems.prescriptions)
                          if (e.target.checked) {
                            newSelected.add(prescription.id)
                          } else {
                            newSelected.delete(prescription.id)
                          }
                          setSelectedItems((prev) => ({ ...prev, prescriptions: newSelected }))
                        }}
                        className="mr-2"
                      />
                      <FolderOpen className="h-5 w-5 text-blue-600" />
                      <div>
                        <CardTitle className="text-lg">Dr. {prescription.doctor_name}</CardTitle>
                        {prescription.department && (
                          <Badge variant="secondary" className="mt-1">
                            {prescription.department}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>Visited: {new Date(prescription.visited_date).toLocaleDateString()}</p>
                      <p>Added: {new Date(prescription.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {prescription.images.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-3 flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>Images ({prescription.images.length})</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            openImageGallery(prescription.images.map((img) => ({ ...img, type: "prescription" })))
                          }
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View All
                        </Button>
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {prescription.images.map((image) => (
                          <div
                            key={image.prescription_img_id}
                            className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors cursor-pointer"
                          >
                            <AuthorizedImage
                              src={image.thumb}
                              alt="Prescription"
                              className="object-cover hover:scale-105 transition-transform"
                              onClick={() =>
                                openImageGallery(
                                  prescription.images.map((img) => ({
                                    ...img,
                                    type: "prescription" as const,
                                    alt: "Prescription Image",
                                    src: img.resiged || img.thumb,
                                  })),
                                  prescription.images.findIndex(
                                    (img) => img.prescription_img_id === image.prescription_img_id,
                                  ),
                                )
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Associated Reports */}
                  {prescription.reports.length > 0 && (
                    <div className="mt-6 pl-4 border-l-2 border-green-200">
                      <h4 className="font-medium mb-3 text-green-700">
                        Associated Reports ({prescription.reports.length})
                      </h4>
                      <div className="space-y-4">
                        {prescription.reports.map((report) => (
                          <div key={report.id} className="bg-green-50 p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={selectedItems.reports.has(report.id)}
                                  onChange={(e) => {
                                    const newSelected = new Set(selectedItems.reports)
                                    if (e.target.checked) {
                                      newSelected.add(report.id)
                                    } else {
                                      newSelected.delete(report.id)
                                    }
                                    setSelectedItems((prev) => ({ ...prev, reports: newSelected }))
                                  }}
                                  className="mr-2"
                                />
                                <h5 className="font-medium">{report.test_name}</h5>
                              </div>
                              <Badge variant={report.normal_or_not === "Normal" ? "default" : "destructive"}>
                                {report.normal_or_not === "Normal" ? (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                )}
                                {report.normal_or_not}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 mb-3">
                              <p>Delivered: {new Date(report.delivery_date).toLocaleDateString()}</p>
                              <p>Created: {new Date(report.created_at).toLocaleDateString()}</p>
                            </div>
                            {report.images.length > 0 && (
                              <div>
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-sm font-medium">Images ({report.images.length})</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      openImageGallery(report.images.map((img) => ({ ...img, type: "report" })))
                                    }
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View All
                                  </Button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                  {report.images.map((image) => (
                                    <div
                                      key={image.report_img_id}
                                      className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-green-400 transition-colors cursor-pointer"
                                    >
                                      <AuthorizedImage
                                        src={image.thumb}
                                        alt="Report"
                                        className="object-cover hover:scale-105 transition-transform"
                                        onClick={() =>
                                          openImageGallery(
                                            report.images.map((img) => ({ ...img, type: "report" })),
                                            report.images.findIndex((img) => img.report_img_id === image.report_img_id),
                                          )
                                        }
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Standalone Reports */}
            {data.standaloneReports.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Standalone Reports</h3>
                <div className="space-y-4">
                  {data.standaloneReports
                    .filter((report) => {
                      const searchMatch =
                        searchTerm === "" ||
                        report.test_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (report.title && report.title.toLowerCase().includes(searchTerm.toLowerCase()))

                      const statusMatch =
                        statusFilter === "all" ||
                        (statusFilter === "normal" && report.normal_or_not === "Normal") ||
                        (statusFilter === "abnormal" && report.normal_or_not === "Abnormal")

                      const reportDate = new Date(report.delivery_date)
                      let dateMatch = true

                      if (startDate) {
                        const start = new Date(startDate)
                        dateMatch = dateMatch && reportDate >= start
                      }

                      if (endDate) {
                        const end = new Date(endDate)
                        end.setHours(23, 59, 59, 999)
                        dateMatch = dateMatch && reportDate <= end
                      }

                      return searchMatch && statusMatch && dateMatch
                    })
                    .map((report) => (
                      <Card key={`standalone-${report.id}`} className="border-l-4 border-l-orange-500">
                        <CardHeader>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={selectedItems.reports.has(report.id)}
                                onChange={(e) => {
                                  const newSelected = new Set(selectedItems.reports)
                                  if (e.target.checked) {
                                    newSelected.add(report.id)
                                  } else {
                                    newSelected.delete(report.id)
                                  }
                                  setSelectedItems((prev) => ({ ...prev, reports: newSelected }))
                                }}
                                className="mr-2"
                              />
                              <FileText className="h-5 w-5 text-orange-600" />
                              <div>
                                <CardTitle className="text-lg">{report.test_name}</CardTitle>
                                {report.title && <p className="text-sm text-gray-600 mt-1">{report.title}</p>}
                                <Badge variant="outline" className="mt-1 text-orange-600 border-orange-600">
                                  Standalone
                                </Badge>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <Badge variant={report.normal_or_not === "Normal" ? "default" : "destructive"}>
                                {report.normal_or_not === "Normal" ? (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                )}
                                {report.normal_or_not}
                              </Badge>
                              <div className="text-sm text-gray-500 text-right">
                                <p>Delivered: {new Date(report.delivery_date).toLocaleDateString()}</p>
                                <p>Created: {new Date(report.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {report.images.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-3 flex items-center space-x-2">
                                <FileText className="h-4 w-4" />
                                <span>Images ({report.images.length})</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    openImageGallery(report.images.map((img) => ({ ...img, type: "report" })))
                                  }
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View All
                                </Button>
                              </h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {report.images.map((image) => (
                                  <div
                                    key={image.report_img_id}
                                    className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-orange-400 transition-colors cursor-pointer"
                                  >
                                    <AuthorizedImage
                                      src={image.thumb}
                                      alt="Report"
                                      className="object-cover hover:scale-105 transition-transform"
                                      onClick={() =>
                                        openImageGallery(
                                          report.images.map((img) => ({ ...img, type: "report" })),
                                          report.images.findIndex((img) => img.report_img_id === image.report_img_id),
                                        )
                                      }
                                    />
                                  </div>
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
          </div>
        )}
      </div>

      <Dialog
        open={imageGallery.isOpen}
        onOpenChange={(open) => setImageGallery((prev) => ({ ...prev, isOpen: open }))}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center justify-between">
              <span>
                Medical Images ({imageGallery.currentIndex + 1} of {imageGallery.images.length})
              </span>
              <Button variant="ghost" size="sm" onClick={() => setImageGallery((prev) => ({ ...prev, isOpen: false }))}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {imageGallery.images.length > 0 && (
            <div className="relative">
              <div className="relative h-[500px] bg-gray-100 flex items-center justify-center">
                <AuthorizedImage
                  src={imageGallery.images[imageGallery.currentIndex]?.src}
                  alt={imageGallery.images[imageGallery.currentIndex]?.alt}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              {imageGallery.images.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                    onClick={() =>
                      setImageGallery((prev) => ({
                        ...prev,
                        currentIndex: prev.currentIndex > 0 ? prev.currentIndex - 1 : prev.images.length - 1,
                      }))
                    }
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                    onClick={() =>
                      setImageGallery((prev) => ({
                        ...prev,
                        currentIndex: prev.currentIndex < prev.images.length - 1 ? prev.currentIndex + 1 : 0,
                      }))
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}

              <div className="p-4">
                <div className="flex justify-center space-x-2">
                  {imageGallery.images.map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === imageGallery.currentIndex ? "bg-blue-600" : "bg-gray-300"
                      }`}
                      onClick={() => setImageGallery((prev) => ({ ...prev, currentIndex: index }))}
                    />
                  ))}
                </div>
                <div className="text-center mt-2 text-sm text-gray-600">
                  {imageGallery.images[imageGallery.currentIndex]?.alt}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
