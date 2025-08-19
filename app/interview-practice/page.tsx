"use client"

import InterviewPractice from "../../interview-practice.tsx"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function InterviewPracticePage() {
  const [moduleType, setModuleType] = useState("hr")
  const router = useRouter()
  
  const handleBack = () => {
    router.push("/")
  }
  
  return (
    <InterviewPractice 
      moduleType={moduleType} 
      onBack={handleBack} 
    />
  )
}
