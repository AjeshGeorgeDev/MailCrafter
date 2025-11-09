"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, Smartphone, Tablet, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface DevicePreviewProps {
  children: React.ReactNode;
  className?: string;
}

const deviceSizes = {
  desktop: "100%",
  tablet: "768px",
  mobileSmall: "320px",
  mobile: "375px",
  mobileLarge: "414px",
};

export function DevicePreview({ children, className }: DevicePreviewProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<keyof typeof deviceSizes>("desktop");

  const deviceWidth = deviceSizes[selectedDevice];

  return (
    <div className={className}>
      <Tabs value={selectedDevice} onValueChange={(v) => setSelectedDevice(v as keyof typeof deviceSizes)}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="desktop">
              <Monitor className="h-4 w-4 mr-2" />
              Desktop
            </TabsTrigger>
            <TabsTrigger value="tablet">
              <Tablet className="h-4 w-4 mr-2" />
              Tablet
            </TabsTrigger>
            <TabsTrigger value="mobileSmall">
              <Smartphone className="h-4 w-4 mr-2" />
              320px
            </TabsTrigger>
            <TabsTrigger value="mobile">
              <Smartphone className="h-4 w-4 mr-2" />
              375px
            </TabsTrigger>
            <TabsTrigger value="mobileLarge">
              <Smartphone className="h-4 w-4 mr-2" />
              414px
            </TabsTrigger>
          </TabsList>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
            {darkMode ? "Light" : "Dark"} Mode
          </Button>
        </div>

        <TabsContent value={selectedDevice} className="mt-0">
          <div
            className={`mx-auto border rounded-lg overflow-hidden ${
              darkMode ? "bg-gray-900" : "bg-white"
            }`}
            style={{
              width: deviceWidth === "100%" ? "100%" : deviceWidth,
              maxWidth: "100%",
              transition: "width 0.3s ease",
            }}
          >
            <div className="p-4 bg-gray-100 dark:bg-gray-800 border-b flex items-center justify-center">
              <div className="text-xs text-muted-foreground">{deviceWidth}</div>
            </div>
            <div className={darkMode ? "dark" : ""}>
              {children}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

