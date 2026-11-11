import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from '@/hooks/use-translation'

interface DatePickerProps {
  value?: string
  onChange?: (date: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  id?: string
}

const MONTH_KEYS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december"
] as const

const WEEKDAY_KEYS = ["su", "mo", "tu", "we", "th", "fr", "sa"] as const

interface ManualDateInputProps {
  onDateSelect: (date: Date) => void
  parseInputDate: (input: string) => Date | null
}

function ManualDateInput({ onDateSelect, parseInputDate }: ManualDateInputProps) {
  const { t } = useTranslation()
  const [day, setDay] = useState("")
  const [month, setMonth] = useState("")
  const [year, setYear] = useState("")
  const [errors, setErrors] = useState({ day: false, month: false, year: false })

  const validateAndSetDay = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 2)
    let validValue = numericValue

    if (numericValue) {
      const dayNum = parseInt(numericValue, 10)

      // If user types single digit > 3, prepend 0 (e.g., "5" becomes "05")
      if (numericValue.length === 1 && dayNum > 3) {
        validValue = '0' + numericValue
      }
      // Validate day range (01-31)
      else if (numericValue.length === 2) {
        if (dayNum < 1 || dayNum > 31) {
          setErrors(prev => ({ ...prev, day: true }))
          return
        }
        // Additional validation based on month
        if (month) {
          const monthNum = parseInt(month, 10)
          const daysInMonth = getDaysInMonth(monthNum, year ? parseInt(year, 10) : new Date().getFullYear())
          if (dayNum > daysInMonth) {
            setErrors(prev => ({ ...prev, day: true }))
            return
          }
        }
      }
    }

    setErrors(prev => ({ ...prev, day: false }))
    setDay(validValue)

    // Auto-focus next field when day is complete and valid
    if (validValue.length === 2) {
      const monthInput = document.getElementById('manual-month-input') as HTMLInputElement
      monthInput?.focus()
    }
  }

  const validateAndSetMonth = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 2)
    let validValue = numericValue

    if (numericValue) {
      const monthNum = parseInt(numericValue, 10)

      // If user types single digit > 1, prepend 0 (e.g., "5" becomes "05")
      if (numericValue.length === 1 && monthNum > 1) {
        validValue = '0' + numericValue
      }
      // Validate month range (01-12)
      else if (numericValue.length === 2) {
        if (monthNum < 1 || monthNum > 12) {
          setErrors(prev => ({ ...prev, month: true }))
          return
        }
        // Revalidate day if it exists
        if (day) {
          const dayNum = parseInt(day, 10)
          const daysInMonth = getDaysInMonth(monthNum, year ? parseInt(year, 10) : new Date().getFullYear())
          if (dayNum > daysInMonth) {
            setErrors(prev => ({ ...prev, day: true }))
          } else {
            setErrors(prev => ({ ...prev, day: false }))
          }
        }
      }
    }

    setErrors(prev => ({ ...prev, month: false }))
    setMonth(validValue)

    // Auto-focus next field when month is complete and valid
    if (validValue.length === 2) {
      const yearInput = document.getElementById('manual-year-input') as HTMLInputElement
      yearInput?.focus()
    }
  }

  const validateAndSetYear = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 4)
    const currentYear = new Date().getFullYear()

    if (numericValue.length === 4) {
      const yearNum = parseInt(numericValue, 10)
      // Validate year range (1900 - current year + 50)
      if (yearNum < 1900 || yearNum > currentYear + 50) {
        setErrors(prev => ({ ...prev, year: true }))
        return
      }
      // Revalidate day if it exists (for leap year check)
      if (day && month) {
        const dayNum = parseInt(day, 10)
        const monthNum = parseInt(month, 10)
        const daysInMonth = getDaysInMonth(monthNum, yearNum)
        if (dayNum > daysInMonth) {
          setErrors(prev => ({ ...prev, day: true }))
        } else {
          setErrors(prev => ({ ...prev, day: false }))
        }
      }
    }

    setErrors(prev => ({ ...prev, year: false }))
    setYear(numericValue)
  }

  const getDaysInMonth = (month: number, year: number): number => {
    // February in leap year
    if (month === 2) {
      return isLeapYear(year) ? 29 : 28
    }
    // April, June, September, November have 30 days
    if ([4, 6, 9, 11].includes(month)) {
      return 30
    }
    // All other months have 31 days
    return 31
  }

  const isLeapYear = (year: number): boolean => {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
  }

  const handleInputChange = (value: string, field: 'day' | 'month' | 'year') => {
    if (field === 'day') {
      validateAndSetDay(value)
    } else if (field === 'month') {
      validateAndSetMonth(value)
    } else if (field === 'year') {
      validateAndSetYear(value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, field: 'day' | 'month' | 'year') => {
    if (e.key === 'Enter' || e.key === '/') {
      e.preventDefault()
      if (field === 'day') {
        const monthInput = document.getElementById('manual-month-input') as HTMLInputElement
        monthInput?.focus()
      } else if (field === 'month') {
        const yearInput = document.getElementById('manual-year-input') as HTMLInputElement
        yearInput?.focus()
      } else if (field === 'year') {
        tryParseDate()
      }
    } else if (e.key === 'Backspace' && (e.target as HTMLInputElement).value === '') {
      // Move to previous field on backspace if current field is empty
      if (field === 'month') {
        const dayInput = document.getElementById('manual-day-input') as HTMLInputElement
        dayInput?.focus()
      } else if (field === 'year') {
        const monthInput = document.getElementById('manual-month-input') as HTMLInputElement
        monthInput?.focus()
      }
    }
  }

  const tryParseDate = () => {
    // Check if all fields are filled and no errors
    if (day && month && year && !errors.day && !errors.month && !errors.year) {
      const dayNum = parseInt(day, 10)
      const monthNum = parseInt(month, 10)
      const yearNum = parseInt(year, 10)

      // Final validation: check if the complete date is valid
      const daysInMonth = getDaysInMonth(monthNum, yearNum)
      if (dayNum <= daysInMonth) {
        const dateString = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`
        const parsedDate = parseInputDate(dateString)
        if (parsedDate) {
          onDateSelect(parsedDate)
          // Clear inputs and errors
          setDay("")
          setMonth("")
          setYear("")
          setErrors({ day: false, month: false, year: false })
        }
      } else {
        setErrors(prev => ({ ...prev, day: true }))
      }
    }
  }

  return (
    <div className={`flex items-center gap-1 bg-background border rounded-md px-2 py-1 h-8 flex-1 ${
      errors.day || errors.month || errors.year ? 'border-destructive' : 'border-input-border'
    }`}>
      <input
        id="manual-day-input"
        type="text"
        value={day}
        onChange={(e) => handleInputChange(e.target.value, 'day')}
        onKeyDown={(e) => handleKeyDown(e, 'day')}
        onClick={(e) => e.stopPropagation()}
        placeholder={t('ui_components.date_picker.day_placeholder')}
        className={`w-6 text-xs text-center bg-transparent border-none outline-none placeholder:text-muted-foreground ${
          errors.day ? 'text-destructive' : ''
        }`}
        maxLength={2}
      />
      <span className="text-xs text-muted-foreground">/</span>
      <input
        id="manual-month-input"
        type="text"
        value={month}
        onChange={(e) => handleInputChange(e.target.value, 'month')}
        onKeyDown={(e) => handleKeyDown(e, 'month')}
        onClick={(e) => e.stopPropagation()}
        placeholder={t('ui_components.date_picker.month_placeholder')}
        className={`w-6 text-xs text-center bg-transparent border-none outline-none placeholder:text-muted-foreground ${
          errors.month ? 'text-destructive' : ''
        }`}
        maxLength={2}
      />
      <span className="text-xs text-muted-foreground">/</span>
      <input
        id="manual-year-input"
        type="text"
        value={year}
        onChange={(e) => handleInputChange(e.target.value, 'year')}
        onKeyDown={(e) => handleKeyDown(e, 'year')}
        onClick={(e) => e.stopPropagation()}
        onBlur={tryParseDate}
        placeholder={t('ui_components.year_placeholder')}
        className={`w-10 text-xs text-center bg-transparent border-none outline-none placeholder:text-muted-foreground ${
          errors.year ? 'text-destructive' : ''
        }`}
        maxLength={4}
      />
    </div>
  )
}

export function DatePicker({
  value = "",
  onChange,
  placeholder,
  className,
  disabled = false,
  id
}: DatePickerProps) {
  const { t } = useTranslation()
  const resolvedPlaceholder = placeholder ?? t('ui_components.date_picker.placeholder')
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    if (value) {
      try {
        // Parse date in local timezone to avoid timezone issues
        const [year, month, day] = value.split('-').map(Number)
        const date = new Date(year, month - 1, day) // month is 0-indexed
        // Validate the date
        if (!isNaN(date.getTime()) && 
            date.getFullYear() === year && 
            date.getMonth() === month - 1 && 
            date.getDate() === day) {
          return date
        }
      } catch {
        console.warn('Invalid date format:', value)
      }
    }
    return null
  })
  const [viewDate, setViewDate] = useState(new Date())
  const [popupPosition, setPopupPosition] = useState<'below' | 'above'>('below')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Calculate popup position
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const popupHeight = 400 // Approximate height of the popup
      const spaceBelow = viewportHeight - rect.bottom
      const spaceAbove = rect.top
      
      // Show above if there's not enough space below but enough space above
      if (spaceBelow < popupHeight && spaceAbove > popupHeight) {
        setPopupPosition('above')
      } else {
        setPopupPosition('below')
      }
    }
  }, [isOpen])

  // Close calendar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Update internal state when value prop changes
  useEffect(() => {
    if (value) {
      try {
        // Parse date in local timezone to avoid timezone issues
        const [year, month, day] = value.split('-').map(Number)
        const date = new Date(year, month - 1, day) // month is 0-indexed
        // Validate the date
        if (!isNaN(date.getTime()) && 
            date.getFullYear() === year && 
            date.getMonth() === month - 1 && 
            date.getDate() === day) {
          setInputValue(formatDisplayDate(date))
          setSelectedDate(date)
        } else {
          setInputValue("")
          setSelectedDate(null)
        }
      } catch {
        console.warn('Invalid date format:', value)
        setInputValue("")
        setSelectedDate(null)
      }
    } else {
      setInputValue("")
      setSelectedDate(null)
    }
  }, [value])

  const formatDate = (date: Date) => {
    // Format date as YYYY-MM-DD in local timezone to avoid timezone issues
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const parseInputDate = (input: string): Date | null => {
    if (!input.trim()) return null

    // Remove any non-numeric characters except / - . and spaces
    const cleaned = input.replace(/[^\d/\-.\s]/g, '').trim()

    // Try different date formats
    const formats = [
      // DD/MM/YYYY format (European style)
      /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/,
      // MM/DD/YYYY format (US style)
      /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/,
      // YYYY/MM/DD format (ISO style)
      /^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/,
      // DD/MM/YY format
      /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2})$/,
    ]

    for (let i = 0; i < formats.length; i++) {
      const match = cleaned.match(formats[i])
      if (match) {
        let day, month, year

        if (i === 0) {
          // DD/MM/YYYY (European)
          day = parseInt(match[1], 10)
          month = parseInt(match[2], 10) - 1 // Month is 0-indexed
          year = parseInt(match[3], 10)
        } else if (i === 1) {
          // MM/DD/YYYY (US) - but we'll prioritize DD/MM/YYYY
          // Only use this if day > 12 (indicating it's likely MM/DD format)
          const first = parseInt(match[1], 10)
          const second = parseInt(match[2], 10)
          if (first > 12 || second <= 12) {
            day = second
            month = first - 1
            year = parseInt(match[3], 10)
          } else {
            day = first
            month = second - 1
            year = parseInt(match[3], 10)
          }
        } else if (i === 2) {
          // YYYY/MM/DD (ISO)
          year = parseInt(match[1], 10)
          month = parseInt(match[2], 10) - 1
          day = parseInt(match[3], 10)
        } else if (i === 3) {
          // DD/MM/YY
          day = parseInt(match[1], 10)
          month = parseInt(match[2], 10) - 1
          year = parseInt(match[3], 10)
          // Assume 20xx for years 00-30, 19xx for years 31-99
          year = year <= 30 ? 2000 + year : 1900 + year
        }

        // Validate the date
        if (day && month !== undefined && year) {
          // Create date in local timezone to avoid timezone issues
          const date: Date = new Date(year, month, day)
          // Check if the date is valid and matches input values
          if (date.getFullYear() === year &&
              date.getMonth() === month &&
              date.getDate() === day) {
            return date
          }
        }
      }
    }

    // Fallback: try native Date parsing
    const fallback = new Date(cleaned)
    if (!isNaN(fallback.getTime())) {
      // Ensure the parsed date is valid and not in the future by more than 100 years
      const currentYear = new Date().getFullYear()
      const fallbackYear = fallback.getFullYear()
      if (fallbackYear >= 1900 && fallbackYear <= currentYear + 100) {
        return fallback
      }
    }
    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    // Only parse and update if the input is complete or empty
    if (newValue.trim() === '') {
      setSelectedDate(null)
      onChange?.("")
      return
    }

    const parsedDate = parseInputDate(newValue)
    if (parsedDate && !isNaN(parsedDate.getTime())) {
      setSelectedDate(parsedDate)
      setViewDate(parsedDate)
      onChange?.(formatDate(parsedDate))
    }
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setInputValue(formatDisplayDate(date))
    onChange?.(formatDate(date))
    setIsOpen(false)
  }

  const handleToday = () => {
    const today = new Date()
    handleDateSelect(today)
    setViewDate(today)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setViewDate(prevDate => {
      const newDate = new Date(prevDate)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSameDay = (date1: Date | null, date2: Date | null) => {
    if (!date1 || !date2) return false
    return date1.toDateString() === date2.toDateString()
  }

  const days = getDaysInMonth(viewDate)

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={resolvedPlaceholder}
          disabled={disabled}
          className={cn(
            "px-4 text-sm cursor-pointer transition-all duration-200",
            className
          )}
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) {
                setIsOpen(!isOpen);
            }
          }}
        />
      </div>

      {isOpen && (
        <div className={`absolute left-0 z-[9999] w-80 bg-popover border-0 primary/10 rounded-lg shadow-lg backdrop-blur-sm animate-in fade-in-0 zoom-in-95 duration-200 ${
          popupPosition === 'above' 
            ? 'bottom-full mb-2' 
            : 'top-full mt-2'
        }`}
             style={{ zIndex: 9999 }}
             onClick={(e) => e.stopPropagation()}
             onMouseDown={(e) => e.stopPropagation()}>
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateMonth('prev');
                }}
                className="h-8 w-8 p-0 hover:bg-primary/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="text-sm font-medium">
                {t(`months.${MONTH_KEYS[viewDate.getMonth()]}`)} {viewDate.getFullYear()}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateMonth('next');
                }}
                className="h-8 w-8 p-0 hover:bg-primary/10"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAY_KEYS.map(dayKey => (
                <div key={dayKey} className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">
                  {t(`ui_components.date_picker.weekdays_short.${dayKey}`)}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {days.map((day, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (day) {
                        handleDateSelect(day);
                    }
                  }}
                  disabled={!day}
                  className={cn(
                    "h-8 w-8 text-xs rounded-md transition-all duration-150 hover:bg-primary/10 focus:bg-primary/10 focus:outline-none",
                    !day && "cursor-default",
                    day && isToday(day) && "bg-primary/20 text-primary font-medium",
                    day && isSameDay(day, selectedDate) && "bg-primary text-primary-foreground hover:bg-primary/90",
                    day && !isToday(day) && !isSameDay(day, selectedDate) && "hover:bg-primary/5"
                  )}
                >
                  {day?.getDate()}
                </button>
              ))}
            </div>

            {/* Manual Input Section */}
            <div className="pt-3 border-t border-border space-y-3">
              <div className="text-xs font-medium text-muted-foreground">{t('ui_components.date_picker.manual_entry_label')}</div>
              <div className="flex gap-2">
                <ManualDateInput
                  onDateSelect={handleDateSelect}
                  parseInputDate={parseInputDate}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToday();
                  }}
                  className="h-8 px-3 text-xs hover:bg-primary/10 flex items-center gap-2"
                >
                  <Clock className="h-3 w-3" />
                  {t('ui_components.date_picker.today')}
                </Button>
              </div>
            </div>

            {/* Footer */}
            {selectedDate && (
              <div className="pt-2 text-center">
                <div className="text-xs text-muted-foreground">
                  {t('ui_components.date_picker.selected', { date: formatDisplayDate(selectedDate) })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}