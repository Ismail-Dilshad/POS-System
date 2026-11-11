import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { Clock, ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from '@/hooks/use-translation'

interface TimePickerProps {
  value?: string
  onChange?: (time: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  id?: string
}

interface ManualTimeInputProps {
  onTimeSelect: (time: string) => void
  parseInputTime: (input: string) => string | null
}

function ManualTimeInput({ onTimeSelect, parseInputTime }: ManualTimeInputProps) {
  const { t } = useTranslation()
  const [hour, setHour] = useState("")
  const [minute, setMinute] = useState("")
  const [errors, setErrors] = useState({ hour: false, minute: false })

  const validateAndSetHour = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 2)
    let validValue = numericValue

    if (numericValue) {
      const hourNum = parseInt(numericValue, 10)

      // If user types single digit > 2, prepend 0 (e.g., "5" becomes "05")
      if (numericValue.length === 1 && hourNum > 2) {
        validValue = '0' + numericValue
      }
      // Validate hour range (00-23)
      else if (numericValue.length === 2) {
        if (hourNum < 0 || hourNum > 23) {
          setErrors(prev => ({ ...prev, hour: true }))
          return
        }
      }
    }

    setErrors(prev => ({ ...prev, hour: false }))
    setHour(validValue)

    // Auto-focus next field when hour is complete and valid
    if (validValue.length === 2) {
      const minuteInput = document.getElementById('manual-minute-input') as HTMLInputElement
      minuteInput?.focus()
    }
  }

  const validateAndSetMinute = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 2)
    let validValue = numericValue

    if (numericValue) {
      const minuteNum = parseInt(numericValue, 10)

      // If user types single digit > 5, prepend 0 (e.g., "5" becomes "05")
      if (numericValue.length === 1 && minuteNum > 5) {
        validValue = '0' + numericValue
      }
      // Validate minute range (00-59)
      else if (numericValue.length === 2) {
        if (minuteNum < 0 || minuteNum > 59) {
          setErrors(prev => ({ ...prev, minute: true }))
          return
        }
      }
    }

    setErrors(prev => ({ ...prev, minute: false }))
    setMinute(validValue)

    // Auto-submit when minute is complete
    if (validValue.length === 2) {
      tryParseTime()
    }
  }

  const tryParseTime = () => {
    // Check if all fields are filled and no errors
    if (hour && minute && !errors.hour && !errors.minute) {
      const hourNum = parseInt(hour, 10)
      const minuteNum = parseInt(minute, 10)

      // Final validation: check if the complete time is valid
      if (hourNum >= 0 && hourNum <= 23 && minuteNum >= 0 && minuteNum <= 59) {
        const timeString = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
        const parsedTime = parseInputTime(timeString)
        if (parsedTime) {
          onTimeSelect(parsedTime)
          // Clear inputs and errors
          setHour("")
          setMinute("")
          setErrors({ hour: false, minute: false })
        }
      } else {
        setErrors(prev => ({ ...prev, hour: true, minute: true }))
      }
    }
  }

  const handleInputChange = (value: string, field: 'hour' | 'minute') => {
    if (field === 'hour') {
      validateAndSetHour(value)
    } else if (field === 'minute') {
      validateAndSetMinute(value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, field: 'hour' | 'minute') => {
    if (e.key === 'Enter' || e.key === ':') {
      e.preventDefault()
      if (field === 'hour') {
        const minuteInput = document.getElementById('manual-minute-input') as HTMLInputElement
        minuteInput?.focus()
      } else if (field === 'minute') {
        tryParseTime()
      }
    } else if (e.key === 'Backspace' && (e.target as HTMLInputElement).value === '') {
      // Move to previous field on backspace if current field is empty
      if (field === 'minute') {
        const hourInput = document.getElementById('manual-hour-input') as HTMLInputElement
        hourInput?.focus()
      }
    }
  }

  return (
    <div className={`flex items-center gap-1 bg-background border rounded-md px-2 py-1 h-8 flex-1 ${
      errors.hour || errors.minute ? 'border-destructive' : 'border-input-border'
    }`}>
      <input
        id="manual-hour-input"
        type="text"
        value={hour}
        onChange={(e) => handleInputChange(e.target.value, 'hour')}
        onKeyDown={(e) => handleKeyDown(e, 'hour')}
        onClick={(e) => e.stopPropagation()}
        placeholder={t('ui_components.time_picker.hour_placeholder')}
        className={`w-6 text-xs text-center bg-transparent border-none outline-none placeholder:text-muted-foreground ${
          errors.hour ? 'text-destructive' : ''
        }`}
        maxLength={2}
      />
      <span className="text-xs text-muted-foreground">:</span>
      <input
        id="manual-minute-input"
        type="text"
        value={minute}
        onChange={(e) => handleInputChange(e.target.value, 'minute')}
        onKeyDown={(e) => handleKeyDown(e, 'minute')}
        onClick={(e) => e.stopPropagation()}
        onBlur={tryParseTime}
        placeholder={t('ui_components.time_picker.minute_placeholder')}
        className={`w-6 text-xs text-center bg-transparent border-none outline-none placeholder:text-muted-foreground ${
          errors.minute ? 'text-destructive' : ''
        }`}
        maxLength={2}
      />
    </div>
  )
}

export function TimePicker({
  value = "",
  onChange,
  placeholder,
  className,
  disabled = false,
  id
}: TimePickerProps) {
  const { t } = useTranslation()
  const resolvedPlaceholder = placeholder ?? t('ui_components.time_picker.placeholder')
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [selectedTime, setSelectedTime] = useState<string | null>(() => {
    if (value) {
      try {
        // Validate time format (HH:MM)
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
        if (timeRegex.test(value)) {
          return value
        }
      } catch {
        console.warn('Invalid time format:', value)
      }
    }
    return null
  })
  const [viewTime, setViewTime] = useState(() => {
    if (value) {
      const [hour, minute] = value.split(':').map(Number)
      return { hour: hour || 0, minute: minute || 0 }
    }
    return { hour: new Date().getHours(), minute: new Date().getMinutes() }
  })
  const [popupPosition, setPopupPosition] = useState<'below' | 'above'>('below')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Calculate popup position
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const popupHeight = 300 // Approximate height of the popup
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

  // Close time picker when clicking outside
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
        // Validate time format (HH:MM)
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
        if (timeRegex.test(value)) {
          setInputValue(formatDisplayTime(value))
          setSelectedTime(value)
          const [hour, minute] = value.split(':').map(Number)
          setViewTime({ hour, minute })
        } else {
          setInputValue("")
          setSelectedTime(null)
        }
      } catch {
        console.warn('Invalid time format:', value)
        setInputValue("")
        setSelectedTime(null)
      }
    } else {
      setInputValue("")
      setSelectedTime(null)
    }
  }, [value])


  const formatDisplayTime = (time: string) => {
    const [hour, minute] = time.split(':').map(Number)
    const date = new Date()
    date.setHours(hour, minute)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const parseInputTime = (input: string): string | null => {
    if (!input.trim()) return null

    // Remove any non-numeric characters except : and spaces
    const cleaned = input.replace(/[^\d:\s]/g, '').trim()

    // Try different time formats
    const formats = [
      // HH:MM format (24-hour)
      /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/,
      // H:MM format
      /^([0-9]):([0-5][0-9])$/,
      // HH:M format
      /^([01]?[0-9]|2[0-3]):([0-9])$/,
    ]

    for (let i = 0; i < formats.length; i++) {
      const match = cleaned.match(formats[i])
      if (match) {
        const hour = parseInt(match[1], 10)
        const minute = parseInt(match[2], 10)

        // Validate the time
        if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
          return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        }
      }
    }

    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    // Only parse and update if the input is complete or empty
    if (newValue.trim() === '') {
      setSelectedTime(null)
      onChange?.("")
      return
    }

    const parsedTime = parseInputTime(newValue)
    if (parsedTime) {
      setSelectedTime(parsedTime)
      const [hour, minute] = parsedTime.split(':').map(Number)
      setViewTime({ hour, minute })
      onChange?.(parsedTime)
    }
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setInputValue(formatDisplayTime(time))
    onChange?.(time)
    setIsOpen(false)
  }

  const handleNow = () => {
    const now = new Date()
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    handleTimeSelect(timeString)
    setViewTime({ hour: now.getHours(), minute: now.getMinutes() })
  }

  const navigateHour = (direction: 'up' | 'down') => {
    setViewTime(prev => {
      let newHour = prev.hour
      if (direction === 'up') {
        newHour = (newHour + 1) % 24
      } else {
        newHour = newHour === 0 ? 23 : newHour - 1
      }
      return { ...prev, hour: newHour }
    })
  }

  const navigateMinute = (direction: 'up' | 'down') => {
    setViewTime(prev => {
      let newMinute = prev.minute
      if (direction === 'up') {
        newMinute = (newMinute + 1) % 60
      } else {
        newMinute = newMinute === 0 ? 59 : newMinute - 1
      }
      return { ...prev, minute: newMinute }
    })
  }

  const handleTimeClick = () => {
    const timeString = `${viewTime.hour.toString().padStart(2, '0')}:${viewTime.minute.toString().padStart(2, '0')}`
    handleTimeSelect(timeString)
  }

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
        {selectedTime && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {formatDisplayTime(selectedTime)}
          </div>
        )}
      </div>

      {isOpen && (
        <div className={`absolute left-0 z-[9999] w-64 bg-popover border-0 primary/10 rounded-lg shadow-lg backdrop-blur-sm animate-in fade-in-0 zoom-in-95 duration-200 ${
          popupPosition === 'above' 
            ? 'bottom-full mb-2' 
            : 'top-full mt-2'
        }`}
             style={{ zIndex: 9999 }}
             onClick={(e) => e.stopPropagation()}
             onMouseDown={(e) => e.stopPropagation()}>
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-center mb-4">
              <div className="text-lg font-medium">
                {viewTime.hour.toString().padStart(2, '0')}:{viewTime.minute.toString().padStart(2, '0')}
              </div>
            </div>

            {/* Time Controls */}
            <div className="flex items-center justify-center gap-4 mb-4">
              {/* Hour Controls */}
              <div className="flex flex-col items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateHour('up');
                  }}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <div className="text-2xl font-bold min-w-[3rem] text-center">
                  {viewTime.hour.toString().padStart(2, '0')}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateHour('down');
                  }}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-2xl font-bold text-muted-foreground">:</div>

              {/* Minute Controls */}
              <div className="flex flex-col items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateMinute('up');
                  }}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <div className="text-2xl font-bold min-w-[3rem] text-center">
                  {viewTime.minute.toString().padStart(2, '0')}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateMinute('down');
                  }}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Select Button */}
            <div className="flex justify-center mb-4">
              <Button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTimeClick();
                }}
                className="px-6 py-2 text-sm hover:bg-primary/10"
              >
                {t('ui_components.time_picker.select_time')}
              </Button>
            </div>

            {/* Manual Input Section */}
            <div className="pt-3 border-t border-border space-y-3">
              <div className="text-xs font-medium text-muted-foreground">{t('ui_components.time_picker.manual_entry_label')}</div>
              <div className="flex gap-2">
                <ManualTimeInput
                  onTimeSelect={handleTimeSelect}
                  parseInputTime={parseInputTime}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNow();
                  }}
                  className="h-8 px-3 text-xs hover:bg-primary/10 flex items-center gap-2"
                >
                  <Clock className="h-3 w-3" />
                  {t('ui_components.time_picker.now')}
                </Button>
              </div>
            </div>

            {/* Footer */}
            {selectedTime && (
              <div className="pt-2 text-center">
                <div className="text-xs text-muted-foreground">
                  Selected: {formatDisplayTime(selectedTime)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
