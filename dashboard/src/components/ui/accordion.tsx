import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const AccordionContext = React.createContext<{
    expanded: string | null
    setExpanded: (value: string | null) => void
}>({ expanded: null, setExpanded: () => { } })

export function Accordion({
    value,
    onValueChange,
    children,
    className
}: {
    value?: string
    onValueChange?: (value: string) => void
    children: React.ReactNode
    className?: string
}) {
    const [internalState, setInternalState] = React.useState<string | null>(value || null)

    const setExpanded = (val: string | null) => {
        setInternalState(val);
        if (val && onValueChange) onValueChange(val);
    }

    React.useEffect(() => {
        if (value !== undefined) setInternalState(value);
    }, [value]);

    return (
        <AccordionContext.Provider value={{ expanded: internalState, setExpanded }}>
            <div className={className}>{children}</div>
        </AccordionContext.Provider>
    )
}

export function AccordionItem({ children, className }: { value: string, children: React.ReactNode, className?: string }) {
    return <div className={cn("border-b", className)}>{children}</div>
}

export function AccordionTrigger({ children, className, value }: { children: React.ReactNode, className?: string, value: string }) {
    const { expanded, setExpanded } = React.useContext(AccordionContext)
    const isOpen = expanded === value

    return (
        <button
            onClick={() => setExpanded(isOpen ? null : value)}
            className={cn(
                "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
                className
            )}
            data-state={isOpen ? "open" : "closed"}
        >
            {children}
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
        </button>
    )
}

export function AccordionContent({ children, className, value }: { children: React.ReactNode, className?: string, value: string }) {
    const { expanded } = React.useContext(AccordionContext)
    const isOpen = expanded === value

    if (!isOpen) return null

    return (
        <div className={cn("overflow-hidden text-sm transition-all animate-in slide-in-from-top-1", className)}>
            <div className="pb-4 pt-0">{children}</div>
        </div>
    )
}
