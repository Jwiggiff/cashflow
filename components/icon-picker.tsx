"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { SearchIcon, Loader2 } from "lucide-react";
import { dynamicIconImports } from "lucide-react/dynamic";
import { useIsMobile } from "@/hooks/use-mobile";

interface IconPickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  className?: string;
  allowNone?: boolean;
}

export function IconPicker({
  value,
  onChange,
  label = "Select an icon",
  className,
  allowNone = false,
}: IconPickerProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIconComponent, setSelectedIconComponent] = useState<React.ComponentType<{ className?: string }> | null>(null);
  const [loadedIcons, setLoadedIcons] = useState<Map<string, React.ComponentType<{ className?: string }>>>(new Map());

  const iconNames = useMemo(() => Object.keys(dynamicIconImports).sort(), []);

  const filteredIcons = useMemo(() => {
    if (!searchQuery.trim()) {
      return iconNames.slice(0, 100); // Show first 100 icons by default
    }
    return iconNames
      .filter(name => name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 200); // Limit search results to 200
  }, [searchQuery, iconNames]);

  // Load selected icon when value changes
  useEffect(() => {
    if (value && dynamicIconImports[value as keyof typeof dynamicIconImports]) {
      dynamicIconImports[value as keyof typeof dynamicIconImports]().then(module => {
        setSelectedIconComponent(() => module.default);
      });
    } else {
      setSelectedIconComponent(null);
    }
  }, [value]);

  // Load icons as they come into view
  useEffect(() => {
    const loadIcons = async () => {
      const iconsToLoad = filteredIcons.filter(name => !loadedIcons.has(name));
      
      for (const iconName of iconsToLoad.slice(0, 20)) { // Load 20 at a time
        try {
          const importFn = dynamicIconImports[iconName as keyof typeof dynamicIconImports];
          if (importFn) {
            const iconModule = await importFn();
            setLoadedIcons(prev => new Map(prev).set(iconName, iconModule.default));
          }
        } catch (error) {
          console.error(`Failed to load icon ${iconName}:`, error);
        }
      }
    };

    loadIcons();
  }, [filteredIcons, loadedIcons]);

  const handleIconSelect = (iconName: string | null) => {
    onChange(iconName);
    setOpen(false);
    setSearchQuery("");
  };

  const triggerButton = (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "w-12 h-12 p-0 flex items-center justify-center",
        className
      )}
    >
      {selectedIconComponent && (() => {
        const IconComponent = selectedIconComponent;
        return <IconComponent className="h-5 w-5" />;
      })()}
    </Button>
  );

  const iconPickerContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {allowNone && (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="p-0"
            onClick={() => handleIconSelect(null)}
          >
            Remove
          </Button>
        )}
      </div>
      
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search icons..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="max-h-64 overflow-y-auto">
        <div className="grid grid-cols-8 gap-2">
          {filteredIcons.map((iconName) => {
            const IconComponent = loadedIcons.get(iconName);
            return (
              <Button
                key={iconName}
                type="button"
                variant={value === iconName ? "default" : "outline"}
                size="sm"
                className="w-8 h-8 p-0 flex flex-col items-center justify-center"
                onClick={() => handleIconSelect(iconName)}
                title={iconName}
              >
                {IconComponent ? (
                  (() => {
                    const Icon = IconComponent;
                    return <Icon className="h-4 w-4" />;
                  })()
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </Button>
            );
          })}
        </div>
        {filteredIcons.length === 0 && (
          <div className="text-center text-muted-foreground py-4">
            No icons found matching &quot;{searchQuery}&quot;
          </div>
        )}
      </div>
    </div>
  );

  // Mobile: Use Sheet (bottom sheet)
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {triggerButton}
        </SheetTrigger>
        <SheetContent side="bottom" className="h-auto max-h-[80vh] pb-16">
          <SheetHeader>
            <SheetTitle>{label}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">
            {iconPickerContent}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Use Popover
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {triggerButton}
      </PopoverTrigger>
      <PopoverContent className="w-96 p-4">
        {iconPickerContent}
      </PopoverContent>
    </Popover>
  );
}
