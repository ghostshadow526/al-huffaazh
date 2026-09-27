
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
    options: { value: string; label: string }[];
    onSelect: (value: string) => void;
    placeholder?: string;
    searchText?: string;
    disabled?: boolean;
    value?: string;
    className?: string;
}

export function Combobox({ options, onSelect, placeholder = "Select an option...", searchText = "Search...", disabled = false, value, className }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [internalValue, setInternalValue] = React.useState(value || "")
  
  React.useEffect(() => {
    setInternalValue(value || "");
  }, [value]);


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-11 sm:h-12 text-base rounded-lg border-2 font-normal", className)}
          disabled={disabled}
        >
          <span className="truncate">
            {internalValue
              ? options.find((option) => option.value === internalValue)?.label
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] max-w-[calc(100vw-32px)] p-0 z-50 rounded-xl shadow-xl border-2" align="start">
        <Command>
          <CommandInput placeholder={searchText} className="h-11 text-base" />
          <CommandList className="max-h-60">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.value}`}
                  onSelect={() => {
                    const newValue = option.value === internalValue ? "" : option.value;
                    setInternalValue(newValue);
                    onSelect(newValue);
                    setOpen(false)
                  }}
                  className="py-2.5 text-base cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      internalValue === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
