
import {
  useToast as useToastOriginal,
  type ToastActionElement,
} from "@/components/ui/toast"

export const useToast = useToastOriginal

export type Toast = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  open: boolean
}
