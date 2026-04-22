import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type SelectOption<T extends string> = {
  value: T;
  label: string;
  icon: LucideIcon;
};

export default function SelectMenu<T extends string>({
  selected,
  defaultLabel,
  options,
  onSelect,
  leadingIcon: LeadingIcon,
}: {
  selected: T;
  defaultLabel: string;
  options: SelectOption<T>[];
  onSelect: (value: T) => void;
  leadingIcon: LucideIcon;
}) {
  const selectedLabel = options.find((opt) => opt.value === selected)?.label ?? defaultLabel;
  const isDefault = selected === options[0].value;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-1.5 rounded-lg text-[13px] font-medium transition-colors",
            isDefault
              ? "bg-muted/50 hover:bg-muted"
              : "border-transparent bg-primary/10 text-primary hover:bg-primary/20"
          )}
        >
          <LeadingIcon className="size-[14px]" strokeWidth={2} />
          <span>{isDefault ? defaultLabel : selectedLabel}</span>
          <ChevronDown className={cn("size-[14px]", isDefault ? "text-muted-foreground/70" : "text-primary/70")} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 p-1">
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onSelect={() => onSelect(opt.value)}
            className={cn(
              "flex items-center gap-2.5 px-2 py-1.5 text-[13px] cursor-pointer",
              selected === opt.value && "font-medium text-primary bg-primary/5"
            )}
          >
            <opt.icon className={cn("size-[16px]", selected === opt.value ? "text-primary" : "text-muted-foreground")} />
            <span className="flex-1">{opt.label}</span>
            {selected === opt.value && <Check className="size-[14px] text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
